import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school users can save SMS responses
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Only school administrators can save SMS responses" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      messageId,
      fromNumber,
      toNumbers,
      message,
      recipientCount,
      senderCode,
      schoolCode,
      smsResult,
      section // "absent" or "late"
    } = body;

    if (!messageId || !fromNumber || !toNumbers || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Create SMS response record
    const smsResponse = {
      messageId,
      fromNumber,
      toNumbers: Array.isArray(toNumbers) ? toNumbers : [toNumbers],
      message,
      recipientCount: recipientCount || (Array.isArray(toNumbers) ? toNumbers.length : 1),
      senderCode: senderCode || user.username,
      schoolCode: schoolCode || user.schoolCode,
      section: section || "unknown",
      smsResult: smsResult || {},
      sentAt: new Date(),
      createdAt: new Date()
    };

    // Save to database
    const result = await connection.collection("sms_responses").insertOne(smsResponse);

    return NextResponse.json({ 
      success: true,
      id: result.insertedId,
      message: "SMS response saved successfully"
    });

  } catch (error) {
    console.error("Error saving SMS response:", error);
    return NextResponse.json(
      { error: "Failed to save SMS response" },
      { status: 500 }
    );
  }
}
