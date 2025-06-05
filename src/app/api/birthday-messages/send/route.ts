import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function POST(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientCode, recipientType, message, messageType } = body;

    if (!recipientCode || !message) {
      return NextResponse.json(
        { error: "Recipient code and message are required" },
        { status: 400 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);

    // Get recipient info
    let recipient = null;
    if (recipientType === "student") {
      recipient = await connection.collection("students").findOne({
        "data.studentCode": recipientCode,
        "data.schoolCode": user.schoolCode
      });
    } else if (recipientType === "teacher") {
      recipient = await connection.collection("teachers").findOne({
        "data.teacherCode": recipientCode,
        "data.schoolCode": user.schoolCode
      });
    }

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Create birthday message record
    const birthdayMessage = {
      senderCode: user.username,
      senderName: user.name,
      senderType: user.userType,
      recipientCode: recipientCode,
      recipientName: recipientType === "student" 
        ? `${recipient.data.studentName || ''} ${recipient.data.studentFamily || ''}`.trim()
        : recipient.data.teacherName,
      recipientType: recipientType,
      message: message,
      messageType: messageType || "birthday",
      schoolCode: user.schoolCode,
      isRead: false,
      isEdited: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the message
    const result = await connection.collection("birthdayMessages").insertOne(birthdayMessage);

    return NextResponse.json({
      success: true,
      messageId: result.insertedId,
      message: "Birthday message sent successfully"
    });

  } catch (error) {
    console.error("Error sending birthday message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 