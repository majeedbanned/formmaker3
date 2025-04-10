import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";
import { connectToDatabase } from "@/lib/mongodb";
import FormData from "form-data";
import axios from "axios";
// Constants for OpenAI API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1";

// Validate that the API key is set
if (!OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY environment variable is not set!");
}

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
async function getCurrentUser() {
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

// Verify if assistant still exists in OpenAI
const verifyAssistant = async (assistantId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${OPENAI_API_URL}/assistants/${assistantId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error verifying assistant:", error);
    return false;
  }
};

// Upload a file to OpenAI

const uploadFileToOpenAI = async (content: string, filename: string, purpose: string) => {
    try {
      console.log(`Starting file upload process for ${filename} with size ${content.length} bytes`);
  
      const tempFilePath = path.join(process.cwd(), filename);
      fs.writeFileSync(tempFilePath, content);
  
      const form = new FormData();
      form.append("file", fs.createReadStream(tempFilePath), {
        filename,
        contentType: "application/json",
      });
      form.append("purpose", purpose);
  
      console.log("Sending form-data to OpenAI with axios...");
  
      const response = await axios.post(
        `${OPENAI_API_URL}/files`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2", // ✅ required
          },
          maxBodyLength: Infinity, // In case of large files
        }
      );
  
      fs.unlinkSync(tempFilePath);
  
      const data = response.data;
      console.log(`Successfully uploaded file with ID: ${data.id}`);
      return data.id;
    } catch (error: any) {
      console.error("Error uploading file to OpenAI:", error.response?.data || error.message);
      throw new Error(
        `Failed to upload file: ${error.response?.data?.error?.message || error.message}`
      );
    }
  };


// const uploadFileToOpenAI = async (content: string, filename: string, purpose: string) => {
//   try {
//     console.log(`Starting file upload process for ${filename} with size ${content.length} bytes`);
    
//     // Create a temporary file to store the data
//     const tempFilePath = path.join(process.cwd(), filename);
//     console.log(`Writing temporary file to ${tempFilePath}`);
//     fs.writeFileSync(tempFilePath, content);
//     console.log(`Temporary file created successfully`);
    
//     // Create a form with the file data
//     console.log(`Creating FormData object`);
//     const form = new FormData();
//     form.append('file', fs.createReadStream(tempFilePath), {
//       filename,
//       contentType: 'application/json',
//     });
//     form.append('purpose', purpose);
//     console.log(`FormData object created successfully`);

//     // Convert formData to buffer for use with node-fetch
//     console.log(`Converting FormData to buffer`);
//     const formBuffer = await formDataToBuffer(form);
//     console.log(`FormData converted to buffer successfully with size ${formBuffer.length} bytes`);
    
//     // Make the request with the proper headers from form-data with a timeout
//     console.log(`Making request to OpenAI API at ${OPENAI_API_URL}/files`);
//     console.log(`Using headers: ${JSON.stringify({...form.getHeaders(), 'Authorization': 'Bearer ****'})}`);
    
//     // Create a controller to implement timeout
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => {
//       controller.abort();
//       console.error('Request timed out after 60 seconds');
//     }, 60000); // 60 second timeout
    
//     try {
//       const response = await fetch(`${OPENAI_API_URL}/files`, {
//         method: 'POST',
//         headers: {
//           ...form.getHeaders(),
//           'Authorization': `Bearer ${OPENAI_API_KEY}`,
//         },
//         body: formBuffer,
//         signal: controller.signal
//       });
      
//       // Clear the timeout since the request completed
//       clearTimeout(timeoutId);
      
//       console.log(`Received response with status: ${response.status}`);

//       // Clean up the temporary file
//       console.log(`Cleaning up temporary file`);
//       fs.unlinkSync(tempFilePath);
//       console.log(`Temporary file deleted successfully`);

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error('OpenAI API Error:', errorData);
//         throw new Error(`Failed to upload file: ${errorData.error?.message || response.statusText}`);
//       }

//       const data = await response.json();
//       console.log(`Successfully uploaded file with ID: ${data.id}`);
//       return data.id;
//     } catch (error) {
//       // Clear the timeout in case of error
//       clearTimeout(timeoutId);
      
//       if ((error as { name?: string }).name === 'AbortError') {
//         throw new Error('File upload request timed out after 60 seconds');
//       }
//       throw error;
//     }
//   } catch (error) {
//     console.error('Error uploading file to OpenAI:', error);
//     throw error;
//   }
// };

// Create a new OpenAI assistant


// const createAssistant = async (userId: string, domain: string) => {
//     try {
//       console.log('📄 Loading configuration file...');
//       const configFileContent = loadConfigFile();
//       console.log(`📄 Config file loaded. Size: ${configFileContent.length} bytes`);
  
//       let configData;
//       try {
//         configData = JSON.parse(configFileContent);
//         console.log('✅ Config file parsed successfully');
//       } catch (error) {
//         console.error('❌ Failed to parse config file:', error);
//         throw new Error(`Failed to parse configuration file: ${(error as Error).message}`);
//       }
  
//       // Prepare and simplify schema if needed
//       const schema = configData;
//       let finalSchemaJSON = JSON.stringify(schema);
  
//       if (finalSchemaJSON.length > 100000) {
//         console.warn('⚠️ Schema is large. Simplifying...');
//         if (schema.collections && Array.isArray(schema.collections)) {
//           const simplifiedCollections = schema.collections.map((collection: any) => ({
//             name: collection.name,
//             description: collection.description,
//             fields: collection.fields,
//             relationships: collection.relationships?.map((rel: any) => ({
//               with: rel.with,
//               type: rel.type,
//               joinField: rel.joinField,
//               targetField: rel.targetField,
//             })),
//           }));
  
//           finalSchemaJSON = JSON.stringify({
//             collections: simplifiedCollections,
//             common_query_examples: schema.common_query_examples?.slice(0, 5),
//           });
//           console.log(`✅ Simplified schema size: ${finalSchemaJSON.length} bytes`);
//         }
//       }
  
//       // Step 1: Upload file
//       console.log('📤 Uploading schema file to OpenAI...');
//       const fileId = await uploadFileToOpenAI(finalSchemaJSON, "mongodb_schema.json", "assistants");
//       console.log(`✅ File uploaded successfully. File ID: ${fileId}`);
  
//       // Step 2: Create the assistant (no file_ids here)
//       console.log('🤖 Creating assistant...' ,JSON.stringify( userId));
//       const createAssistantResponse = await fetch(`${OPENAI_API_URL}/assistants`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${OPENAI_API_KEY}`,
//           "OpenAI-Beta": "assistants=v2",
//         },
//         body: JSON.stringify({
//           name: "MongoDB Query Assistant v7",
//           description: "A specialized assistant for generating MongoDB queries from Farsi (Persian) questions",
//           model: "gpt-4o",
//           instructions: configData.instructions.join("\n\n"),
//           tools: [{ type: "code_interpreter" }],
//           metadata: {
//             version: "1.0",
//             created_by: userId,
//           },
//         }),
//       });
  
//       if (!createAssistantResponse.ok) {
//         const errorData = await createAssistantResponse.json();
//         console.error("❌ Failed to create assistant:", errorData);
//         throw new Error(`Failed to create assistant: ${errorData.error?.message}`);
//       }
  
//       const assistantData = await createAssistantResponse.json();
//       console.log(`✅ Assistant created successfully. ID: ${assistantData.id}`);
  
//        // Step 3: Attach the uploaded file using axios (required for v2)
//     try {
//         console.log(`📎 Attaching file to assistant ${assistantData.id}...`);
//         await axios.post(
//           `${OPENAI_API_URL}/assistants/${assistantData.id}/files`,
//           { file_id: fileId },
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${OPENAI_API_KEY}`,
//               "OpenAI-Beta": "assistants=v2",
//             },
//           }
//         );
//         console.log(`✅ File attached to assistant ${assistantData.id}`);
//       } catch (error: any) {
//         console.error("❌ Failed to attach file:", error.response?.data || error.message);
//         throw new Error(
//           `Failed to attach file to assistant: ${error.response?.data?.error?.message || error.message}`
//         );
//       }
  
    
  
//      // Step 4: Save to DB
//     console.log("💾 Saving assistant info to database...");
//     const connection = await connectToDatabase(domain);
//     const collection = connection.collection("openai_assistants");

//     await collection.insertOne({
//       id: assistantData.id,
//       name: "MongoDB Query Assistant v7",
//       userId,
//       modelName: "gpt-4o",
//       fileIds: [fileId],
//       createdAt: new Date(),
//     });
//     console.log("✅ Assistant saved to database.");

//     return assistantData;
//     } catch (error) {
//       console.error("🚨 Error creating assistant:", error);
//       throw error;
//     }
//   };


const createAssistant = async (userId: string, domain: string) => {
    try {
      console.log('📄 Loading configuration file...');
      const configFileContent = loadConfigFile();
      console.log(`📄 Config file loaded. Size: ${configFileContent.length} bytes`);
  
      let configData;
      try {
        configData = JSON.parse(configFileContent);
        console.log('✅ Config file parsed successfully');
      } catch (error) {
        console.error('❌ Failed to parse config file:', error);
        throw new Error(`Failed to parse configuration file: ${(error as Error).message}`);
      }
  
      // Prepare and simplify schema if needed
      const schema = configData;
      let finalSchemaJSON = JSON.stringify(schema);
  
      if (finalSchemaJSON.length > 100000) {
        console.warn('⚠️ Schema is large. Simplifying...');
        if (schema.collections && Array.isArray(schema.collections)) {
          const simplifiedCollections = schema.collections.map((collection: any) => ({
            name: collection.name,
            description: collection.description,
            fields: collection.fields,
            relationships: collection.relationships?.map((rel: any) => ({
              with: rel.with,
              type: rel.type,
              joinField: rel.joinField,
              targetField: rel.targetField,
            })),
          }));
  
          finalSchemaJSON = JSON.stringify({
            collections: simplifiedCollections,
            common_query_examples: schema.common_query_examples?.slice(0, 5),
          });
          console.log(`✅ Simplified schema size: ${finalSchemaJSON.length} bytes`);
        }
      }
  
      // Step 1: Upload file
      console.log('📤 Uploading schema file to OpenAI...');
      const fileId = await uploadFileToOpenAI(finalSchemaJSON, "mongodb_schema.json", "assistants");
      console.log(`✅ File uploaded successfully. File ID: ${fileId}`);
  
      // Step 2: Create the assistant (v2 API)
      console.log('🤖 Creating assistant...', JSON.stringify(userId));
      const createAssistantResponse = await axios.post(
        `${OPENAI_API_URL}/assistants`,
        {
          name: "MongoDB Query Assistant v7",
          description: "A specialized assistant for generating MongoDB queries from Farsi (Persian) questions",
          model: "gpt-4o",
          instructions: configData.instructions.join("\n\n"),
          tools: [{ type: "code_interpreter" }],
          tool_resources: {
            code_interpreter: {
              file_ids: [fileId]
            }
          },
          metadata: {
            version: "1.0",
            created_by: userId,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2"
          }
        }
      );
  
      const assistantData = createAssistantResponse.data;
      console.log(`✅ Assistant created successfully. ID: ${assistantData.id}`);
  
      // Step 3: Save to DB
      console.log("💾 Saving assistant info to database...");
      const connection = await connectToDatabase(domain);
      const collection = connection.collection("openai_assistants");
  
      await collection.insertOne({
        id: assistantData.id,
        name: "MongoDB Query Assistant v7",
        userId,
        modelName: "gpt-4o",
        fileIds: [fileId],
        createdAt: new Date(),
      });
      console.log("✅ Assistant saved to database.");
  
      return assistantData;
    } catch (error: any) {
      console.error("🚨 Error creating assistant:", error.response?.data || error.message);
      throw new Error(
        `Failed to create assistant: ${error.response?.data?.error?.message || error.message}`
      );
    }
  };
export async function GET(request: Request) {
  try {
    // Get domain from headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    console.log('Initializing assistant for domain:', domain);
    
    const user = await getCurrentUser();
    console.log('User:', user);
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.username);

    // Check if we already have a valid assistant
    const existingAssistant = await getExistingAssistant(user.username, domain);
    
    if (existingAssistant) {
      console.log('Found existing assistant:', existingAssistant.id);
      // Verify the assistant still exists in OpenAI
      const isValid = await verifyAssistant(existingAssistant.id);
      
      if (isValid) {
        console.log('Assistant is valid, returning ID');
        return NextResponse.json({ assistantId: existingAssistant.id });
      }
      console.log('Assistant is no longer valid, creating new one');
    } else {
      console.log('No existing assistant found, creating new one');
    }

    // Create a new assistant if none exists or the existing one is invalid
    const assistant = await createAssistant(user.username, domain);
    
    return NextResponse.json({ assistantId: assistant.id });
  } catch (error) {
    console.error("Error in GET /api/chatbot7/assistant:", error);
    return NextResponse.json(
      { error: `Failed to initialize assistant: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
} 