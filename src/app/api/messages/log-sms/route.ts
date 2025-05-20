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

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get request body
    const { 
      messageId, 
      fromNumber, 
      toNumbers, 
      message, 
      recipientCount, 
      senderCode, 
      schoolCode, 
      smsResult 
    } = await request.json();
    
    // Validate required fields
    if (!messageId || !fromNumber || !toNumbers || !message || !senderCode || !schoolCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    const SmsLogModel = getSmsLogModel(connection);
    
    // Create SMS log record
    const smsLog = new SmsLogModel({
      messageId,
      fromNumber,
      toNumbers,
      message,
      recipientCount: recipientCount || toNumbers.length,
      senderCode,
      schoolCode,
      smsResult,
    });
    
    // Save record to database
    await smsLog.save();
    
    return NextResponse.json({
      success: true,
      id: smsLog._id,
      messageId: smsLog.messageId
    });
  } catch (error) {
    console.error("Error logging SMS:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to log SMS" },
      { status: 500 }
    );
  }
} 