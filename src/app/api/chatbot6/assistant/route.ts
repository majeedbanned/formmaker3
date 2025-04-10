import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";

// Collection to store assistant ids
const ASSISTANTS_COLLECTION = "ai_assistants";

// Get the assistant configuration
const getAssistantConfig = () => {
  try {
    const configPath = path.join(process.cwd(), "src/app/admin/chatbot3/config-template.json");
    const configData = fs.readFileSync(configPath, "utf8");
    return JSON.parse(configData);
  } catch (error) {
    logger.error("Failed to load assistant configuration:", error);
    throw new Error("Failed to load assistant configuration");
  }
};

// Create or get the assistant in OpenAI
const createOrGetAssistant = async (domain: string) => {
  try {
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    if (!connection.db) {
      throw new Error("Database connection failed");
    }
    
    // Check if we already have an assistant ID stored
    const assistantsCollection = connection.db.collection(ASSISTANTS_COLLECTION);
    const existingAssistant = await assistantsCollection.findOne({ type: "chatbot6" });
    
    if (existingAssistant?.assistantId) {
      logger.info(`Using existing assistant ID: ${existingAssistant.assistantId}`);
      
      // Retrieve the assistant from OpenAI to verify it exists
      const response = await fetch(`https://api.openai.com/v1/assistants/${existingAssistant.assistantId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2"
        }
      });
      
      if (response.ok) {
        // Assistant exists, return the ID
        return existingAssistant.assistantId;
      }
      
      // If we get here, the assistant no longer exists in OpenAI
      const errorText = await response.text();
      logger.warn(`Assistant ID ${existingAssistant.assistantId} not found in OpenAI. Error: ${errorText}. Creating a new one.`);
    }
    
    // Create a new assistant in OpenAI
    const config = getAssistantConfig();
    
    // Ensure we have a valid configuration
    if (!config.instructions || !Array.isArray(config.instructions) || config.instructions.length === 0) {
      throw new Error("Invalid assistant configuration: missing instructions");
    }

    // 1. First, upload the schema as a file
    logger.info("Uploading schema as a file to OpenAI...");

    // Create the schema content as JSON
    const schemaContent = JSON.stringify(config.schema, null, 2);

    // Write schema to a temporary file
    const tempFilePath = path.join(process.cwd(), 'temp_schema.json');
    fs.writeFileSync(tempFilePath, schemaContent);

    // Use a simple multipart/form-data approach with fetch
    const fileBuffer = fs.readFileSync(tempFilePath);
    const boundary = `----FormBoundary${Math.random().toString(16).slice(2)}`;

    const fileUploadBody = Buffer.concat([
      // Purpose field
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="purpose"\r\n\r\nassistants\r\n`),
      // File field
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="db_schema.json"\r\nContent-Type: application/json\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const fileUploadResponse = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body: fileUploadBody
    });

    if (!fileUploadResponse.ok) {
      const errorText = await fileUploadResponse.text();
      logger.error(`Failed to upload schema file. Status: ${fileUploadResponse.status}, Text: ${errorText}`);
      throw new Error(`Failed to upload schema file: ${fileUploadResponse.statusText}. Details: ${errorText}`);
    }

    const fileData = await fileUploadResponse.json();
    const fileId = fileData.id;

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    // 2. Create the assistant with the file attached
    const instructions = config.instructions.join("\n") + 
      "\n\nA database schema file is attached to this assistant. Use it to understand the database structure and generate appropriate MongoDB queries.";
    
    // Create a request body with file attachment
    const requestBody = {
      name: "MongoDB Query Assistant",
      instructions: instructions,
      tools: [
        {
          type: "function",
          function: {
            name: "executeMongoDBQuery",
            description: "Execute MongoDB queries against the database",
            parameters: {
              type: "object",
              properties: {
                collection: {
                  type: "string",
                  description: "The MongoDB collection to query"
                },
                operation: {
                  type: "string",
                  enum: ["find", "aggregate"],
                  description: "The operation to perform"
                },
                query: {
                  type: "object",
                  description: "The query to execute"
                }
              },
              required: ["collection", "operation", "query"]
            }
          }
        },
        {
          type: "retrieval" // Enable file search capability
        }
      ],
      model: "gpt-4o",
      file_ids: [fileId], // Attach the uploaded schema file
      metadata: {
        type: "chatbot6"
      }
    };
    
    const response = await fetch("https://api.openai.com/v1/assistants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Failed to create assistant. Status: ${response.status}, Text: ${errorText}`);
      throw new Error(`Failed to create assistant: ${response.statusText}. Details: ${errorText}`);
    }
    
    const assistantData = await response.json();
    const assistantId = assistantData.id;
    
    // Store the assistant ID and file ID in the database
    await assistantsCollection.updateOne(
      { type: "chatbot6" },
      { 
        $set: { 
          assistantId, 
          fileId,
          createdAt: new Date(),
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    
    logger.info(`Created new assistant with ID: ${assistantId} and file ID: ${fileId}`);
    
    return assistantId;
  } catch (error) {
    logger.error("Error creating or getting assistant:", error);
    throw error;
  }
};

export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Create or get the assistant
    const assistantId = await createOrGetAssistant(domain);
    
    return NextResponse.json({ 
      success: true, 
      assistantId 
    });
  } catch (error) {
    logger.error("Error in assistant API:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to initialize assistant",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
} 