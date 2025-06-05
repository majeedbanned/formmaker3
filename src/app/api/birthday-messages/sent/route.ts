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

    // Fetch birthday messages sent by this user
    const sentMessages = await connection.collection("birthdayMessages")
      .find({
        senderCode: user.username,
        schoolCode: user.schoolCode
      })
      .sort({ createdAt: -1 }) // Most recent first
      .toArray();

    return NextResponse.json({
      success: true,
      messages: sentMessages,
      count: sentMessages.length
    });

  } catch (error) {
    console.error("Error fetching sent birthday messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 