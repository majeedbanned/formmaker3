import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";
import { connectToDatabase } from "@/lib/mongodb";
import FormData from "form-data";

// Constants for OpenAI API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1";

// Set runtime to nodejs
export const runtime = 'nodejs';

// Load the configuration file
const loadConfigFile = (): string => {
  const configPath = path.join(
    process.cwd(),
    "src/app/admin/chatbot3/config-template.json"
  );
  return fs.readFileSync(configPath, "utf-8");
};

// Helper function to convert FormData to a buffer
async function formDataToBuffer(form: FormData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    form.on('error', (err) => reject(err));
    form.on('data', (chunk) => chunks.push(chunk));
    form.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Verify and get current user from auth token
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyJWT(token) as {
      userId: string;
      userType: string;
      schoolCode: string;
      username: string;
    };

    return {
      id: payload.userId,
      userType: payload.userType,
      schoolCode: payload.schoolCode,
      username: payload.username,
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

// Fetch existing assistant from database
const getExistingAssistant = async (userId: string, domain: string) => {
  try {
    const connection = await connectToDatabase(domain);
    const collection = connection.collection("openai_assistants");

    const assistant = await collection.findOne({
      userId,
      name: "MongoDB Query Assistant v7",
    });

    return assistant;
  } catch (error) {
    console.error("Error fetching assistant:", error);
    return null;
  }
};

// Delete an existing assistant
const deleteAssistant = async (assistantId: string, fileIds: string[], domain: string) => {
  try {
    // Delete the assistant
    await fetch(`${OPENAI_API_URL}/assistants/${assistantId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    });

    // Delete the associated files
    for (const fileId of fileIds) {
      await fetch(`${OPENAI_API_URL}/files/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      });
    }

    // Delete from database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection("openai_assistants");
    
    await collection.deleteOne({ id: assistantId });

    return true;
  } catch (error) {
    console.error("Error deleting assistant:", error);
    return false;
  }
};

// Upload a file to OpenAI
const uploadFileToOpenAI = async (content: string, filename: string, purpose: string) => {
  try {
    // Create a temporary file to store the data
    const tempFilePath = path.join(process.cwd(), filename);
    fs.writeFileSync(tempFilePath, content);
    
    // Create a form with the file data
    const form = new FormData();
    form.append('file', fs.createReadStream(tempFilePath), {
      filename,
      contentType: 'application/json',
    });
    form.append('purpose', purpose);

    // Convert formData to buffer for use with node-fetch
    const formBuffer = await formDataToBuffer(form);
    
    // Make the request with the proper headers from form-data
    const response = await fetch(`${OPENAI_API_URL}/files`, {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formBuffer,
    });

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`Failed to upload file: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error uploading file to OpenAI:', error);
    throw error;
  }
};

// Create a new OpenAI assistant
const createAssistant = async (userId: string, domain: string) => {
  try {
    const configData = JSON.parse(loadConfigFile());
    
    // Step 1: Upload schema as a file
    console.log('Uploading schema file to OpenAI...');
    const fileId = await uploadFileToOpenAI(
      JSON.stringify(configData.schema),
      'mongodb_schema.json',
      'assistants'
    );
    console.log('Schema file uploaded successfully with ID:', fileId);

    // Step 2: Create assistant with the uploaded file
    console.log('Creating assistant with file ID:', fileId);
    const createAssistantResponse = await fetch(`${OPENAI_API_URL}/assistants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        name: "MongoDB Query Assistant v7",
        description: "A specialized assistant for generating MongoDB queries from Farsi (Persian) questions",
        model: "gpt-4o-mini",
        instructions:JSON.stringify(configData),
        tools: [
          {
            type: "code_interpreter"
          }
        ],
        file_ids: [fileId],
        metadata: {
          version: "1.0",
          created_by: userId,
          updated_at: new Date().toISOString(),
        },
      }),
    });

    if (!createAssistantResponse.ok) {
      const errorData = await createAssistantResponse.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`Failed to create assistant: ${errorData.error?.message || createAssistantResponse.statusText}`);
    }

    const assistantData = await createAssistantResponse.json();
    console.log('Assistant created successfully with ID:', assistantData.id);

    // Save assistant data to database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection("openai_assistants");
    
    await collection.insertOne({
      id: assistantData.id,
      name: "MongoDB Query Assistant v7",
      userId,
      modelName: "gpt-4o-mini",
      fileIds: [fileId],
      createdAt: new Date(),
    });

    return assistantData;
  } catch (error) {
    console.error("Error creating assistant:", error);
    throw error;
  }
};

export async function POST(request: Request) {
  try {
    // Get domain from headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    console.log('Updating assistant config for domain:', domain);
    
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    console.log('User authenticated:', user.id);

    // Check if we already have an assistant
    const existingAssistant = await getExistingAssistant(user.id, domain);
    
    if (existingAssistant) {
      console.log('Found existing assistant, deleting:', existingAssistant.id);
      // Delete the existing assistant
      await deleteAssistant(existingAssistant.id, existingAssistant.fileIds, domain);
    } else {
      console.log('No existing assistant found');
    }

    // Create a new assistant with the updated configuration
    console.log('Creating new assistant with updated configuration');
    const assistant = await createAssistant(user.id, domain);
    
    return NextResponse.json({ assistantId: assistant.id });
  } catch (error) {
    console.error("Error in POST /api/chatbot7/config:", error);
    return NextResponse.json(
      { error: `Failed to update assistant configuration: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
} 