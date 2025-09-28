import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school users can update absence status
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Only school administrators can update absence status" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      classCode,
      courseCode,
      studentCode,
      teacherCode,
      date,
      timeSlot,
      isAcceptable,
      description,
      schoolCode
    } = body;

    // Validate required fields
    if (!classCode || !courseCode || !studentCode || !teacherCode || !date || !timeSlot) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (typeof isAcceptable !== "boolean") {
      return NextResponse.json(
        { error: "isAcceptable must be a boolean value" },
        { status: 400 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Find the classsheet document
    const query = {
      classCode,
      courseCode,
      studentCode,
      teacherCode,
      date,
      timeSlot,
      schoolCode: schoolCode || user.schoolCode
    };

    const existingRecord = await connection.collection("classsheet").findOne(query);

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Classsheet record not found" },
        { status: 404 }
      );
    }

    // Update the document with absence status
    const updateData = {
      $set: {
        absenceAcceptable: isAcceptable,
        absenceDescription: description || "",
        updatedAt: new Date()
      }
    };

    const result = await connection.collection("classsheet").updateOne(
      { _id: existingRecord._id },
      updateData
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update absence status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Absence status updated successfully",
      recordId: existingRecord._id
    });

  } catch (error) {
    console.error("Error updating absence status:", error);
    return NextResponse.json(
      { error: "Failed to update absence status" },
      { status: 500 }
    );
  }
}
