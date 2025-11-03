import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

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
  name?: string;
  iat?: number;
  exp?: number;
}

// Helper function to get Persian date
function getPersianDate(): string {
  const now = new Date();
  const persianDate = now.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return persianDate;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Mobile message send request received');

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

    // Only teachers and school admins can send messages
    if (decoded.userType !== 'teacher' && decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'شما مجاز به ارسال پیام نیستید' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { studentCode, title, message: messageBody } = body;

    // Validate input
    if (!studentCode) {
      return NextResponse.json(
        { success: false, message: 'کد دانش‌آموز الزامی است' },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'عنوان پیام الزامی است' },
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
      // Verify student exists
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

      // Generate unique mailId
      const mailId = new ObjectId().toString();
      const persianDate = getPersianDate();
      const now = new Date();

      // Create message for emessages collection (sent items)
      const emailMessage = {
        recordId: mailId,
        sender: decoded.name || decoded.username,
        senderCode: decoded.username,
        title: title.trim(),
        message: messageBody.trim(),
        persianDate: persianDate,
        recipients: {
          students: [{ label: studentName, value: studentCode }],
          teachers: [],
          groups: [],
          classCode: [],
        },
        attachments: [],
        schoolCode: decoded.schoolCode,
        createdAt: now,
        updatedAt: now,
      };

      // Insert to emessages collection
      await db.collection('emessages').insertOne({ data: emailMessage });

      // Create message for messagelist collection (inbox for student)
      const inboxMessage = {
        mailId: mailId,
        sendername: decoded.name || decoded.username,
        sendercode: decoded.username,
        title: title.trim(),
        persiandate: persianDate,
        message: messageBody.trim(),
        receivercode: studentCode,
        files: [],
        isRead: false,
        createdAt: now.toISOString(),
      };

      // Insert to messagelist collection
      await db.collection('messagelist').insertOne({ data: inboxMessage });

      await client.close();

      console.log(`Message sent successfully by ${decoded.userType}: ${decoded.username} to student: ${studentCode}`);

      return NextResponse.json({
        success: true,
        message: 'پیام با موفقیت ارسال شد',
        data: {
          mailId: mailId,
          studentName: studentName,
          sentAt: persianDate,
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
    console.error('Mobile message send API error:', error);
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

