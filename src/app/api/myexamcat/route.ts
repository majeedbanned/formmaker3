import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";

// Set runtime to nodejs
export const runtime = 'nodejs';

// GET: Fetch categories for an exam
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
    const username = searchParams.get("username");

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    // Connect to database
    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    // Get categories for this exam/user combination
    const categories = await connection.collection("examcat")
      .find({ 
        examId, 
        username: username || { $exists: true } 
      })
      .toArray();

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error in examcat GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Create a new category
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
    const { examId, username, categoryName, schoolCode } = body;

    if (!examId) {
      return NextResponse.json({ error: "ExamID is required" }, { status: 400 });
    }
    
    if (!categoryName || !categoryName.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }
    
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Trim and normalize category name
    const normalizedCategoryName = categoryName.trim();
    
    // Connect to database
    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    // Check if category already exists
    const existingCategory = await connection.collection("examcat").findOne({
      examId,
      username,
      categoryName: normalizedCategoryName,
    });

    if (existingCategory) {
      return NextResponse.json({ message: "Category already exists", id: existingCategory._id });
    }

    // Insert new category
    const result = await connection.collection("examcat").insertOne({
      examId,
      username,
      categoryName: normalizedCategoryName,
      schoolCode,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: "Category created successfully" 
    });
  } catch (error) {
    console.error("Error in examcat POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 