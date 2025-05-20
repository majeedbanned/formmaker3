import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { logger } from "@/lib/logger";

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can update schedules
    if (currentUser.role !== "school") {
      return NextResponse.json(
        { error: "Only school administrators can update schedules" },
        { status: 403 }
      );
    }

    // Parse request body
    const { classCode, teacherCode, courseCode, weeklySchedule } = await req.json();

    // Validate required fields
    if (!classCode || !teacherCode || !courseCode) {
      return NextResponse.json(
        { error: "Missing required fields: classCode, teacherCode, courseCode" },
        { status: 400 }
      );
    }

    // Validate weeklySchedule
    if (!Array.isArray(weeklySchedule)) {
      return NextResponse.json(
        { error: "weeklySchedule must be an array" },
        { status: 400 }
      );
    }

    const domain = req.headers.get("x-domain") || "localhost:3000";
    logger.info(`Updating weekly schedule for class ${classCode}, teacher ${teacherCode}, course ${courseCode}`, { domain });

    // Connect to database
    const connection = await connectToDatabase(domain);
    const classesCollection = connection.collection("classes");

    // Find the class document
    const classDocument = await classesCollection.findOne({
      "data.classCode": classCode
    });

    if (!classDocument) {
      return NextResponse.json(
        { error: `Class with code ${classCode} not found` },
        { status: 404 }
      );
    }

    // Verify the class belongs to the current user's school
    if (classDocument.data.schoolCode !== currentUser.schoolCode) {
      return NextResponse.json(
        { error: "Unauthorized to update this class" },
        { status: 403 }
      );
    }

    // Find the specific teacher in the class's teachers array
    const teacherIndex = classDocument.data.teachers.findIndex(
      (teacher: { teacherCode: string; courseCode: string }) => 
        teacher.teacherCode === teacherCode && teacher.courseCode === courseCode
    );

    if (teacherIndex === -1) {
      return NextResponse.json(
        { error: `Teacher ${teacherCode} with course ${courseCode} not found in class ${classCode}` },
        { status: 404 }
      );
    }

    // Update the teacher's weekly schedule
    const result = await classesCollection.updateOne(
      {
        "data.classCode": classCode,
        "data.teachers": {
          $elemMatch: {
            teacherCode: teacherCode,
            courseCode: courseCode
          }
        }
      },
      {
        $set: {
          [`data.teachers.$.weeklySchedule`]: weeklySchedule
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update weekly schedule - no matching document found" },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "No changes made to the weekly schedule" },
        { status: 200 }
      );
    }

    logger.info(`Successfully updated weekly schedule for class ${classCode}, teacher ${teacherCode}, course ${courseCode}`, { domain });

    return NextResponse.json({
      success: true,
      message: "Weekly schedule updated successfully"
    });
  } catch (error) {
    logger.error("Error updating weekly schedule:", error);
    return NextResponse.json(
      { error: "Failed to update weekly schedule" },
      { status: 500 }
    );
  }
} 