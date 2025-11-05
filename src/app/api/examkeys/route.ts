import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";
import { ObjectId } from "mongodb";

export const runtime = 'nodejs';

// POST: Save exam answer keys (for paper-based exams)
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

    // Verify token and get user data
    const userData = await verifyJWT(token);

    const body = await request.json();
    const { examId, keys } = body;

    // Validate required fields
    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "Keys array is required" }, { status: 400 });
    }

    // Validate each key
    for (const key of keys) {
      if (!key.questionNumber || key.questionNumber < 1) {
        return NextResponse.json(
          { error: `Invalid question number: ${key.questionNumber}` },
          { status: 400 }
        );
      }

      if (!key.category || !key.category.trim()) {
        return NextResponse.json(
          { error: `Category is required for question ${key.questionNumber}` },
          { status: 400 }
        );
      }

      if (!key.score || isNaN(parseFloat(key.score)) || key.score <= 0) {
        return NextResponse.json(
          { error: `Invalid score for question ${key.questionNumber}` },
          { status: 400 }
        );
      }

      if (!key.correctOption || key.correctOption < 1 || key.correctOption > 4) {
        return NextResponse.json(
          { error: `Correct option must be between 1 and 4 for question ${key.questionNumber}` },
          { status: 400 }
        );
      }

      if (!key.responseTime || isNaN(parseInt(key.responseTime)) || key.responseTime < 10) {
        return NextResponse.json(
          { error: `Invalid response time for question ${key.questionNumber}` },
          { status: 400 }
        );
      }
    }

    // Connect to database
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    // Get exam details for school code
    const exam = await connection.collection("exam").findOne({ 
      _id: new ObjectId(examId)
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const schoolCode = exam.schoolCode || userData.schoolCode || "";

    // First, delete all existing answer-key-only questions for this exam
    // This allows for editing existing keys
    const deleteResult = await connection.collection("examquestions").deleteMany({
      examId,
      isAnswerKeyOnly: true,
    });

    console.log(`Deleted ${deleteResult.deletedCount} existing answer keys for exam ${examId}`);

    // Prepare questions to insert
    const questionsToInsert = keys.map((key: any) => {
      // Create a minimal question object that matches the structure
      // when regular questions are added
      const minimalQuestion = {
        _id: `key_${examId}_${key.questionNumber}`, // Unique ID for this key
        id: key.questionNumber,
        questionkey: `exam_key_${key.questionNumber}`,
        question: `سوال شماره ${key.questionNumber}`,
        type: "testی", // Default type
        correctoption: key.correctOption,
        cat: key.category,
        cat1: key.category,
        cat2: "",
        cat3: "",
        cat4: "",
        grade: exam.grade || 0,
        difficulty: "متوسط",
        // For paper-based exams, we don't have the actual question content
        // but we need to maintain the structure
        isPaperBased: true, // Flag to identify this as a paper-based question key
      };

      return {
        examId,
        question: minimalQuestion,
        category: key.category.trim(),
        score: parseFloat(key.score),
        responseTime: parseInt(key.responseTime),
        addedBy: userData.username || "system",
        schoolCode,
        createdAt: new Date(),
        isAnswerKeyOnly: true, // Flag to identify this as an answer key only
      };
    });

    // Insert all questions (now that we've deleted old ones, no duplicates)
    let savedCount = 0;
    const errors: string[] = [];

    for (const question of questionsToInsert) {
      try {
        // Insert the question
        await connection.collection("examquestions").insertOne(question);
        savedCount++;
      } catch (error) {
        console.error(`Error inserting question ${question.question.id}:`, error);
        errors.push(`خطا در ذخیره سوال شماره ${question.question.id}`);
      }
    }

    if (savedCount === 0) {
      return NextResponse.json(
        { 
          error: "No keys were saved", 
          details: errors.length > 0 ? errors.join(", ") : "خطا در ذخیره کلیدها"
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      savedCount,
      totalKeys: keys.length,
      deletedCount: deleteResult.deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0 
        ? `${savedCount} کلید پاسخ ذخیره شد، ${errors.length} خطا رخ داد`
        : `${savedCount} کلید پاسخ با موفقیت ذخیره شد`
    });
  } catch (error) {
    console.error("Error in examkeys POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

