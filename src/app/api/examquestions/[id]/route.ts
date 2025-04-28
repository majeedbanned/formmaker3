import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

// PATCH: Update a question in an exam
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { category, score, responseTime } = body;

    // Validate fields
    if (!category || !category.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    if (!score || isNaN(parseFloat(score))) {
      return NextResponse.json({ error: "Valid score is required" }, { status: 400 });
    }

    if (!responseTime || isNaN(parseInt(responseTime)) || parseInt(responseTime) < 10) {
      return NextResponse.json({ error: "Valid response time is required (minimum 10 seconds)" }, { status: 400 });
    }

    // Connect to database
    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    // Check if question exists
    const existingQuestion = await connection.collection("examquestions").findOne({
      _id: new ObjectId(id)
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Question not found" }, 
        { status: 404 }
      );
    }

    // Update the question
    const result = await connection.collection("examquestions").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          category: category.trim(),
          score: parseFloat(score),
          responseTime: parseInt(responseTime),
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Question updated successfully" 
    });
  } catch (error) {
    console.error("Error in examquestions PATCH:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Edit/update a question in an exam
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const body = await request.json();
    
    // Validate id
    if (!id) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    const db = await connectToDatabase(domain);
    
    // Get the original exam question
    const originalQuestion = await db.collection('examquestions').findOne({
      _id: new ObjectId(id)
    });

    if (!originalQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Create update operation with metadata fields
    const updateOperation: any = {
      $set: {
        score: body.score,
        responseTime: body.responseTime,
        category: body.category,
        updatedAt: new Date().toISOString(),
      }
    };

    // If question content or options are provided, update those as well
    if (body.question || body.option1 || body.option2 || body.option3 || body.option4 || body.correctoption) {
      // Start with the existing question
      const updatedQuestion = { ...originalQuestion.question };
      
      // Update the fields that were provided
      if (body.question) updatedQuestion.question = body.question;
      if (body.option1) updatedQuestion.option1 = body.option1;
      if (body.option2) updatedQuestion.option2 = body.option2;
      if (body.option3) updatedQuestion.option3 = body.option3;
      if (body.option4) updatedQuestion.option4 = body.option4;
      if (body.correctoption) updatedQuestion.correctoption = body.correctoption;
      
      // Add the updated question to the update operation
      updateOperation.$set["question"] = updatedQuestion;
    }
    
    // Update the exam question
    const result = await db.collection('examquestions').findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateOperation,
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update exam question' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating exam question:', error);
    return NextResponse.json(
      { error: 'Failed to update exam question' },
      { status: 500 }
    );
  }
}

// Delete a question from an exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Validate id
    if (!id) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    const db = await connectToDatabase(domain);
    
    // Delete the exam question
    const result = await db.collection('examquestions').deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Exam question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam question:', error);
    return NextResponse.json(
      { error: 'Failed to delete exam question' },
      { status: 500 }
    );
  }
}

// GET: Fetch all questions for a specific exam
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
    const examQuestionsCollection = connection.collection("examquestions");

    // Find all questions for this exam
    const questions = await examQuestionsCollection
      .find({ 
        examId,
        schoolCode
      })
      .toArray();

    // Return the questions
    return NextResponse.json(questions);
  } catch (error: unknown) {
    console.error("Error fetching exam questions:", error);
    return NextResponse.json(
      { message: "Error fetching exam questions" },
      { status: 500 }
    );
  }
} 