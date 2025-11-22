import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

// GET a specific participant's data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the participant ID from params
    const participantId = (await params).id;
    
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
    const usersCollection = connection.collection("users");

    // Get participant details
    let participant;
    try {
      participant = await examStudentsInfoCollection.findOne({ _id: new ObjectId(participantId) });
    } catch (err) {
      return NextResponse.json(
        { message: "Invalid participant ID" },
        { status: 400 }
      );
    }

    if (!participant) {
      return NextResponse.json(
        { message: "Participant not found" },
        { status: 404 }
      );
    }

    // Get exam details
    let exam;
    try {
      exam = await examCollection.findOne({ _id: new ObjectId(participant.examId) });
    } catch {
      // If ID is not a valid ObjectId, try to find it by examCode
      exam = await examCollection.findOne({ "data.examCode": participant.examId });
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
    //     { message: "Not authorized to view participant data" },
    //     { status: 403 }
    //   );
    // }

    // Get user details for the participant
    try {
      const userInfo = await usersCollection.findOne({ _id: new ObjectId(participant.userId) });
      if (userInfo) {
        participant.userName = userInfo.name || userInfo.username;
      }
    } catch (err) {
      console.error(`Error fetching user info for ${participant.userId}:`, err);
    }

    return NextResponse.json(participant);
  } catch (err) {
    console.error("Error fetching participant data:", err);
    return NextResponse.json(
      { message: "Failed to fetch participant data" },
      { status: 500 }
    );
  }
}

// UPDATE a participant's data (primarily for grading)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the participant ID from params
    const participantId = (await params).id;
    
    // Get current user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a teacher or admin
    // if (user.userType !== "admin" && user.userType !== "teacher") {
    //   return NextResponse.json(
    //     { message: "Not authorized to update participant data" },
    //     { status: 403 }
    //   );
    // }

    // Get request body
    const requestData = await request.json();
    
    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const examStudentsInfoCollection = connection.collection("examstudentsinfo");

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    // Only allow certain fields to be updated
    if (requestData.answers) updateData.answers = requestData.answers;
    if (requestData.sumScore !== undefined) updateData.sumScore = requestData.sumScore;
    if (requestData.maxScore !== undefined) updateData.maxScore = requestData.maxScore;
    if (requestData.correctAnswerCount !== undefined) updateData.correctAnswerCount = requestData.correctAnswerCount;
    if (requestData.wrongAnswerCount !== undefined) updateData.wrongAnswerCount = requestData.wrongAnswerCount;
    if (requestData.unansweredCount !== undefined) updateData.unansweredCount = requestData.unansweredCount;
    if (requestData.gradingStatus) updateData.gradingStatus = requestData.gradingStatus;
    
    // Add updated timestamp
    updateData.updatedAt = new Date();
    updateData.updatedBy = user.id;

    // Update the participant data
    const result = await examStudentsInfoCollection.updateOne(
      { _id: new ObjectId(participantId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Participant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Participant data updated successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("Error updating participant data:", err);
    return NextResponse.json(
      { message: "Failed to update participant data" },
      { status: 500 }
    );
  }
}

// DELETE a participant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the participant ID from params
    const participantId = (await params).id;
    
    // Get current user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a teacher or admin
    // if (user.userType !== "admin" && user.userType !== "teacher") {
    //   return NextResponse.json(
    //     { message: "Not authorized to delete participant" },
    //     { status: 403 }
    //   );
    // }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const examStudentsInfoCollection = connection.collection("examstudentsinfo");

    // Delete the participant
    const result = await examStudentsInfoCollection.deleteOne({
      _id: new ObjectId(participantId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Participant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Participant deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting participant:", err);
    return NextResponse.json(
      { message: "Failed to delete participant" },
      { status: 500 }
    );
  }
} 