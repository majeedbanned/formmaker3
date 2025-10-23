import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";

// Helper endpoint to check if notification sending is enabled for specific event type
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('type'); // 'absence', 'grade', or 'event'

    const connection = await connectToDatabase(domain);

    // Find preferences for this school
    const preferences = await connection.collection("preferences").findOne({
      schoolCode: user.schoolCode,
    });

    // Default values if no preferences found
    const notificationSettings = preferences?.notifications || {
      sendOnAbsence: false,
      sendOnGrade: false,
      sendOnEvent: false,
    };

    // If specific type requested, return just that
    if (eventType) {
      const isEnabled = eventType === 'absence' ? notificationSettings.sendOnAbsence :
                       eventType === 'grade' ? notificationSettings.sendOnGrade :
                       eventType === 'event' ? notificationSettings.sendOnEvent :
                       false;

      return NextResponse.json({
        enabled: isEnabled,
        type: eventType,
      });
    }

    // Return all settings
    return NextResponse.json({
      notifications: notificationSettings,
    });

  } catch (error) {
    console.error("Error checking notification preferences:", error);
    return NextResponse.json(
      { error: "خطا در بررسی تنظیمات" },
      { status: 500 }
    );
  }
}

