import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { OpenAI } from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { getAssistantModel, IDBSchema, IAssistant } from "../models/assistant";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type definition for the configuration file
interface AssistantConfig {
  name: string;
  instructions: string;
  dbSchema: IDBSchema;
}

// GET endpoint to fetch current active assistant configuration
export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Connect to the database
    const connection = await connectToDatabase(domain);
    const AssistantModel = getAssistantModel(connection);
    
    // Find the active assistant for this domain
    const assistant = await AssistantModel.findOne({
      domain,
      isActive: true,
    }).lean() as IAssistant | null;
    
    if (!assistant) {
      return NextResponse.json(
        { success: false, message: "No active assistant configuration found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      assistant: {
        assistantId: assistant.assistantId,
        name: assistant.name,
        hasDbSchema: !!assistant.dbSchema,
        createdAt: assistant.createdAt,
        updatedAt: assistant.updatedAt,
      },
    }, { status: 200 });
  } catch (error) {
    logger.error("Error fetching assistant configuration:", error);
    
    return NextResponse.json(
      { success: false, message: "Failed to fetch assistant configuration", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST endpoint to upload and apply a new assistant configuration
export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Parse the JSON configuration
    const config: AssistantConfig = await request.json();
    
    // Validate the configuration
    if (!config.name || !config.instructions || !config.dbSchema) {
      return NextResponse.json(
        { success: false, message: "Invalid configuration: name, instructions, and dbSchema are required" },
        { status: 400 }
      );
    }
    
    // Connect to the database
    const connection = await connectToDatabase(domain);
    const AssistantModel = getAssistantModel(connection);
    
    // Find any existing active assistant for this domain
    const existingAssistant = await AssistantModel.findOne({
      domain,
      isActive: true,
    });
    
    // Create a new assistant in OpenAI
    const assistantResponse = await openai.beta.assistants.create({
      name: config.name,
      description: "MongoDB Query Generator with custom schema",
      instructions: config.instructions,
      model: "gpt-4o",
      tools: [
        {
          type: "file_search",
        }
      ],
    });
    
    // Store the new assistant config in the database
    const newAssistant = new AssistantModel({
      assistantId: assistantResponse.id,
      name: config.name,
      instructions: config.instructions,
      dbSchema: config.dbSchema,
      domain,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    await newAssistant.save();
    
    // Deactivate the existing assistant if there is one
    if (existingAssistant) {
      existingAssistant.isActive = false;
      existingAssistant.updatedAt = new Date();
      await existingAssistant.save();
      
      // Optionally delete the OpenAI assistant
      try {
        await openai.beta.assistants.del(existingAssistant.assistantId);
        logger.info(`Deleted previous OpenAI assistant: ${existingAssistant.assistantId}`);
      } catch (error) {
        logger.warn(`Error deleting previous OpenAI assistant: ${(error as Error).message}`);
      }
    }
    
    logger.info(`Created new assistant: ${assistantResponse.id} for domain: ${domain}`);
    
    return NextResponse.json({
      success: true,
      assistantId: assistantResponse.id,
      message: "Assistant configuration uploaded and applied successfully",
    }, { status: 201 });
  } catch (error) {
    logger.error("Error uploading assistant configuration:", error);
    
    return NextResponse.json(
      { success: false, message: "Failed to upload and apply assistant configuration", error: (error as Error).message },
      { status: 500 }
    );
  }
} 