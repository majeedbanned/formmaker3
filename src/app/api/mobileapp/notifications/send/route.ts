import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// Load database configuration
const getDatabaseConfig = () => {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'database.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading database config:', error);
    return {};
  }
};

interface DatabaseConfig {
  [domain: string]: {
    schoolCode: string;
    connectionString: string;
    description: string;
  };
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

interface JWTPayload {
  userId: string;
  domain: string;
  schoolCode: string;
  role: string;
  userType: string;
  username: string;
  iat?: number;
  exp?: number;
}

// ASMX Web Service endpoint
const PUSH_SERVICE_ENDPOINT = 'http://push.farsamooz.ir/sendnotif.asmx';
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

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

// Helper function to send notifications via SOAP
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
        ${tokens.map((token) => `<string>${escapeXml(token)}</string>`).join('\n        ')}
      </tokens>
      <title>${escapeXml(title)}</title>
      <body>${escapeXml(body)}</body>
      <data>${escapeXml(dataJson)}</data>
    </SendPushNotificationBatch>
  </soap:Body>
</soap:Envelope>`;

  try {
    const response = await axios.post(PUSH_SERVICE_ENDPOINT, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://push.farsamooz.ir/SendPushNotificationBatch',
      },
      timeout: 30000,
    });

    // Parse SOAP response
    const parsedResponse = xmlParser.parse(response.data);
    const responseEnvelope = parsedResponse['soap:Envelope'] || parsedResponse['Envelope'];
    const soapBody = responseEnvelope['soap:Body'] || responseEnvelope['Body'];
    const methodResponse = soapBody['SendPushNotificationBatchResponse'];
    const result = methodResponse['SendPushNotificationBatchResult'];

    let resultData;
    if (typeof result === 'string') {
      try {
        resultData = JSON.parse(result);
      } catch {
        resultData = {
          Success: true,
          TotalTokens: tokens.length,
          SentCount: tokens.length,
          FailedCount: 0,
          Results: [],
        };
      }
    } else {
      resultData = result;
    }

    return {
      status: 200,
      statusText: 'OK',
      data: resultData,
    };
  } catch (error) {
    console.error('ASMX service error:', error);
    throw new Error('خطا در سرویس ارسال نوتیفیکشن: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function POST(request: NextRequest) {
  try {
    // console.log('Mobile notification send request received');

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    // Only teachers and school admins can send notifications
    if (decoded.userType !== 'teacher' && decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'شما مجاز به ارسال اعلان نیستید' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { studentCode, title, message: messageBody, data: customData } = body;

    // Validate input
    if (!studentCode) {
      return NextResponse.json(
        { success: false, message: 'کد دانش‌آموز الزامی است' },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'عنوان اعلان الزامی است' },
        { status: 400 }
      );
    }

    if (!messageBody || !messageBody.trim()) {
      return NextResponse.json(
        { success: false, message: 'متن پیام الزامی است' },
        { status: 400 }
      );
    }

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];

    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    // Verify school code matches
    if (domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();

    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      // Find student and get push tokens
      const student = await db.collection('students').findOne({
        'data.studentCode': studentCode,
        'data.schoolCode': decoded.schoolCode,
      });

      if (!student || !student.data) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'دانش‌آموز یافت نشد' },
          { status: 404 }
        );
      }

      const studentName = `${student.data.studentName || ''} ${student.data.studentFamily || ''}`.trim();

      // Extract active push tokens
      let tokens: string[] = [];
      if (student.data.pushTokens && Array.isArray(student.data.pushTokens)) {
        tokens = student.data.pushTokens
          .filter((t: any) => t.active !== false)
          .map((t: any) => t.token)
          .filter(Boolean);
      }

      if (tokens.length === 0) {
        // Save failed notification record
        const now = new Date();
        await db.collection('notificationrecords').insertOne({
          title: title.trim(),
          body: messageBody.trim(),
          recipientCodes: [studentCode],
          recipientDetails: [{ code: studentCode, name: studentName, type: 'student' }],
          pushTokens: [],
          tokenCount: 0,
          schoolCode: decoded.schoolCode,
          userId: decoded.username,
          userType: decoded.userType,
          sentAt: now,
          status: 'failed',
          data: customData || {},
        });

        await client.close();
        return NextResponse.json(
          { success: false, message: 'این دانش‌آموز توکن نوتیفیکیشن ندارد (برنامه را نصب نکرده است)' },
          { status: 400 }
        );
      }

      // Send push notifications via ASMX
      // console.log(`Sending notification to ${tokens.length} tokens for student: ${studentName}`);
      
      const soapResponse = await sendViaSoap(
        tokens,
        title.trim(),
        messageBody.trim(),
        customData || {}
      );

      // Save notification record
      const now = new Date();
      const notificationRecord = {
        title: title.trim(),
        body: messageBody.trim(),
        recipientCodes: [studentCode],
        recipientDetails: [{ code: studentCode, name: studentName, type: 'student' }],
        pushTokens: tokens,
        tokenCount: tokens.length,
        schoolCode: decoded.schoolCode,
        userId: decoded.username,
        userType: decoded.userType,
        sentAt: now,
        status: 'sent',
        expoResponse: soapResponse.data,
        data: customData || {},
      };

      await db.collection('notificationrecords').insertOne(notificationRecord);

      await client.close();

      // console.log(`Notification sent successfully by ${decoded.userType}: ${decoded.username} to student: ${studentCode}`);

      return NextResponse.json({
        success: true,
        message: 'اعلان با موفقیت ارسال شد',
        data: {
          tokenCount: tokens.length,
          studentName: studentName,
        },
      });
    } catch (dbError) {
      await client.close();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Mobile notification send API error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'خطای سرور داخلی' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

