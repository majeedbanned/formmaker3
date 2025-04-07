import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { OpenAI } from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    logger.info(`Creating new thread for domain: ${domain}`);
    
    // Create a new thread
    const thread = await openai.beta.threads.create();
    
    logger.info(`Successfully created thread with ID: ${thread.id}`);
    
    return NextResponse.json({
      success: true,
      threadId: thread.id,
    }, { status: 200 });
  } catch (error) {
    logger.error("Error creating thread:", error);
    
    return NextResponse.json(
      { success: false, message: "Failed to create thread" },
      { status: 500 }
    );
  }
} 