import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import axios from "axios";
import { getNotificationRecordModel } from "../models/notificationRecord";

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

interface RecipientDetail {
  code: string;
  name: string;
  type: 'student' | 'teacher';
}

export async function POST(request: Request) {
  const startTime = Date.now();
  let logPrefix = '[NotificationSend]';
  
  try {
    // Get domain from request headers for logging purposes
    const domain = request.headers.get("x-domain") || 'localhost:3000';
    logPrefix = `[NotificationSend][${domain}]`;
    
    logger.info(`${logPrefix} Starting notification send request`);
    
    // Get the authenticated user
    const user = await getCurrentUser();
    if (!user) {
      logger.warn(`${logPrefix} Unauthorized attempt to send notifications`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    logger.info(`${logPrefix} User: ${user.username} (${user.userType}), School: ${user.schoolCode}`);

    // Parse the request body
    const body = await request.json();
    const { recipientCodes, schoolCode, title, body: messageBody, data } = body;
    
    logger.info(`${logPrefix} Request body parsed: ${recipientCodes.length} recipient codes`);
    logger.info(`${logPrefix} Title: "${title}", Body length: ${messageBody?.length || 0} chars`);
    
    // Validate required fields
    if (!recipientCodes || !Array.isArray(recipientCodes) || recipientCodes.length === 0) {
      logger.error(`${logPrefix} Invalid recipientCodes`);
      return NextResponse.json({ message: "recipientCodes array is required" }, { status: 400 });
    }

    if (!schoolCode) {
      logger.error(`${logPrefix} Missing schoolCode`);
      return NextResponse.json({ message: "schoolCode is required" }, { status: 400 });
    }

    if (!title || !messageBody) {
      logger.error(`${logPrefix} Missing title or body`);
      return NextResponse.json({ message: "title and body are required" }, { status: 400 });
    }

    // Connect to database
    logger.info(`${logPrefix} Connecting to database...`);
    const connection = await connectToDatabase(domain);
    logger.info(`${logPrefix} Database connected`);
    
    // Initialize arrays to collect recipient data
    let tokens: string[] = [];
    const recipientDetails: RecipientDetail[] = [];

    // Find all tokens for teachers in the recipientCodes list
    logger.info(`${logPrefix} Querying teachers collection...`);
    const teachersCollection = connection.collection('teachers');
    const teachers = await teachersCollection.find({ 
      'data.teacherCode': { $in: recipientCodes },
      'data.schoolCode': schoolCode
    }).toArray();
    
    logger.info(`${logPrefix} Found ${teachers.length} teachers`);

    teachers.forEach((teacher: any) => {
      const teacherName = teacher.data?.teacherName || 'نامشخص';
      recipientDetails.push({
        code: teacher.data?.teacherCode,
        name: teacherName,
        type: 'teacher'
      });
      
      if (teacher.data?.pushTokens && Array.isArray(teacher.data.pushTokens)) {
        const teacherTokens = teacher.data.pushTokens
          .filter((t: any) => t.active !== false)
          .map((t: any) => t.token)
          .filter(Boolean);
        tokens = [...tokens, ...teacherTokens];
        logger.info(`${logPrefix} Teacher ${teacherName} (${teacher.data?.teacherCode}): ${teacherTokens.length} active tokens`);
      } else {
        logger.info(`${logPrefix} Teacher ${teacherName} (${teacher.data?.teacherCode}): No push tokens`);
      }
    });

    // Find all tokens for students in the recipientCodes list
    logger.info(`${logPrefix} Querying students collection...`);
    const studentsCollection = connection.collection('students');
    const students = await studentsCollection.find({ 
      'data.studentCode': { $in: recipientCodes.map(code => String(code)) },
      'data.schoolCode': schoolCode
    }).toArray();
    
    logger.info(`${logPrefix} Found ${students.length} students`);

    students.forEach((student: any) => {
      const studentName = `${student.data?.studentName || ''} ${student.data?.studentFamily || ''}`.trim() || 'نامشخص';
      recipientDetails.push({
        code: student.data?.studentCode,
        name: studentName,
        type: 'student'
      });
      
      if (student.data?.pushTokens && Array.isArray(student.data.pushTokens)) {
        const studentTokens = student.data.pushTokens
          .filter((t: any) => t.active !== false)
          .map((t: any) => t.token)
          .filter(Boolean);
        tokens = [...tokens, ...studentTokens];
        logger.info(`${logPrefix} Student ${studentName} (${student.data?.studentCode}): ${studentTokens.length} active tokens`);
      } else {
        logger.info(`${logPrefix} Student ${studentName} (${student.data?.studentCode}): No push tokens`);
      }
    });

    // Remove duplicate tokens
    const originalTokenCount = tokens.length;
    tokens = [...new Set(tokens)];
    logger.info(`${logPrefix} Total tokens collected: ${originalTokenCount}, Unique tokens: ${tokens.length}`);

    if (tokens.length === 0) {
      logger.warn(`${logPrefix} No push tokens found for any recipients`);
      
      // Save to database even if no tokens found
      const NotificationRecordModel = getNotificationRecordModel(connection);
      const notificationRecord = new NotificationRecordModel({
        title,
        body: messageBody,
        recipientCodes,
        recipientDetails,
        pushTokens: [],
        tokenCount: 0,
        schoolCode,
        userId: user.username || 'unknown',
        sentAt: new Date(),
        status: 'failed',
        data: data || {},
      });
      await notificationRecord.save();
      logger.info(`${logPrefix} Failed notification record saved to database`);
      
      return NextResponse.json({ 
        message: "No push tokens found for the specified recipients", 
        sent: false,
        tokenCount: 0
      }, { status: 200 });
    }

    // Prepare notification payload
    logger.info(`${logPrefix} Preparing notification payload for ${tokens.length} tokens...`);
    const notifications = tokens.map(token => ({
      to: token,
      sound: "default",
      title: title,
      body: messageBody,
      data: data || {},
    }));

    // Send push notifications via Expo push notification service
    logger.info(`${logPrefix} Sending notifications to Expo Push API...`);
    const response = await axios.post(EXPO_PUSH_ENDPOINT, notifications);
    logger.info(`${logPrefix} Expo API response received: ${response.status} ${response.statusText}`);
    logger.info(`${logPrefix} Expo response data:`, JSON.stringify(response.data).substring(0, 500));

    // Save notification record to database
    logger.info(`${logPrefix} Saving notification record to database...`);
    const NotificationRecordModel = getNotificationRecordModel(connection);
    const notificationRecord = new NotificationRecordModel({
      title,
      body: messageBody,
      recipientCodes,
      recipientDetails,
      pushTokens: tokens, // Store tokens but won't show to user
      tokenCount: tokens.length,
      schoolCode,
      userId: user.username || 'unknown',
      sentAt: new Date(),
      status: 'sent',
      expoResponse: response.data,
      data: data || {},
    });
    
    const savedRecord = await notificationRecord.save();
    logger.info(`${logPrefix} Notification record saved with ID: ${savedRecord._id}`);

    const duration = Date.now() - startTime;
    logger.info(`${logPrefix} Notification sending completed successfully in ${duration}ms`);
    logger.info(`${logPrefix} Summary: ${tokens.length} tokens, ${recipientDetails.length} recipients (${teachers.length} teachers, ${students.length} students)`);

    return NextResponse.json({
      message: "Notifications sent successfully",
      sent: true,
      tokenCount: tokens.length,
      recipientCount: recipientDetails.length,
      recordId: savedRecord._id,
      results: response.data
    }, { status: 200 });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${logPrefix} Error sending push notifications after ${duration}ms:`, error);
    
    if (axios.isAxiosError(error)) {
      logger.error(`${logPrefix} Axios error details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    
    if (error instanceof Error) {
      logger.error(`${logPrefix} Error message: ${error.message}`);
      logger.error(`${logPrefix} Error stack: ${error.stack}`);
      
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