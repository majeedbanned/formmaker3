import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function POST(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school users can update student birthdates
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Only school administrators can update student birthdates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentCode, birthDate } = body;

    if (!studentCode) {
      return NextResponse.json(
        { error: "Student code is required" },
        { status: 400 }
      );
    }

    if (!birthDate) {
      return NextResponse.json(
        { error: "Birth date is required" },
        { status: 400 }
      );
    }

    // Validate birth date format (should be Persian YYYY/MM/DD)
    const dateRegex = /^[\u06F0-\u06F9\u0660-\u06690-9]{4}\/[\u06F0-\u06F9\u0660-\u06690-9]{2}\/[\u06F0-\u06F9\u0660-\u06690-9]{2}$/;
    if (!dateRegex.test(birthDate)) {
      return NextResponse.json(
        { error: "Invalid birth date format. Expected format: YYYY/MM/DD" },
        { status: 400 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Verify that the student exists and belongs to the school
    const student = await connection.collection("students").findOne({
      "data.studentCode": studentCode,
      // "data.schoolCode": user.schoolCode,
    });

    console.log(student,"student");

    if (!student) {
      return NextResponse.json(
        { error: "Student not found or doesn't belong to your school"+ },
        { status: 404 }
      );
    }

    // Update student record with new birth date
    const updateResult = await connection.collection("students").updateOne(
      { _id: student._id },
      { 
        $set: { 
          "data.birthDate": birthDate,
          updatedAt: new Date()
        } 
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update student birth date" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Birth date updated successfully",
      studentCode: studentCode,
      birthDate: birthDate,
    });

  } catch (error) {
    console.error("Error updating birth date:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 