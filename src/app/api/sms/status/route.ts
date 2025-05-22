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
      messageId: { type: String, required: true },
      fromNumber: { type: String, required: true },
      toNumbers: { type: [String], required: true },
      message: { type: String, required: true },
      recipientCount: { type: Number, required: true },
      senderCode: { type: String, required: true },
      schoolCode: { type: String, required: true },
      smsResult: { type: mongoose.Schema.Types.Mixed, required: false },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }, { timestamps: true });
    
    return connection.model<ISmsLog>('SmsLog', schema);
  }
};

/**
 * In a real-world scenario, this would connect to your SMS provider's API
 * to get the actual delivery status of the messages.
 * For this example, we'll simulate various statuses based on the message ID.
 */
function getSimulatedSmsStatus(messageId: string, phone?: string): string {
  // If a phone number is provided, use it to generate a more specific status
  if (phone) {
    // Use the last digit of the phone number to determine a status
    const lastDigit = phone.slice(-1);
    
    // Create a deterministic but seemingly random status for each phone
    const phoneSum = phone.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const statusIndex = (phoneSum + parseInt(lastDigit)) % 10;
    
    const statusMap: Record<number, string> = {
      0: "0", // Sent
      1: "1", // Delivered to recipient
      2: "2", // Error in sending
      3: "3", // Not delivered to recipient
      4: "4", // Delivered to telecom
      5: "5", // Not delivered to telecom
      6: "6", // Unknown status
      7: "sent",
      8: "delivered",
      9: "failed",
    };
    
    return statusMap[statusIndex] || "pending";
  }
  
  // Otherwise, use the original message ID based logic for the overall status
  const lastChar = messageId.slice(-1).charCodeAt(0);
  
  // Map to different statuses based on the numeric value
  const statusMap: Record<number, string> = {
    0: "0", // Sent
    1: "1", // Delivered to recipient
    2: "2", // Error in sending
    3: "3", // Not delivered to recipient
    4: "4", // Delivered to telecom
    5: "5", // Not delivered to telecom
    6: "6", // Unknown status
    7: "sent",
    8: "delivered",
    9: "failed",
  };
  
  // Default to "pending" if not in the map
  return statusMap[lastChar % 10] || "pending";
}

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
    const { messageId, phone } = await request.json();
    
    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database to find the SMS log
    const connection = await connectToDatabase(domain);
    const SmsLogModel = getSmsLogModel(connection);
    
    // Find the most recent SMS log for this message
    const smsLog = await SmsLogModel.findOne({ messageId }).sort({ createdAt: -1 });
    
    if (!smsLog) {
      return NextResponse.json(
        { error: "SMS log not found" },
        { status: 404 }
      );
    }
    
    // If a specific phone number is specified, verify it exists in the toNumbers array
    if (phone && !smsLog.toNumbers.includes(phone)) {
      return NextResponse.json(
        { error: "Phone number not found in this message's recipients" },
        { status: 404 }
      );
    }
    
    // In a real implementation, you would call your SMS provider's API here
    // For this example, we'll use a simulated status
    const status = getSimulatedSmsStatus(messageId, phone);
    
    // Update the SMS log with the status if needed
    // This would be done in a real implementation
    
    return NextResponse.json({
      success: true,
      messageId,
      phone: phone || null,
      status,
      // Include additional information
      recipientCount: smsLog.recipientCount,
      sentAt: smsLog.createdAt
    });
  } catch (error) {
    console.error("Error checking SMS status:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to check SMS status" },
      { status: 500 }
    );
  }
} 