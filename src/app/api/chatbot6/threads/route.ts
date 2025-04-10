import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

// Collection to store user threads
const THREADS_COLLECTION = "ai_threads";

export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    if (!connection.db) {
      throw new Error("Database connection failed");
    }
    
    // Get the user ID from the request (in a real app, this would come from authentication)
    // For this demo, we'll use a fixed user ID
    const userId = "demo-user";
    
    // Get threads from the database
    const threadsCollection = connection.db.collection(THREADS_COLLECTION);
    const userThreads = await threadsCollection
      .find({ userId, assistantType: "chatbot6" })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ 
      success: true, 
      threads: userThreads
    });
  } catch (error) {
    logger.error("Error getting user threads:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to get user threads",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Get request body
    const body = await request.json();
    const { name } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Thread name is required" },
        { status: 400 }
      );
    }
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    if (!connection.db) {
      throw new Error("Database connection failed");
    }
    
    // Get the user ID from the request (in a real app, this would come from authentication)
    // For this demo, we'll use a fixed user ID
    const userId = "demo-user";
    
    // Create a new thread in OpenAI
    const response = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create thread: ${response.statusText}`);
    }
    
    const threadData = await response.json();
    const threadId = threadData.id;
    
    // Store the thread in the database
    const threadsCollection = connection.db.collection(THREADS_COLLECTION);
    await threadsCollection.insertOne({
      threadId,
      name,
      userId,
      assistantType: "chatbot6",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    logger.info(`Created new thread with ID: ${threadId}`);
    
    return NextResponse.json({ 
      success: true, 
      threadId,
      name,
      message: "Thread created successfully"
    });
  } catch (error) {
    logger.error("Error creating thread:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to create thread",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
} 