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
    const { fromNumber, toNumbers, message } = await request.json();
    
    // Validate required fields
    if (!fromNumber || !toNumbers || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Ensure toNumbers is an array
    const recipients = Array.isArray(toNumbers) ? toNumbers : [toNumbers];
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Send SMS
    const messageIds = await smsApi.sendSMS(domain, fromNumber, recipients, message, user.schoolCode);
    
    // Save SMS records to database
    const connection = await connectToDatabase(domain);
    const SmsRecordModel = getSmsRecordModel(connection);
    
    // Create SMS records for each recipient
    const smsRecords = [];
    const now = new Date();
    
    if (Array.isArray(messageIds) && messageIds.length > 0) {
      for (let i = 0; i < recipients.length; i++) {
        const messageId = messageIds[i] || `unknown-${Date.now()}-${i}`;
        
        // Create SMS record
        const smsRecord = new SmsRecordModel({
          messageId,
          fromNumber,
          toNumber: recipients[i],
          message,
          status: 'sent',
          userId: user.username || 'unknown',
          sentAt: now,
        });
        
        // Save record to database
        await smsRecord.save();
        smsRecords.push(smsRecord);
      }
    }
    
    return NextResponse.json({ 
      success: true,
      messageIds,
      records: smsRecords.map(record => ({
        id: record._id,
        messageId: record.messageId,
        toNumber: record.toNumber,
        sentAt: record.sentAt
      }))
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return NextResponse.json(
      { error: "Failed to send SMS" },
      { status: 500 }
    );
  }
}