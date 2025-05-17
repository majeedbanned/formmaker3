import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get teacherCode from query parameter
    const { searchParams } = new URL(request.url);
    const teacherCode = searchParams.get('teacherCode');
    
    if (!teacherCode) {
      return NextResponse.json(
        { error: "Teacher code is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Fetch classes where this teacher is assigned
    const classes = await connection
      .collection("classes")
      .find({
        "data.teachers": {
          $elemMatch: { 
            teacherCode: teacherCode 
          }
        }
      })
      .project({
        "_id": 1,
        "data.className": 1,
        "data.classCode": 1,
        "data.Grade": 1,
        "data.major": 1,
        "data.teachers": 1
      })
      .toArray();
    
    return NextResponse.json({
      classes,
      teacherCode
    });
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher classes" },
      { status: 500 }
    );
  }
} 