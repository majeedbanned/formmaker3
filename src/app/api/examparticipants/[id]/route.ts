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
    const examStudentsInfoCollection = connection.collection("examstudentsinfo");
    const examCollection = connection.collection("exam");
    const usersCollection = connection.collection("students");

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

    // Check if user is authorized (teacher or admin)
    // if (user.userType !== "admin" && user.userType !== "teacher" && exam.data.schoolCode !== schoolCode) {
    //   return NextResponse.json(
    //     { message: "Not authorized to view exam participants" },
    //     { status: 403 }
    //   );
    // }

    // Get all participants for this exam
    const participants = await examStudentsInfoCollection.find({
      examId: examId
    }).toArray();

    // Get user details for each participant
    const participantsWithUserInfo = await Promise.all(
      participants.map(async (participant) => {
        try {
          const userInfo = await usersCollection.findOne({ _id: new ObjectId(participant.userId) });
          
          return {
            ...participant,
            userName: userInfo ? (userInfo.studentName || userInfo.studentFamily) : participant.userId
          };
        } catch (error) {
          console.error(`Error fetching user info for ${participant.userId}:`, error);
          return {
            ...participant,
            userName: participant.userId
          };
        }
      })
    );

    return NextResponse.json(participantsWithUserInfo);
  } catch (error) {
    console.error("Error fetching exam participants:", error);
    return NextResponse.json(
      { message: "Failed to fetch exam participants" },
      { status: 500 }
    );
  }
} 