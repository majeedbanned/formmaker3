import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

interface MessageItem {
  mailId: string;
  sendername: string;
  sendercode: string;
  title?: string;
  persiandate: string;
  message: string;
  role?: string;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: number;
    [key: string]: unknown;
  }>;
  receivercode: string;
}

export async function POST(request: Request) {
  try {
    // Get domain from request headers for logging purposes
    const domain = request.headers.get("x-domain") || 'localhost:3000';
    
    // Get the authenticated user
    const user = await getCurrentUser();
    if (!user) {
      logger.warn(`Unauthorized attempt to insert messages from domain: ${domain}`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { messages, schoolCode } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ message: "messages array is required" }, { status: 400 });
    }

    if (!schoolCode) {
      return NextResponse.json({ message: "schoolCode is required" }, { status: 400 });
    }

    // Connect to database
    const connection = await connectToDatabase(domain);
    const messagelistCollection = connection.collection('messagelistnotification');
    
    // Add timestamps and school code to each message
    const timestamp = new Date();
    const messagesWithMetadata = messages.map((message: MessageItem) => ({
      ...message,
      schoolCode,
      timestamp,
      isRead: false,
      isDeleted: false,
    }));
    
    // Insert all messages
    const result = await messagelistCollection.insertMany(messagesWithMetadata);
    
    logger.info(`Inserted ${result.insertedCount} messages to messagelist collection for school ${schoolCode}`);
    
    return NextResponse.json({
      message: "Messages inserted successfully",
      insertedCount: result.insertedCount,
      success: true
    }, { status: 200 });
    
  } catch (error) {
    logger.error("Error inserting messages:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message, success: false },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: "خطا در ثبت پیام‌ها", success: false },
      { status: 500 }
    );
  }
} 