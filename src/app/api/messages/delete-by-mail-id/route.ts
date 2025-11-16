import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function DELETE(request: Request) {
  try {
    // Get request body
    const { mailId } = await request.json();
    
    if (!mailId) {
      return NextResponse.json(
        { error: "Mail ID is required" },
        { status: 400 }
      );
    }
    
    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Access the messagelist collection directly
    const messagelistCollection = connection.collection('messagelist');
    
    // console.log("Deleting messages with mailId:", mailId);
    
    // Delete messages where data.mailId matches the given mailId
    const result = await messagelistCollection.deleteMany({
      "data.mailId": mailId
    });
    
    // console.log(`Deleted ${result.deletedCount} messages from messagelist`);
    
    return NextResponse.json({ 
      success: true,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error("Error deleting messages by mailId:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to delete messages" },
      { status: 500 }
    );
  }
} 