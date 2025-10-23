import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    // Only school users can access preferences
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "فقط مدیران مدرسه می‌توانند به تنظیمات دسترسی داشته باشند" },
        { status: 403 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);

    // Find or create preferences for this school
    let preferences = await connection.collection("preferences").findOne({
      schoolCode: user.schoolCode,
    });

    // If no preferences found, create default ones
    if (!preferences) {
      const defaultPreferences = {
        schoolCode: user.schoolCode,
        allowStudentsToChangeProfile: false,
        notifications: {
          sendOnAbsence: false,
          sendOnGrade: false,
          sendOnEvent: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await connection.collection("preferences").insertOne(defaultPreferences);
      preferences = {
        _id: result.insertedId,
        ...defaultPreferences,
      };
    }

    return NextResponse.json({
      success: true,
      preferences: {
        allowStudentsToChangeProfile: preferences.allowStudentsToChangeProfile,
        notifications: preferences.notifications || {
          sendOnAbsence: false,
          sendOnGrade: false,
          sendOnEvent: false,
        },
      },
    });

  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تنظیمات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    // Only school users can modify preferences
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "فقط مدیران مدرسه می‌توانند تنظیمات را تغییر دهند" },
        { status: 403 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);

    // Parse request body
    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: "داده‌های تنظیمات نامعتبر است" },
        { status: 400 }
      );
    }

    // Validate preferences data
    const validPreferences: any = {
      allowStudentsToChangeProfile: Boolean(preferences.allowStudentsToChangeProfile),
    };

    // Add notification settings if provided
    if (preferences.notifications) {
      validPreferences.notifications = {
        sendOnAbsence: Boolean(preferences.notifications.sendOnAbsence),
        sendOnGrade: Boolean(preferences.notifications.sendOnGrade),
        sendOnEvent: Boolean(preferences.notifications.sendOnEvent),
      };
    }

    // Update or create preferences
    const result = await connection.collection("preferences").updateOne(
      { schoolCode: user.schoolCode },
      {
        $set: {
          ...validPreferences,
          schoolCode: user.schoolCode,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "تنظیمات با موفقیت ذخیره شد",
      preferences: validPreferences,
    });

  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      { error: "خطا در ذخیره تنظیمات" },
      { status: 500 }
    );
  }
}

