import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import axios from "axios";

// Set runtime to nodejs
export const runtime = 'nodejs';

// Expo push notification API endpoint
const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

// Type for the token object in collections
interface TokenObject {
  token: string;
  deviceInfo?: {
    deviceId?: string;
    platform?: string;
    model?: string;
    osVersion?: string | number;
  };
}

export async function POST(request: Request) {
  try {
    // Get domain from request headers for logging purposes
    const domain = request.headers.get("x-domain") || 'localhost:3000';
    
    // Get the authenticated user
    const user = await getCurrentUser();
    if (!user) {
      logger.warn(`Unauthorized attempt to send notifications from domain: ${domain}`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { recipientCodes, schoolCode, title, body: messageBody, data } = body;

    // Validate required fields
    if (!recipientCodes || !Array.isArray(recipientCodes) || recipientCodes.length === 0) {
      return NextResponse.json({ message: "recipientCodes array is required" }, { status: 400 });
    }

    if (!schoolCode) {
      return NextResponse.json({ message: "schoolCode is required" }, { status: 400 });
    }

    if (!title || !messageBody) {
      return NextResponse.json({ message: "title and body are required" }, { status: 400 });
    }

    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Initialize an array to collect all recipient tokens
    let tokens: string[] = [];

    // Find all tokens for school admins
    if (schoolCode) {
      const schoolsCollection = connection.collection('schools');
      const school = await schoolsCollection.findOne({ 'data.schoolCode': schoolCode });
      
      if (school && school.data?.tokens && Array.isArray(school.data.tokens)) {
        const schoolTokens = school.data.tokens.map((t: TokenObject) => t.token).filter(Boolean);
        tokens = [...tokens, ...schoolTokens];
      }
    }

    // Find all tokens for teachers in the recipientCodes list
    const teachersCollection = connection.collection('teachers');
    const teachers = await teachersCollection.find({ 
      'data.teacherCode': { $in: recipientCodes },
      'data.schoolCode': schoolCode
    }).toArray();

    teachers.forEach(teacher => {
      if (teacher.data?.tokens && Array.isArray(teacher.data.tokens)) {
        const teacherTokens = teacher.data.tokens.map((t: TokenObject) => t.token).filter(Boolean);
        tokens = [...tokens, ...teacherTokens];
      }
    });

    // Find all tokens for students in the recipientCodes list
    const studentsCollection = connection.collection('students');
    const students = await studentsCollection.find({ 
      'data.studentCode': { $in: recipientCodes.map(code => String(code)) },
      'data.schoolCode': schoolCode
    }).toArray();

    students.forEach(student => {
      if (student.data?.tokens && Array.isArray(student.data.tokens)) {
        const studentTokens = student.data.tokens.map((t: TokenObject) => t.token).filter(Boolean);
        tokens = [...tokens, ...studentTokens];
      }
    });

    // Remove duplicates
    tokens = [...new Set(tokens)];

    if (tokens.length === 0) {
      logger.info(`No push tokens found for recipients in school ${schoolCode}`);
      return NextResponse.json({ 
        message: "No push tokens found for the specified recipients", 
        sent: false,
        tokenCount: 0
      }, { status: 200 });
    }

    // Prepare notification payload
    const notifications = tokens.map(token => ({
      to: token,
      sound: "default",
      title: title,
      body: messageBody,
      data: data || {},
    }));

    // Send push notifications via Expo push notification service
    const response = await axios.post(EXPO_PUSH_ENDPOINT, notifications);

    logger.info(`Sent ${tokens.length} push notifications to recipients in school ${schoolCode}`);

    return NextResponse.json({
      message: "Notifications sent successfully",
      sent: true,
      tokenCount: tokens.length,
      results: response.data
    }, { status: 200 });
    
  } catch (error) {
    logger.error("Error sending push notifications:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message, sent: false },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: "خطا در ارسال اعلان‌ها", sent: false },
      { status: 500 }
    );
  }
} 