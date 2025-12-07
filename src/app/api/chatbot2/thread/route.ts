import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { OpenAI } from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { getAssistantModel, getThreadModel, IThread } from "../models/assistant";

// Lazy initialization of OpenAI client to avoid build-time errors
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
};

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Get user ID from request body or headers
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || request.headers.get("x-user-id") || "anonymous";
    
    logger.info(`Creating new thread for user: ${userId}, domain: ${domain}`);
    
    // Connect to the database
    const connection = await connectToDatabase(domain);
    const AssistantModel = getAssistantModel(connection);
    const ThreadModel = getThreadModel(connection);
    
    // Find active assistant for this domain
    const assistant = await AssistantModel.findOne({
      domain,
      isActive: true,
    }).lean();
    
    if (!assistant) {
      return NextResponse.json(
        { success: false, message: "No active assistant found for this domain" },
        { status: 404 }
      );
    }
    
    // Check if user already has an active thread with this assistant
    const existingThread = await ThreadModel.findOne({
      userId,
      assistantId: assistant.assistantId,
      domain,
      isActive: true,
    }).lean();
    
    if (existingThread) {
      logger.info(`Found existing thread: ${existingThread.threadId} for user: ${userId}`);
      
      // Update lastUsed timestamp
      await ThreadModel.updateOne(
        { _id: existingThread._id },
        { $set: { lastUsed: new Date() } }
      );
      
      return NextResponse.json({
        success: true,
        threadId: existingThread.threadId,
        isExisting: true,
      }, { status: 200 });
    }
    
    // Create a new thread
    const thread = await getOpenAI().beta.threads.create();
    
    // Store the thread in the database
    const threadDoc = new ThreadModel({
      threadId: thread.id,
      userId,
      assistantId: assistant.assistantId,
      domain,
      isActive: true,
      lastUsed: new Date(),
      createdAt: new Date(),
    });
    
    await threadDoc.save();
    
    logger.info(`Successfully created thread with ID: ${thread.id} for user: ${userId}`);
    
    return NextResponse.json({
      success: true,
      threadId: thread.id,
      isExisting: false,
    }, { status: 200 });
  } catch (error) {
    logger.error("Error creating thread:", error);
    
    return NextResponse.json(
      { success: false, message: "Failed to create thread" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all threads for a user
export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Get user ID from query parameters or headers
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Connect to the database
    const connection = await connectToDatabase(domain);
    const ThreadModel = getThreadModel(connection);
    
    // Find all threads for this user
    const threads = await ThreadModel.find({
      userId,
      domain,
      isActive: true,
    }).sort({ lastUsed: -1 }).lean();
    
    return NextResponse.json({
      success: true,
      threads: threads.map((thread: IThread) => ({
        threadId: thread.threadId,
        assistantId: thread.assistantId,
        lastUsed: thread.lastUsed,
        createdAt: thread.createdAt,
      })),
    }, { status: 200 });
  } catch (error) {
    logger.error("Error fetching threads:", error);
    
    return NextResponse.json(
      { success: false, message: "Failed to fetch threads" },
      { status: 500 }
    );
  }
} 