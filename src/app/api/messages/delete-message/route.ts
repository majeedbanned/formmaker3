import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function DELETE(request: Request) {
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
    
    console.log("Deleting message:", messageId);
    
    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(messageId);
    } catch {
      return NextResponse.json({ error: "Invalid message ID format" }, { status: 400 });
    }
    
    // Delete the message
    const result = await messagelistCollection.deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    
    console.log(`Message ${messageId} deleted successfully`);
    
    return NextResponse.json({ 
      success: true,
      messageId
    });
    
  } catch (error) {
    console.error("Error deleting message:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
} 