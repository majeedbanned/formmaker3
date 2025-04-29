import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import dayjs from "dayjs";
import jalaliday from "jalaliday";

// Set runtime to nodejs
export const runtime = 'nodejs';

// Initialize dayjs for Jalali dates
dayjs.extend(jalaliday);

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
    const { examId, entryTime, isFinished, responses } = body;

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

    // Create current date objects
    const now = new Date();
    // Format Persian date with date and time (YYYY/MM/DD HH:mm:ss)
    const persianDateTime = dayjs(now).locale('fa').format('YYYY/MM/DD HH:mm:ss');

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
            answers: responses || existingRecord.answers,
            isFinished: isFinished || existingRecord.isFinished,
            lastSavedTime: now,
            updatedAt: now
          }
        }
      );
    } else {
      // Create new record
      await examStudentsInfoCollection.insertOne({
        examId,
        userId,
        schoolCode,
        entryTime: entryTime || now.toISOString(),
        entryDate: now.toISOString(),
        persianEntryDate: persianDateTime,
        answers: responses || [],
        isFinished: isFinished || false,
        lastSavedTime: now,
        createdAt: now,
        updatedAt: now
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

export async function GET(request: NextRequest) {
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

    // Get exam ID from URL
    const url = new URL(request.url);
    const examId = url.searchParams.get("examId");
    
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

    // Find student's exam info
    const examInfo = await examStudentsInfoCollection.findOne({
      examId,
      userId
    });

    if (!examInfo) {
      return NextResponse.json({ 
        message: "No exam record found",
        answers: []
      });
    }

    return NextResponse.json({ 
      examInfo: {
        entryTime: examInfo.entryTime,
        entryDate: examInfo.entryDate,
        persianEntryDate: examInfo.persianEntryDate,
        isFinished: examInfo.isFinished,
        lastSavedTime: examInfo.lastSavedTime
      },
      answers: examInfo.answers || []
    });
  } catch (error) {
    console.error("Error fetching exam info:", error);
    return NextResponse.json(
      { message: "Error fetching exam info" },
      { status: 500 }
    );
  }
} 