import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get current user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const userId = user.id;
    if (!userId) {
      return NextResponse.json({ message: "User ID not found" }, { status: 400 });
    }

    // Get school code from user
    const schoolCode = user.schoolCode;
    if (!schoolCode) {
      return NextResponse.json({ message: "School code not found" }, { status: 400 });
    }

    // Get request body
    const body = await request.json();
    const { examId, entryTime, entryDate, isFinished } = body;

    if (!examId) {
      return NextResponse.json(
        { message: "Exam ID is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const examStudentsInfoCollection = connection.collection("examstudentsinfo");

    // Check if there's an existing record
    const existingRecord = await examStudentsInfoCollection.findOne({
      examId,
      userId,
      schoolCode
    });

    if (existingRecord) {
      // Update existing record
      await examStudentsInfoCollection.updateOne(
        { 
          examId,
          userId,
          schoolCode
        },
        { 
          $set: { 
            isFinished: isFinished || existingRecord.isFinished,
            lastSavedTime: new Date(),
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Create new record
      await examStudentsInfoCollection.insertOne({
        examId,
        userId,
        schoolCode,
        entryTime: entryTime || new Date().toISOString(),
        entryDate: entryDate || new Date().toISOString(),
        isFinished: isFinished || false,
        lastSavedTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ 
      message: "Exam info saved successfully"
    });
  } catch (error) {
    console.error("Error saving exam info:", error);
    return NextResponse.json(
      { message: "Error saving exam info" },
      { status: 500 }
    );
  }
} 