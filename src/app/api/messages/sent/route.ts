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
    const sendercode = url.searchParams.get("sendercode");
    
    // Validate required fields
    if (!sendercode) {
      return NextResponse.json(
        { error: "Sender code is required" },
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
    
    // console.log(`Fetching sent messages for sender: ${sendercode}, page: ${page}, limit: ${limit}`);
    
    // Query messages sent by this user
    const messages = await messagelistCollection
      .find({ "data.sendercode": sendercode })
      .sort({ "data.createdAt": -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count for pagination
    const totalCount = await messagelistCollection.countDocuments({ 
      "data.sendercode": sendercode 
    });
    
    // console.log(`Found ${messages.length} sent messages out of ${totalCount} total`);
    
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
    console.error("Error fetching sent messages:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch sent messages" },
      { status: 500 }
    );
  }
} 