import { NextResponse } from "next/server";
import { smsApi } from "@/lib/smsService";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";
import { getSmsRecordModel } from "../models/smsRecord";

// Set runtime to nodejs
export const runtime = 'nodejs';

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
    const { messageId, recordId } = await request.json();
    
    // Validate required fields
    if (!messageId || !recordId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    const SmsRecordModel = getSmsRecordModel(connection);
    
    // Find the SMS record
    const smsRecord = await SmsRecordModel.findOne({ 
      _id: recordId,
      userId: user.username
    });
    
    if (!smsRecord) {
      return NextResponse.json(
        { error: "SMS record not found" },
        { status: 404 }
      );
    }
    
    // Get status from SMS API
    const status = await smsApi.getStatus(messageId);
    console.log('status', status);
    console.log('messageId', messageId);
   // const arr = JSON.parse(status.replace(/'/g, '"'));

    // Step 2: Access the first element (index 0)
   // const value = arr[0];

    // Update record status
    smsRecord.status = status[0] || 'unknown';
    smsRecord.statusCheckedAt = new Date();
    await smsRecord.save();
    
    return NextResponse.json({ 
      success: true,
      status: smsRecord.status,
      updatedAt: smsRecord.statusCheckedAt
    });
  } catch (error) {
    console.error("Error checking SMS status:", error);
    return NextResponse.json(
      { error: "Failed to check SMS status" },
      { status: 500 }
    );
  }
} 