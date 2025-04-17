import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Get request body
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }
    
    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get messagelist collection
    const messageListCollection = connection.collection("messagelist");
    
    // Prepare documents for insertion
    const now = new Date();
    const documentsToInsert = messages.map(message => ({
      data: new Map(Object.entries({
        ...message,
        createdAt: now,
        isRead: false
      }))
    }));
    
    // Insert documents
    const result = await messageListCollection.insertMany(documentsToInsert);
    
    return NextResponse.json({ 
      success: true,
      count: result.insertedCount,
      message: `Successfully inserted ${result.insertedCount} messages`
    });
    
  } catch (error) {
    console.error("Error inserting messages:", error);
    return NextResponse.json(
      { error: "Failed to insert messages" },
      { status: 500 }
    );
  }
} 