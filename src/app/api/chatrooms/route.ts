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
      classCode?: { label: string; value: string }[];
      groups?: { label: string; value: string }[];
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
    
    // console.log(`Fetching chatrooms for school: ${schoolCode}, user: ${payload.userId}, userType: ${payload.userType}`);
    
    // Get all chatrooms for the school first
    const allChatrooms = await chatroomsCollection
      .find({ "data.schoolCode": schoolCode })
      .sort({ "updatedAt": -1 })
      .toArray();
    
    let filteredChatrooms: typeof allChatrooms = [];
    
    // Apply different filters based on user type
    if (payload.userType === 'school') {
      // School admins can see all chatrooms for their school
      filteredChatrooms = allChatrooms;
    } else if (payload.userType === 'teacher') {
      // Teachers can see chatrooms where they are listed as recipients
      filteredChatrooms = allChatrooms.filter(chatroom => {
        const recipients = chatroom.data.recipients;
        if (!recipients) return false;
        
        // Check if teacher is directly listed in teachers recipients
        if (recipients.teachers && Array.isArray(recipients.teachers)) {
          return recipients.teachers.some((teacher: string | { label: string; value: string }) => {
            // Handle both string values and object with value property
            const teacherValue = typeof teacher === 'string' ? teacher : teacher.value;
            return teacherValue === payload.userId || teacherValue === payload.username;
          });
        }
        
        return false;
      });
    } else if (payload.userType === 'student') {
      // Students can see chatrooms where they have access to
      filteredChatrooms = allChatrooms.filter(chatroom => {
        const recipients = chatroom.data.recipients;
        if (!recipients) return false;
        
        // Check if student is directly listed in students recipients
        if (recipients.students && Array.isArray(recipients.students)) {
          const hasDirectAccess = recipients.students.some((student: string | { label: string; value: string }) => {
            const studentValue = typeof student === 'string' ? student : student.value;
            return studentValue === payload.userId || studentValue === payload.username;
          });
          if (hasDirectAccess) return true;
        }
        
        // Check if student's class is in the recipients
        if (recipients.classCode && Array.isArray(recipients.classCode) && payload.classCode) {
          const studentClassCodes = payload.classCode.map(c => c.value);
          const hasClassAccess = recipients.classCode.some((classItem: string | { label: string; value: string }) => {
            const classValue = typeof classItem === 'string' ? classItem : classItem.value;
            return studentClassCodes.includes(classValue);
          });
          if (hasClassAccess) return true;
        }
        
        // Check if student's group is in the recipients
        if (recipients.groups && Array.isArray(recipients.groups) && payload.groups) {
          const studentGroupIds = payload.groups.map(g => g.value);
          const hasGroupAccess = recipients.groups.some((group: string | { label: string; value: string }) => {
            const groupValue = typeof group === 'string' ? group : group.value;
            return studentGroupIds.includes(groupValue);
          });
          if (hasGroupAccess) return true;
        }
        
        return false;
      });
    } else {
      // Unknown user type, no access
      filteredChatrooms = [];
    }
    
    // console.log(`Found ${filteredChatrooms.length} accessible chatrooms out of ${allChatrooms.length} total`);
    
    return NextResponse.json({ chatrooms: filteredChatrooms });
  } catch (error) {
    console.error("Error retrieving chatrooms:", error);
    return NextResponse.json(
      { message: "An error occurred while retrieving chatrooms" },
      { status: 500 }
    );
  }
} 