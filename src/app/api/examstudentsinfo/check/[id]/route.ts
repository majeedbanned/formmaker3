import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

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

    // Get user ID
    const userId = user.id;
    if (!userId) {
      return NextResponse.json({ message: "User ID not found" }, { status: 400 });
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
    const examStudentsInfoCollection = connection.collection("examstudentsinfo");

    // Check if student has already participated in this exam
    const existingRecord = await examStudentsInfoCollection.findOne({
      examId,
      userId,
      schoolCode
    });

    return NextResponse.json({ 
      participated: !!existingRecord,
      isFinished: existingRecord?.isFinished || false
    });
  } catch (error) {
    console.error("Error checking exam participation:", error);
    return NextResponse.json(
      { message: "Error checking exam participation" },
      { status: 500 }
    );
  }
} 