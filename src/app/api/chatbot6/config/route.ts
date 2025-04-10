import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import fs from "fs";
import path from "path";
import { Collection } from "mongodb";

// Collection to store assistant ids
const ASSISTANTS_COLLECTION = "ai_assistants";

// Define types for the assistant configuration
interface AssistantConfig {
  instructions: string[];
  schema: Record<string, unknown>;
  [key: string]: unknown;
}

// Get the assistant configuration
const getAssistantConfig = (): AssistantConfig => {
  try {
    const configPath = path.join(process.cwd(), "src/app/admin/chatbot3/config-template.json");
    const configData = fs.readFileSync(configPath, "utf8");
    return JSON.parse(configData);
  } catch (error) {
    logger.error("Failed to load assistant configuration:", error);
    throw new Error("Failed to load assistant configuration");
  }
};

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    if (!connection.db) {
      throw new Error("Database connection failed");
    }
    
    // Check if we already have an assistant ID stored
    const assistantsCollection = connection.db.collection(ASSISTANTS_COLLECTION);
    const existingAssistant = await assistantsCollection.findOne({ type: "chatbot6" });
    
    // Get the updated configuration
    const config = getAssistantConfig();
    
    let assistantId: string;
    
    if (existingAssistant?.assistantId) {
      // Update the existing assistant
      assistantId = existingAssistant.assistantId;
      
      // 1. First, upload the schema as a file to reduce token usage
      logger.info("Uploading schema as a file to OpenAI for assistant update...");
      
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
        logger.error(`Failed to upload schema file for update. Status: ${fileUploadResponse.status}, Text: ${errorText}`);
        throw new Error(`Failed to upload schema file: ${fileUploadResponse.statusText}. Details: ${errorText}`);
      }
      
      const fileData = await fileUploadResponse.json();
      const fileId = fileData.id;
      
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      
      // 2. Create instructions pointing to the file
      const instructions = config.instructions.join("\n") + 
        "\n\nA database schema file is attached to this assistant. Use it to understand the database structure and generate appropriate MongoDB queries.";
      
      // 3. Update the assistant with the file reference
      const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({
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
          file_ids: [fileId], // Attach the uploaded schema file
          metadata: {
            type: "chatbot6",
            updatedAt: new Date().toISOString()
          }
        })
      });
      
      if (!response.ok) {
        // If updating fails, create a new assistant
        const errorText = await response.text();
        logger.warn(`Failed to update assistant: ${response.statusText}. Error details: ${errorText}. Creating a new one.`);
        assistantId = await createNewAssistant(config, assistantsCollection);
      } else {
        // Update the database with the file ID
        await assistantsCollection.updateOne(
          { assistantId: assistantId },
          { 
            $set: { 
              fileId: fileId,
              updatedAt: new Date()
            } 
          }
        );
        
        logger.info(`Updated assistant with ID: ${assistantId} and new file ID: ${fileId}`);
      }
    } else {
      // Create a new assistant
      assistantId = await createNewAssistant(config, assistantsCollection);
    }
    
    return NextResponse.json({ 
      success: true, 
      assistantId,
      message: "Assistant configuration updated successfully"
    });
  } catch (error) {
    logger.error("Error updating assistant configuration:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to update assistant configuration",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

// Helper function to create a new assistant
async function createNewAssistant(config: AssistantConfig, collection: Collection) {
  try {
    // Ensure we have a valid configuration
    if (!config.instructions || !Array.isArray(config.instructions) || config.instructions.length === 0) {
      throw new Error("Invalid assistant configuration: missing instructions");
    }

    // 1. First, upload the schema as a file to reduce token usage
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
    
    // Create request body with file attachment
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

    logger.info("Creating new assistant with file-based schema, file ID:", fileId);

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
    
    // Store the assistant details in MongoDB
    await collection.updateOne(
      { type: "chatbot6" },
      { 
        $set: { 
          assistantId: assistantData.id,
          isActive: true,
          fileId: fileId,
          createdAt: new Date(),
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );
    
    logger.info(`Created new assistant with ID: ${assistantId}`);
    
    return assistantId;
  } catch (error) {
    logger.error("Error in createNewAssistant:", error);
    throw error;
  }
} 