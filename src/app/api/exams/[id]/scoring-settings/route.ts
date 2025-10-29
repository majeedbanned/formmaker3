import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

interface ScoringSettings {
  useNegativeMarking?: boolean;
  wrongAnswersPerDeduction?: number;
  useWeighting?: boolean;
  categoryWeights?: Record<string, number>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const examId = (await params).id;
    
    // Get current user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to database
    const connection = await connectToDatabase(domain);
    const examCollection = connection.collection("exam");

    // Get exam
    let exam;
    try {
      exam = await examCollection.findOne({ _id: new ObjectId(examId) });
    } catch {
      exam = await examCollection.findOne({ "data.examCode": examId });
    }

    if (!exam) {
      return NextResponse.json({ message: "Exam not found" }, { status: 404 });
    }

    // Check authorization
    if (exam.data.schoolCode !== user.schoolCode) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    // Return scoring settings (or defaults if not set)
    const scoringSettings: ScoringSettings = {
      useNegativeMarking: exam.data.scoringSettings?.useNegativeMarking || false,
      wrongAnswersPerDeduction: exam.data.scoringSettings?.wrongAnswersPerDeduction || 3,
      useWeighting: exam.data.scoringSettings?.useWeighting || false,
      categoryWeights: exam.data.scoringSettings?.categoryWeights || {},
    };

    return NextResponse.json(scoringSettings);
  } catch (error) {
    console.error("Error fetching scoring settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch scoring settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const examId = (await params).id;
    
    // Get current user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only school admins and teachers can update scoring settings
    if (user.userType === 'student') {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Parse request body
    const body = await request.json();
    const scoringSettings: ScoringSettings = {
      useNegativeMarking: body.useNegativeMarking,
      wrongAnswersPerDeduction: body.wrongAnswersPerDeduction,
      useWeighting: body.useWeighting,
      categoryWeights: body.categoryWeights,
    };

    // Connect to database
    const connection = await connectToDatabase(domain);
    const examCollection = connection.collection("exam");

    // Get exam first to verify ownership
    let exam;
    try {
      exam = await examCollection.findOne({ _id: new ObjectId(examId) });
    } catch {
      exam = await examCollection.findOne({ "data.examCode": examId });
    }

    if (!exam) {
      return NextResponse.json({ message: "Exam not found" }, { status: 404 });
    }

    // Check authorization
    if (exam.data.schoolCode !== user.schoolCode) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    // Update exam with scoring settings
    const updateResult = await examCollection.updateOne(
      { _id: exam._id },
      {
        $set: {
          "data.scoringSettings": scoringSettings,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { message: "Failed to update scoring settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Scoring settings updated successfully",
      scoringSettings,
    });
  } catch (error) {
    console.error("Error updating scoring settings:", error);
    return NextResponse.json(
      { message: "Failed to update scoring settings" },
      { status: 500 }
    );
  }
}

