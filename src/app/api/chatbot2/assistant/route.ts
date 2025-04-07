import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { OpenAI } from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Assistant data storage
interface StoredAssistant {
  assistantId: string;
  threadId?: string;
  schemaFile?: {
    id: string;
    name: string;
    fileId: string;
    uploadedAt: Date;
  };
  createdAt: Date;
}

// In a production environment, this should be stored in a database
let storedAssistant: StoredAssistant | null = null;

export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // If we have a stored assistant, return it
    if (storedAssistant) {
      logger.info(`Returning existing assistant: ${storedAssistant.assistantId}`);
      return NextResponse.json(storedAssistant, { status: 200 });
    }

    // If not, create a new assistant
    logger.info("Creating new MongoDB query generator assistant...");
    
    const assistant = await openai.beta.assistants.create({
      name: "MongoDB Query Generator",
      description: "A specialized assistant that converts Farsi user queries into valid MongoDB queries, executes them, and formats the results in a human-friendly way.",
      instructions: `You are a specialized MongoDB query assistant.
- Your main task is to generate valid MongoDB queries from user questions in Farsi (Persian).
- You will receive detailed MongoDB schema information to help you understand the database structure.
- Generate ONLY JSON format MongoDB queries that follow this structure:
{
  "collection": "collectionName",
  "operation": "find" | "aggregate",
  "query": <MongoDB query object>
}
- Do NOT include explanations or markdown formatting in your query response.
- Focus on precise field names and MongoDB syntax correctness.
- Pay special attention to support for nested fields using dot notation (e.g., "data.fieldName").
- After someone runs your query, you'll receive the results and should format them into a clear, human-friendly response in Farsi.
- For empty results, provide helpful suggestions about possible reasons.
- When appropriate, format complex results as HTML tables for better readability.`,
      model: "gpt-4o",
      tools: [
        {
          type: "file_search",
        }
      ],
    });

    // Store the assistant for future use
    storedAssistant = {
      assistantId: assistant.id,
      createdAt: new Date(),
    };

    logger.info(`Successfully created assistant with ID: ${assistant.id}`);
    
    return NextResponse.json(storedAssistant, { status: 200 });
  } catch (error) {
    logger.error("Error creating or retrieving assistant:", error);
    
    return NextResponse.json(
      { success: false, message: "Failed to create or retrieve assistant" },
      { status: 500 }
    );
  }
} 