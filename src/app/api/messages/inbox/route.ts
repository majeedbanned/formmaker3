import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const receivercode = url.searchParams.get("receivercode");
    
    // Validate required fields
    if (!receivercode) {
      return NextResponse.json(
        { error: "Receiver code is required" },
        { status: 400 }
      );
    }
    
    // Calculate pagination values
    const skip = (page - 1) * limit;
    
    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Access the messagelist collection directly
    const messagelistCollection = connection.collection('messagelist');
    
    // console.log(`Fetching messages for receiver: ${receivercode}, page: ${page}, limit: ${limit}`);
    
    // Query messages for this receiver
    const messages = await messagelistCollection
      .find({ "data.receivercode": receivercode })
      .sort({ "data.createdAt": -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count for pagination
    const totalCount = await messagelistCollection.countDocuments({ 
      "data.receivercode": receivercode 
    });
    
    // console.log(`Found ${messages.length} messages out of ${totalCount} total`);
    
    return NextResponse.json({ 
      messages,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching inbox messages:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
} 