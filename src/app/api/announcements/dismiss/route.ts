import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

// POST endpoint to dismiss an announcement (don't show again)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { announcementIds } = body;

    if (!announcementIds || !Array.isArray(announcementIds)) {
      return NextResponse.json(
        { error: "announcementIds array is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);

    // Update or create user preferences
    const result = await connection
      .collection("user_announcement_preferences")
      .updateOne(
        { userId: user.id },
        {
          $addToSet: {
            dismissedAnnouncements: { $each: announcementIds },
          },
          $set: {
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: {
            userId: user.id,
            username: user.username,
            userType: user.userType || user.role,
            schoolCode: user.schoolCode,
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );

    return NextResponse.json({
      success: true,
      message: "Announcements dismissed successfully",
    });
  } catch (error) {
    console.error("Error dismissing announcements:", error);
    return NextResponse.json(
      { error: "Failed to dismiss announcements" },
      { status: 500 }
    );
  }
}

