import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messageId, readTime, readPersianDate } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Connect to DB
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection("messagelist");

    // Mark message as read and store read time information
    const result = await collection.updateOne(
      { _id: new ObjectId(messageId), "data.receivercode": user.username },
      { 
        $set: { 
          "data.isRead": true,
          "data.readTime": readTime,
          "data.readPersianDate": readPersianDate
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Message not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
} 