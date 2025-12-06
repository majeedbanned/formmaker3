import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { smsApi } from '@/lib/smsService';

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

export async function POST(request: NextRequest) {
  try {
    // console.log('Mobile SMS send request received');

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

    // Only teachers and school admins can send SMS
    if (decoded.userType !== 'teacher' && decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'شما مجاز به ارسال پیامک نیستید' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { phoneNumbers, message, studentCodes } = body;

    // Validate input
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'شماره تلفن الزامی است' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
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
      // Get school data for SMS credentials and from number
      const school = await db.collection('schools').findOne({
        'data.schoolCode': decoded.schoolCode,
      });

      if (!school || !school.data) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'اطلاعات مدرسه یافت نشد' },
          { status: 404 }
        );
      }

      // Check if SMS credentials are configured
      if (!school.data.SMS_USERNAME || !school.data.SMS_PASSWORD) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'اطلاعات پیامک برای مدرسه تنظیم نشده است' },
          { status: 400 }
        );
      }

      // Use school code or a default from number (you may want to get this from school data)
    //  const fromNumber = decoded.schoolCode;
      const fromNumber= "9998762911";

      // Send SMS using the SMS service
      // console.log('Sending SMS to:', phoneNumbers, 'Message:', message);
      const messageIds = await smsApi.sendSMS(
        decoded.domain,
        fromNumber,
        phoneNumbers,
        message,
        decoded.schoolCode
      );

      // Save SMS records to database
      const now = new Date();
      const smsRecords = [];

      if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
        for (let i = 0; i < phoneNumbers.length; i++) {
          const messageId = messageIds[i] || `unknown-${Date.now()}-${i}`;
          
          const smsRecord = {
            messageId,
            fromNumber,
            toNumber: phoneNumbers[i],
            message,
            status: 'sent',
            userId: decoded.username,
            userType: decoded.userType,
            schoolCode: decoded.schoolCode,
            studentCode: studentCodes && studentCodes[i] ? studentCodes[i] : null,
            sentAt: now,
            createdAt: now,
          };
          
          // Save record to smsrecords collection
          await db.collection('smsrecords').insertOne(smsRecord);
          smsRecords.push({
            messageId,
            toNumber: phoneNumbers[i],
            sentAt: now,
          });
        }
      }

      await client.close();

      // console.log(`SMS sent successfully by ${decoded.userType}: ${decoded.username}, count: ${phoneNumbers.length}`);

      return NextResponse.json({
        success: true,
        message: 'پیامک با موفقیت ارسال شد',
        data: {
          messageIds,
          sentCount: phoneNumbers.length,
          records: smsRecords,
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
    console.error('Mobile SMS send API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
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


