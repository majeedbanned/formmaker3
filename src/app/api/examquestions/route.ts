import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";

// Set runtime to nodejs
export const runtime = 'nodejs';

// GET: Fetch questions for an exam
export async function GET(request: NextRequest) {
  try {
    // Get authentication token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token - we don't need the data but we verify auth is valid
    await verifyJWT(token);

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    // Connect to database
    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    // Get questions for this exam
    const questions = await connection.collection("examquestions")
      .find({ examId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error in examquestions GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Save a question to an exam
export async function POST(request: NextRequest) {
  try {
    // Get authentication token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token - we don't need the data but we verify auth is valid
    await verifyJWT(token);

    const body = await request.json();
    const { examId, question, category, score, responseTime, addedBy, schoolCode } = body;

    // Validate required fields
    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }
    
    if (!question) {
      return NextResponse.json({ error: "Question data is required" }, { status: 400 });
    }

    if (!category || !category.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    if (!score || isNaN(parseFloat(score))) {
      return NextResponse.json({ error: "Valid score is required" }, { status: 400 });
    }

    if (!responseTime || isNaN(parseInt(responseTime)) || parseInt(responseTime) < 10) {
      return NextResponse.json({ error: "Valid response time is required (minimum 10 seconds)" }, { status: 400 });
    }

    // Normalize category
    const normalizedCategory = category.trim();

    // Connect to database
    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    // Check if this question is already added to this exam
    const existingQuestion = await connection.collection("examquestions").findOne({
      examId,
      "question._id": question._id
    });

    if (existingQuestion) {
      return NextResponse.json(
        { error: "This question is already added to this exam" }, 
        { status: 400 }
      );
    }

    // Insert the question
    const result = await connection.collection("examquestions").insertOne({
      examId,
      question,
      category: normalizedCategory,
      score: parseFloat(score),
      responseTime: parseInt(responseTime),
      addedBy,
      schoolCode,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: "Question added to exam successfully" 
    });
  } catch (error) {
    console.error("Error in examquestions POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 