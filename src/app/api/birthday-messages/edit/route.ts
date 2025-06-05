import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function PUT(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, newMessage } = body;

    if (!messageId || !newMessage) {
      return NextResponse.json(
        { error: "Message ID and new message are required" },
        { status: 400 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);

    // Check if message exists and user is the sender
    const existingMessage = await connection.collection("birthdayMessages").findOne({
      _id: new ObjectId(messageId),
      senderCode: user.username,
      schoolCode: user.schoolCode
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: "Message not found or you don't have permission to edit it" },
        { status: 404 }
      );
    }

    // Update the message
    const result = await connection.collection("birthdayMessages").updateOne(
      { _id: new ObjectId(messageId) },
      {
        $set: {
          message: newMessage,
          isEdited: true,
          editedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message updated successfully"
    });

  } catch (error) {
    console.error("Error editing birthday message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 