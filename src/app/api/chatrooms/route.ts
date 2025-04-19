import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";

// Set runtime to nodejs
export const runtime = 'nodejs';

/**
 * API endpoint to retrieve chatrooms for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authentication token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token and extract user data
    const payload = await verifyJWT(token) as {
      userId: string;
      userType: string;
      schoolCode: string;
      username: string;
      name: string;
      role: string;
    };

    // Ensure user has schoolCode
    const schoolCode = payload.schoolCode;
    if (!schoolCode) {
      return NextResponse.json(
        { message: "School code not found" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Access the chatrooms collection directly
    const chatroomsCollection = connection.collection('chatrooms');
    
    console.log(`Fetching chatrooms for school: ${schoolCode}, user: ${payload.userId}, userType: ${payload.userType}`);
    
    // Build filter object
    let filter = {};
    
    // Apply different filters based on user type
    if (payload.userType === 'school') {
      // School admins can see all chatrooms for their school
      filter = { "data.schoolCode": schoolCode };
    } else if (payload.userType === 'teacher') {
      // Teachers can see chatrooms where they are listed as recipients
      filter = {
        "data.schoolCode": schoolCode,
        $or: [
          { "data.recipients.teachers": payload.userId },
          // Include chatrooms targeted at the teacher's classes if we had that info
        ]
      };
    } else if (payload.userType === 'student') {
      // Students can see chatrooms where they are listed as recipients
      filter = {
        "data.schoolCode": schoolCode,
        $or: [
          { "data.recipients.students": payload.userId },
          // Include chatrooms targeted at the student's class or groups if we had that info
        ]
      };
    }
    
    // Query chatrooms
    const chatrooms = await chatroomsCollection
      .find()
      .sort({ "data.updatedAt": -1 })
      .toArray();
    
    console.log(`Found ${chatrooms.length} chatrooms`);
    
    return NextResponse.json({ chatrooms });
  } catch (error) {
    console.error("Error retrieving chatrooms:", error);
    return NextResponse.json(
      { message: "An error occurred while retrieving chatrooms" },
      { status: 500 }
    );
  }
} 