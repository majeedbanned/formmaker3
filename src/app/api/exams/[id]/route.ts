import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the exam ID from params
    const examId = (await params).id;
    
    // Get current user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get school code from user
    const schoolCode = user.schoolCode;
    if (!schoolCode) {
      return NextResponse.json({ message: "School code not found" }, { status: 400 });
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const examCollection = connection.collection("exam");

    // Get exam details
    let exam;
    try {
      exam = await examCollection.findOne({ _id: new ObjectId(examId) });
    } catch {
      // If ID is not a valid ObjectId, try to find it by examCode
      exam = await examCollection.findOne({ "data.examCode": examId });
    }

    if (!exam) {
      return NextResponse.json(
        { message: "Exam not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized (teacher, admin, or student in the correct school)
    if (user.userType !== "admin" && user.userType !== "teacher" && exam.data.schoolCode !== schoolCode) {
      return NextResponse.json(
        { message: "Not authorized to view this exam" },
        { status: 403 }
      );
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { message: "Failed to fetch exam" },
      { status: 500 }
    );
  }
} 