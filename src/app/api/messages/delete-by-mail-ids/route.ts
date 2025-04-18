import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function DELETE(request: Request) {
  try {
    // Get request body
    const { mailIds } = await request.json();
    
    if (!mailIds || !Array.isArray(mailIds) || mailIds.length === 0) {
      return NextResponse.json(
        { error: "Mail IDs array is required" },
        { status: 400 }
      );
    }
    
    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Access the messagelist collection directly
    const messagelistCollection = connection.collection('messagelist');
    
    console.log("Deleting messages with mailIds:", mailIds);
    
    // Delete messages where data.mailId is in the given mailIds array
    const result = await messagelistCollection.deleteMany({
      "data.mailId": { $in: mailIds }
    });
    
    console.log(`Deleted ${result.deletedCount} messages from messagelist`);
    
    return NextResponse.json({ 
      success: true,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error("Error deleting messages by mailIds:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to delete messages" },
      { status: 500 }
    );
  }
} 