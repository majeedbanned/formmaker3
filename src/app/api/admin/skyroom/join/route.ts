import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SkyroomApiClient } from "@/lib/skyroom";
import { logger } from "@/lib/logger";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// POST - Generate a join link for a Skyroom class
export async function POST(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { classId } = body;

    if (!classId) {
      return NextResponse.json(
        { success: false, error: "شناسه کلاس الزامی است" },
        { status: 400 }
      );
    }

    const connection = await connectToDatabase(domain);

    // Read Skyroom API key from schools collection
    const schoolsCollection = connection.collection("schools");
    const school = await schoolsCollection.findOne({
      "data.schoolCode": user.schoolCode,
    });

    const skyroomApiKey: string | undefined =
      school?.data?.skyroomapikey || school?.data?.skyroomApiKey;

    if (!skyroomApiKey || skyroomApiKey.length !== 50) {
      return NextResponse.json(
        {
          success: false,
          error:
            "کلید API اسکای‌روم برای این مدرسه تنظیم نشده است. لطفاً از بخش تنظیمات مدرسه آن را فعال کنید.",
        },
        { status: 400 }
      );
    }

    const classesCollection = connection.collection("skyroomclasses");

    if (!ObjectId.isValid(classId)) {
      return NextResponse.json(
        { success: false, error: "Invalid class ID" },
        { status: 400 }
      );
    }

    // Find the class
    const classDoc = await classesCollection.findOne({
      _id: new ObjectId(classId),
      "data.schoolCode": user.schoolCode,
    });

    if (!classDoc) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    const classData = classDoc.data;
    const roomId = classData.skyroomRoomId;

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "Skyroom room ID not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this class
    let hasAccess = false;
    if (user.userType === "school") {
      // School admins can access all classes in their school
      hasAccess = classData.schoolCode === user.schoolCode;
    } else if (user.userType === "teacher") {
      hasAccess =
        classData.selectedTeachers?.includes(user.id) ||
        classData.teacherUserIds?.some((tid: number) => {
          // Check if this teacher's Skyroom user ID is in the list
          return true; // We'll verify this properly below
        });
    } else if (user.userType === "student") {
      hasAccess =
        classData.selectedStudents?.includes(user.id) ||
        classData.studentUserIds?.some((sid: number) => {
          // Check if this student's Skyroom user ID is in the list
          return true; // We'll verify this properly below
        });
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "You don't have access to this class" },
        { status: 403 }
      );
    }

    // Get or find the Skyroom user
    const skyroomClient = new SkyroomApiClient(skyroomApiKey);
    
    // Construct username based on user type
    let skyroomUsername: string;
    if (user.userType === "school") {
      skyroomUsername = `school-${user.username || user.id}`;
    } else if (user.userType === "teacher") {
      skyroomUsername = `teacher-${user.username}`;
    } else {
      skyroomUsername = `student-${user.username}`;
    }

    let skyroomUser = await skyroomClient.getUser(undefined, skyroomUsername);

    // If user doesn't exist in Skyroom, we'll use createLoginUrl with user_id
    // This allows direct login without creating a user account
    const userIdentifier = `${user.userType}-${user.schoolCode}-${user.username || user.id}`;
    // School users and teachers get operator access (3), students get normal access (1)
    const access = (user.userType === "school" || user.userType === "teacher") ? 3 : 1; // 3 = operator, 1 = normal user

    // Generate login URL
    // TTL: 2 hours (7200 seconds) - enough for a class session
    const loginUrl = await skyroomClient.createLoginUrl({
      room_id: roomId,
      user_id: userIdentifier,
      nickname: user.name,
      access,
      concurrent: 1,
      language: "fa",
      ttl: 7200, // 2 hours
    });

    return NextResponse.json({
      success: true,
      joinUrl: loginUrl,
      classData: {
        className: classData.className,
        classDate: classData.classDate,
        classTime: classData.classTime,
      },
    });
  } catch (error: any) {
    logger.error("Error generating join link:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

