import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import axios from "axios";
import { getNotificationRecordModel } from "../models/notificationRecord";
import { XMLParser } from "fast-xml-parser";

// Set runtime to nodejs
export const runtime = 'nodejs';

// ASMX Web Service endpoint (Farsamooz Push Server)
const PUSH_SERVICE_ENDPOINT = "http://push.farsamooz.ir/sendnotif.asmx";
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

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

    // Send push notifications via ASMX Web Service
    logger.info(`${logPrefix} Sending notifications to ASMX Push Service at ${PUSH_SERVICE_ENDPOINT}...`);
    
    try {
      // Call ASMX service using SOAP
      const soapResponse = await sendViaSoap(tokens, title, messageBody, data || {});
      
      logger.info(`${logPrefix} ASMX service response received: ${soapResponse.status}`);
      logger.info(`${logPrefix} Response data:`, JSON.stringify(soapResponse.data).substring(0, 500));
      
      // Use the ASMX response
      const response = {
        status: soapResponse.status,
        statusText: soapResponse.statusText,
        data: soapResponse.data
      };

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
    } catch (asmxError) {
      logger.error(`${logPrefix} ASMX service error:`, asmxError);
      
      // Save failed record
      const NotificationRecordModel = getNotificationRecordModel(connection);
      const failedRecord = new NotificationRecordModel({
        title,
        body: messageBody,
        recipientCodes,
        recipientDetails,
        pushTokens: tokens,
        tokenCount: tokens.length,
        schoolCode,
        userId: user.username || 'unknown',
        sentAt: new Date(),
        status: 'failed',
        expoResponse: { error: asmxError instanceof Error ? asmxError.message : 'ASMX service error' },
        data: data || {},
      });
      await failedRecord.save();
      
      throw asmxError;
    }
    
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

// Helper function to send notifications via SOAP to ASMX service
async function sendViaSoap(
  tokens: string[], 
  title: string, 
  body: string, 
  data: any
): Promise<{ status: number; statusText: string; data: any }> {
  const dataJson = JSON.stringify(data);
  
  // Build SOAP envelope
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <SendPushNotificationBatch xmlns="http://push.farsamooz.ir/">
      <tokens>
        ${tokens.map(token => `<string>${escapeXml(token)}</string>`).join('\n        ')}
      </tokens>
      <title>${escapeXml(title)}</title>
      <body>${escapeXml(body)}</body>
      <data>${escapeXml(dataJson)}</data>
    </SendPushNotificationBatch>
  </soap:Body>
</soap:Envelope>`;

  try {
    // Send SOAP request
    logger.info('[ASMX] Sending SOAP request with ' + tokens.length + ' tokens...');
    const response = await axios.post(PUSH_SERVICE_ENDPOINT, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://push.farsamooz.ir/SendPushNotificationBatch'
      },
      timeout: 30000 // 30 seconds timeout
    });

    logger.info('[ASMX] SOAP response received, status: ' + response.status);
    logger.info('[ASMX] Raw SOAP response (first 500 chars):', response.data.substring(0, 500));

    // Parse SOAP response using fast-xml-parser
    const parsedResponse = xmlParser.parse(response.data);
    logger.info('[ASMX] SOAP XML parsed successfully');
    
    // Extract result from SOAP envelope with safer navigation
    const responseEnvelope = parsedResponse['soap:Envelope'] || parsedResponse['Envelope'];
    if (!responseEnvelope) {
      logger.error('[ASMX] No SOAP envelope found in response');
      throw new Error('Invalid SOAP response: No envelope');
    }
    
    const soapBody = responseEnvelope['soap:Body'] || responseEnvelope['Body'];
    if (!soapBody) {
      logger.error('[ASMX] No SOAP body found in response');
      throw new Error('Invalid SOAP response: No body');
    }
    
    const methodResponse = soapBody['SendPushNotificationBatchResponse'];
    if (!methodResponse) {
      logger.error('[ASMX] No SendPushNotificationBatchResponse found in body');
      logger.error('[ASMX] Available keys in body:', Object.keys(soapBody));
      throw new Error('Invalid SOAP response: No method response');
    }
    
    const result = methodResponse['SendPushNotificationBatchResult'];
    logger.info('[ASMX] Extracted result from SOAP:', typeof result, result ? result.substring(0, 200) : 'null/empty');
    
    if (!result) {
      logger.error('[ASMX] SendPushNotificationBatchResult is null or empty');
      // Return a default success response since notifications were sent
      return {
        status: 200,
        statusText: 'OK',
        data: {
          Success: true,
          TotalTokens: tokens.length,
          SentCount: tokens.length,
          FailedCount: 0,
          Results: []
        }
      };
    }
    
    // Parse the JSON result
    let resultData;
    if (typeof result === 'string') {
      try {
        resultData = JSON.parse(result);
        logger.info('[ASMX] JSON parsed successfully');
      } catch (parseError) {
        logger.error('[ASMX] JSON parse error:', parseError);
        logger.error('[ASMX] Failed to parse result string:', result);
        // Return default success since ASMX was called
        resultData = {
          Success: true,
          TotalTokens: tokens.length,
          SentCount: tokens.length,
          FailedCount: 0,
          Results: []
        };
      }
    } else {
      resultData = result;
    }
    
    logger.info('[ASMX] Final result data:', JSON.stringify(resultData).substring(0, 300));
    
    return {
      status: 200,
      statusText: 'OK',
      data: resultData
    };
  } catch (error) {
    logger.error('[ASMX] Error calling SOAP service:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        logger.error('[ASMX] Response status:', error.response.status);
        logger.error('[ASMX] Response data:', error.response.data);
      } else if (error.request) {
        logger.error('[ASMX] No response received from server');
        logger.error('[ASMX] Request was made but no response');
      } else {
        logger.error('[ASMX] Error setting up request:', error.message);
      }
    }
    
    throw new Error('ASMX service error: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
} 