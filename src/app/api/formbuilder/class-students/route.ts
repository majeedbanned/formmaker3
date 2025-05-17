import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classCode = searchParams.get("classCode");

    if (!classCode) {
      return NextResponse.json(
        { error: "Class code is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // First, fetch the class to verify it exists and get additional info
    const classData = await connection
      .collection("classes")
      .findOne({ "data.classCode": classCode });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to access this class data
    if (
      classData.data.schoolCode !== user.schoolCode &&
      user.userType !== "admin"
    ) {
      // For teachers, we need to verify they are assigned to this class
      if (user.userType === "teacher") {
        // Fetch teacher classes
        const teacherClasses = await connection
          .collection("teacherClasses")
          .find({
            teacherCode: user.username,
            "data.classCode": classCode,
          })
          .toArray();

        if (teacherClasses.length === 0) {
          return NextResponse.json(
            { error: "Unauthorized to access this class's data" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Unauthorized to access this class's data" },
          { status: 403 }
        );
      }
    }

    // Fetch students assigned to this class
    const students = await connection
      .collection("students")
      .find({ "data.classCode.value": classCode })
      .sort({ "data.studentFamily": 1 })
      .toArray();

    return NextResponse.json({ 
      students,
      className: classData.data.className,
    });
  } catch (error) {
    console.error("Error fetching class students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
} 