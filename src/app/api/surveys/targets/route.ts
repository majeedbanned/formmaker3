import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

// GET endpoint to fetch classes and teachers for targeting
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get("schoolCode");
    const type = searchParams.get("type"); // "classes" or "teachers"

    if (!schoolCode) {
      return NextResponse.json(
        { error: "School code is required" },
        { status: 400 }
      );
    }

    // Authorization check
    if (user.schoolCode !== schoolCode && user.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized to access this school's data" },
        { status: 403 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);

    if (type === "classes") {
      // Fetch classes
      let query: Record<string, unknown> = { "data.schoolCode": schoolCode };
      
      // If user is a teacher, only show their classes
      if (user.userType === "teacher") {
        query = {
          "data.schoolCode": schoolCode,
          "data.teachers.teacherCode": user.username || user.id
        };
      }

      const classes = await connection
        .collection("classes")
        .find(query)
        .project({
          "data.classCode": 1,
          "data.className": 1,
          "data.Grade": 1,
          "data.major": 1
        })
        .toArray();

      return NextResponse.json({ classes });
    } else if (type === "teachers") {
      // Only school admins can target teachers
      if (user.userType !== "school") {
        return NextResponse.json(
          { error: "Only school admins can target teachers" },
          { status: 403 }
        );
      }

      const teachers = await connection
        .collection("teachers")
        .find({ "data.schoolCode": schoolCode })
        .project({
          "data.teacherCode": 1,
          "data.teacherName": 1
        })
        .toArray();

      return NextResponse.json({ teachers });
    } else {
      return NextResponse.json(
        { error: "Type must be 'classes' or 'teachers'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error fetching targets:", error);
    return NextResponse.json(
      { error: "Failed to fetch targets" },
      { status: 500 }
    );
  }
} 