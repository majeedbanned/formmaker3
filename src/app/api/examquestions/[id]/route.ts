import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";
import { ObjectId } from "mongodb";

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

// DELETE: Delete a question from an exam
export async function DELETE(
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

    // Connect to database
    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    // Delete the question
    const result = await connection.collection("examquestions").deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Question deleted successfully" 
    });
  } catch (error) {
    console.error("Error in examquestions DELETE:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 