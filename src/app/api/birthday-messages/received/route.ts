import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);

    // Fetch birthday messages received by this user
    const receivedMessages = await connection.collection("birthdayMessages")
      .find({
        recipientCode: user.username,
        schoolCode: user.schoolCode
      })
      .sort({ createdAt: -1 }) // Most recent first
      .toArray();

    // Mark messages as read
    if (receivedMessages.length > 0) {
      await connection.collection("birthdayMessages").updateMany(
        {
          recipientCode: user.username,
          schoolCode: user.schoolCode,
          isRead: false
        },
        {
          $set: { isRead: true, readAt: new Date() }
        }
      );
    }

    return NextResponse.json({
      success: true,
      messages: receivedMessages,
      count: receivedMessages.length
    });

  } catch (error) {
    console.error("Error fetching birthday messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 