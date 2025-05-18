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
    const studentCode = searchParams.get("studentCode");

    if (!studentCode) {
      return NextResponse.json(
        { error: "Student code is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Fetch student information including the avatar
    const student = await connection
      .collection("students")
      .findOne({ "data.studentCode": studentCode });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to access this student data
    if (
      student.data?.schoolCode !== user.schoolCode &&
      user.userType !== "admin"
    ) {
      // For teachers, we need to verify they are assigned to this student's class
      if (user.userType === "teacher") {
        const classCode = student.data?.classCode?.value;
        
        if (classCode) {
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
              { error: "Unauthorized to access this student's data" },
              { status: 403 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "Student has no assigned class" },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Unauthorized to access this student's data" },
          { status: 403 }
        );
      }
    }

    // Return the student information
    return NextResponse.json({ 
      student
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    return NextResponse.json(
      { error: "Failed to fetch student details" },
      { status: 500 }
    );
  }
} 