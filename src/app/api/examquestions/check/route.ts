import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";

// Set runtime to nodejs
export const runtime = 'nodejs';

// GET: Check if a question is already in an exam
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
    const questionId = searchParams.get("questionId");

    if (!examId || !questionId) {
      return NextResponse.json({ error: "Exam ID and Question ID are required" }, { status: 400 });
    }

    // Connect to database
    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    // Check if the question is already in the exam
    const existingQuestion = await connection.collection("examquestions").findOne({
      examId,
      "question._id": questionId
    });

    return NextResponse.json({ exists: !!existingQuestion });
  } catch (error) {
    console.error("Error in examquestions check:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 