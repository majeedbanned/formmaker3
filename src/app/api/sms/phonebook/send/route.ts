import { NextResponse } from "next/server";
import { smsApi } from "@/lib/smsService";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";
import { getSmsRecordModel } from "../../models/smsRecord";

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
    const { fromNumber, phonebookId, message } = await request.json();
    
    // Validate required fields
    if (!fromNumber || !phonebookId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get phonebook numbers first
    const numbers = await smsApi.getPhonebookNumbers(phonebookId);
    
    if (!numbers || numbers.length === 0) {
      return NextResponse.json(
        { error: "No numbers found in phonebook" },
        { status: 400 }
      );
    }
    
    // Send SMS to phonebook
    const messageIds = await smsApi.sendToPhonebook(fromNumber, phonebookId, message);
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Save SMS records to database
    const connection = await connectToDatabase(domain);
    const SmsRecordModel = getSmsRecordModel(connection);
    
    // Create SMS records for each recipient
    const smsRecords = [];
    const now = new Date();
    
    // If we have message IDs, use them
    if (Array.isArray(messageIds) && messageIds.length > 0) {
      // If we have as many messageIds as numbers, match them
      if (messageIds.length === numbers.length) {
        for (let i = 0; i < numbers.length; i++) {
          const smsRecord = new SmsRecordModel({
            messageId: messageIds[i],
            fromNumber,
            toNumber: numbers[i],
            message,
            status: 'sent',
            userId: user.username || 'unknown',
            sentAt: now,
          });
          
          await smsRecord.save();
          smsRecords.push(smsRecord);
        }
      } else {
        // If the number of messageIds doesn't match numbers, just save what we know
        for (let i = 0; i < numbers.length; i++) {
          const smsRecord = new SmsRecordModel({
            messageId: `phonebook-${phonebookId}-${Date.now()}-${i}`,
            fromNumber,
            toNumber: numbers[i],
            message,
            status: 'sent',
            userId: user.username || 'unknown',
            sentAt: now,
          });
          
          await smsRecord.save();
          smsRecords.push(smsRecord);
        }
      }
    }
    
    return NextResponse.json({ 
      success: true,
      messageIds,
      recipientCount: numbers.length,
      records: smsRecords.map(record => ({
        id: record._id,
        messageId: record.messageId,
        toNumber: record.toNumber,
        sentAt: record.sentAt
      }))
    });
  } catch (error) {
    console.error("Error sending SMS to phonebook:", error);
    return NextResponse.json(
      { error: "Failed to send SMS to phonebook" },
      { status: 500 }
    );
  }
} 