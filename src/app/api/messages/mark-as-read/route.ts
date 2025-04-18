import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Get request body
    const { messageId } = await request.json();
    
    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }
    
    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Access the messagelist collection directly
    const messagelistCollection = connection.collection('messagelist');
    
    console.log("Marking message as read:", messageId);
    
    // Convert string ID to ObjectId if needed
    let objectId;
    try {
      objectId = new ObjectId(messageId);
    } catch {
      return NextResponse.json({ error: "Invalid message ID format" }, { status: 400 });
    }
    
    // Update the message to mark it as read
    const result = await messagelistCollection.updateOne(
      { _id: objectId },
      { $set: { "data.isRead": true } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    
    console.log(`Message ${messageId} marked as read`);
    
    return NextResponse.json({ 
      success: true,
      messageId
    });
    
  } catch (error) {
    console.error("Error marking message as read:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
} 