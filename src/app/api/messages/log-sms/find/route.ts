import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from 'mongoose';
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

// Interface for SMS log records
interface ISmsLog {
  messageId: string;
  fromNumber: string;
  toNumbers: string[];
  message: string;
  recipientCount: number;
  senderCode: string;
  schoolCode: string;
  smsResult: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Get the SMS log model for the current MongoDB connection
const getSmsLogModel = (connection: mongoose.Connection) => {
  try {
    return connection.model<ISmsLog>('SmsLog');
  } catch {
    // Define schema if model doesn't exist
    const schema = new mongoose.Schema<ISmsLog>({
      messageId: {
        type: String,
        required: true,
      },
      fromNumber: {
        type: String,
        required: true,
      },
      toNumbers: {
        type: [String],
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      recipientCount: {
        type: Number,
        required: true,
      },
      senderCode: {
        type: String,
        required: true,
      },
      schoolCode: {
        type: String,
        required: true,
      },
      smsResult: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    }, { 
      timestamps: true
    });
    
    return connection.model<ISmsLog>('SmsLog', schema);
  }
};

export async function GET(request: Request) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get message ID from query parameters
    const url = new URL(request.url);
    const messageId = url.searchParams.get('messageId');
    
    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    const SmsLogModel = getSmsLogModel(connection);
    
    // Find SMS logs by messageId
    const logs = await SmsLogModel.find({ messageId }).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error("Error finding SMS logs:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to find SMS logs" },
      { status: 500 }
    );
  }
} 