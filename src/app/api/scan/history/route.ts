import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

// GET endpoint to fetch previous scan results for an exam
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json(
        { error: "Exam ID is required" },
        { status: 400 }
      );
    }

    const schoolCode = user.schoolCode;
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to database
    const connection = await connectToDatabase(domain);
    const examStudentsInfoCollection = connection.collection("examstudentsinfo");

    // Fetch all scanned results for this exam
    const scannedRecords = await examStudentsInfoCollection
      .find({
        examId: examId,
        schoolCode: schoolCode,
        gradingStatus: "scanned",
        scanResult: { $exists: true },
      })
      .sort({ gradingTime: -1 })
      .toArray();

    // Extract scan results
    const results = scannedRecords.map((record: any) => ({
      ...record.scanResult,
      studentCode: record.userId,
      scannedAt: record.gradingTime,
      score: record.sumScore,
      maxScore: record.maxScore,
    }));

    return NextResponse.json({
      success: true,
      results: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error fetching scan history:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan history" },
      { status: 500 }
    );
  }
}

