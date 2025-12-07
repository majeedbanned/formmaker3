import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { OpenAI } from "openai";
import { v4 as uuidv4 } from "uuid";

// Lazy initialization of OpenAI client to avoid build-time errors
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
};

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

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Ensure we have an assistant
    if (!storedAssistant?.assistantId) {
      // Try to fetch the assistant info first
      const assistantResponse = await fetch("/api/chatbot2/assistant", {
        method: "GET",
        headers: {
          "x-domain": domain,
        },
      });
      
      if (!assistantResponse.ok) {
        throw new Error("No assistant available");
      }
      
      storedAssistant = await assistantResponse.json();
    }
    
    // At this point we know storedAssistant is not null
    if (!storedAssistant) {
      throw new Error("Failed to initialize assistant");
    }
    
    const assistantId = storedAssistant.assistantId;
    
    logger.info(`Processing schema file upload for assistant: ${assistantId}`);
    
    // Parse form data to get the file
    const formData = await request.formData();
    const schemaFile = formData.get("schemaFile") as File;
    
    if (!schemaFile) {
      return NextResponse.json(
        { success: false, message: "No schema file provided" },
        { status: 400 }
      );
    }
    
    // Convert the file to a buffer
    const fileBuffer = await schemaFile.arrayBuffer();
    
    // Upload the schema file to OpenAI
    const openai = getOpenAI();
    const uploadedFile = await openai.files.create({
      file: new Blob([fileBuffer]),
      purpose: "assistants",
    });
    
    logger.info(`File uploaded to OpenAI with ID: ${uploadedFile.id}`);
    
    // If there was a previous file, remove it from the assistant
    if (storedAssistant.schemaFile?.fileId) {
      try {
        // Note: For OpenAI API v4+, this is the correct way to delete a file from an assistant
        await openai.beta.assistants.files.del(
          assistantId,
          storedAssistant.schemaFile.fileId
        );
        logger.info(`Removed previous file: ${storedAssistant.schemaFile.fileId}`);
      } catch (error) {
        logger.warn(`Error removing previous file: ${(error as Error).message}`);
        // Continue even if this fails
      }
    }
    
    // Attach the new file to the assistant
    await openai.beta.assistants.files.create(assistantId, {
      file_id: uploadedFile.id,
    });
    
    logger.info(`File attached to assistant: ${uploadedFile.id}`);
    
    // Update stored data
    const fileRecord = {
      id: uuidv4(),
      name: schemaFile.name,
      fileId: uploadedFile.id,
      uploadedAt: new Date(),
    };
    
    storedAssistant.schemaFile = fileRecord;
    
    return NextResponse.json({
      success: true,
      id: fileRecord.id,
      fileId: fileRecord.fileId,
      name: fileRecord.name,
      uploadedAt: fileRecord.uploadedAt,
    }, { status: 200 });
  } catch (error) {
    logger.error("Error processing schema file upload:", error);
    
    return NextResponse.json(
      { success: false, message: "Failed to process schema file", error: (error as Error).message },
      { status: 500 }
    );
  }
} 