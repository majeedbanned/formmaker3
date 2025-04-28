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
    const { responses } = body;

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { message: "Responses are required and must be an array" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const examStudentsResponseCollection = connection.collection("examstudentsresponse");

    // Process each response
    const operations = responses.map(response => {
      const { questionId, answer, examId } = response;
      
      return {
        updateOne: {
          filter: { 
            examId, 
            questionId, 
            userId,
            schoolCode
          },
          update: { 
            $set: { 
              answer,
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          upsert: true
        }
      };
    });

    // Execute bulk operation
    if (operations.length > 0) {
      await examStudentsResponseCollection.bulkWrite(operations);
    }

    return NextResponse.json({ 
      message: "Responses saved successfully",
      count: operations.length
    });
  } catch (error) {
    console.error("Error saving exam responses:", error);
    return NextResponse.json(
      { message: "Error saving exam responses" },
      { status: 500 }
    );
  }
} 