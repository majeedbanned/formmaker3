import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

// Initialize dayjs for Jalali dates
dayjs.extend(jalaliday);

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

// GET - Fetch all comments for a specific class
export async function GET(request: NextRequest) {
  try {
    console.log("Mobile teacher comments fetch request received");
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند یادداشت‌ها را مشاهده کنند' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classCode = searchParams.get('classCode');
    const courseCode = searchParams.get('courseCode');
    const timeSlot = searchParams.get('timeSlot');

    if (!classCode || !courseCode || !timeSlot) {
      return NextResponse.json(
        { success: false, message: 'پارامترهای الزامی ارسال نشده است' },
        { status: 400 }
      );
    }

    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    if (domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400 }
      );
    }

    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);
    
    console.log("Connected to database:", dbName);

    try {
      // Verify teacher teaches this class
      const classDoc = await db.collection('classes').findOne({
        'data.classCode': classCode,
        'data.schoolCode': decoded.schoolCode
      });

      if (!classDoc) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'کلاس یافت نشد' },
          { status: 404 }
        );
      }

      const teacherTeachesClass = classDoc.data.teachers.some(
        (t: any) => t.teacherCode === decoded.username && t.courseCode === courseCode
      );

      if (!teacherTeachesClass) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'شما معلم این درس در این کلاس نیستید' },
          { status: 403 }
        );
      }

      // Fetch all comments for this class/course/teacher
      const comments = await db.collection('teacherComments')
        .find({
          schoolCode: decoded.schoolCode,
          teacherCode: decoded.username,
          courseCode: courseCode,
          classCode: classCode,
          timeSlot: timeSlot
        })
        .sort({ date: -1 })
        .limit(50)
        .toArray();

      await client.close();

      console.log("Found comments:", comments.length);

      return NextResponse.json({
        success: true,
        comments: comments
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      await client.close();
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error fetching teacher comments:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت یادداشت‌ها' },
      { status: 500 }
    );
  }
}

// POST - Add or update teacher comment for today
export async function POST(request: NextRequest) {
  try {
    console.log("Mobile teacher comment save request received");
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند یادداشت ثبت کنند' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { classCode, courseCode, timeSlot, comment } = body;

    if (!classCode || !courseCode || !timeSlot) {
      return NextResponse.json(
        { success: false, message: 'تمام فیلدهای الزامی را پر کنید' },
        { status: 400 }
      );
    }

    // Calculate today's date on the server side
    const now = new Date();
    const date = dayjs(now).format('YYYY-MM-DD');

    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    if (domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400 }
      );
    }

    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);
    
    console.log("Connected to database:", dbName);

    try {
      // Verify teacher teaches this class
      const classDoc = await db.collection('classes').findOne({
        'data.classCode': classCode,
        'data.schoolCode': decoded.schoolCode
      });

      if (!classDoc) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'کلاس یافت نشد' },
          { status: 404 }
        );
      }

      const teacherTeachesClass = classDoc.data.teachers.some(
        (t: any) => t.teacherCode === decoded.username && t.courseCode === courseCode
      );

      if (!teacherTeachesClass) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'شما معلم این درس در این کلاس نیستید' },
          { status: 403 }
        );
      }

      // Upsert the comment for today
      const result = await db.collection('teacherComments').updateOne(
        {
          schoolCode: decoded.schoolCode,
          teacherCode: decoded.username,
          courseCode: courseCode,
          classCode: classCode,
          date: date,
          timeSlot: timeSlot
        },
        {
          $set: {
            comment: comment,
            updatedAt: now
          },
          $setOnInsert: {
            createdAt: now
          }
        },
        { upsert: true }
      );

      await client.close();

      console.log("Comment save result:", { upserted: result.upsertedCount > 0, modified: result.modifiedCount > 0 });

      return NextResponse.json({
        success: true,
        message: 'یادداشت با موفقیت ذخیره شد'
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      await client.close();
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error saving teacher comment:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ذخیره یادداشت' },
      { status: 500 }
    );
  }
}

