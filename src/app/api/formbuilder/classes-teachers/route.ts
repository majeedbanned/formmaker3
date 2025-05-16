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

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Fetch classes
    const classes = await connection
      .collection("classes")
      .find({})
      .project({
        "_id": 1,
        "data.className": 1,
        "data.classCode": 1,
        "data.Grade": 1,
        "data.major": 1,
        "data.teachers": 1
      })
      .toArray();
    
    // Fetch teachers
    const teachers = await connection
      .collection("teachers")
      .find({})
      .project({
        "_id": 1,
        "data.teacherName": 1,
        "data.teacherCode": 1
      })
      .toArray();

    return NextResponse.json({
      classes,
      teachers,
    });
  } catch (error) {
    console.error("Error fetching classes and teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
} 