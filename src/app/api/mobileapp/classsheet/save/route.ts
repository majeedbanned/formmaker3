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

export async function POST(request: NextRequest) {
  try {
    console.log("Mobile classsheet save request received");
    
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

    console.log("Mobile save request for user:", decoded.userType, decoded.username);

    // Check if user is teacher
    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند اطلاعات را ثبت کنند' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { 
      classCode, 
      studentCode, 
      courseCode, 
      timeSlot, 
      note, 
      grades, 
      presenceStatus, 
      descriptiveStatus, 
      assessments,
      date: requestedDate
    } = body;

    // Validate required fields
    if (!classCode || !studentCode || !courseCode || !timeSlot) {
      return NextResponse.json(
        { success: false, message: 'تمام فیلدهای الزامی را پر کنید' },
        { status: 400 }
      );
    }

    // Use requested date or calculate today's date
    let date: string;
    let workingDate: Date;
    
    if (requestedDate) {
      date = requestedDate;
      const [year, month, day] = requestedDate.split('-').map(Number);
      workingDate = new Date(year, month - 1, day);
      console.log("Using requested date for save:", date);
    } else {
      workingDate = new Date();
      date = dayjs(workingDate).format('YYYY-MM-DD');
      console.log("Using today's date for save:", date);
    }
    
    const persianDate = dayjs(workingDate).locale('fa').format('YYYY/MM/DD'); // Persian date with Persian digits
    const persianMonthName = dayjs(workingDate).locale('fa').format('MMMM'); // Persian month name

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

      // Create or update the cell data
      const result = await db.collection('classsheet').updateOne(
        {
          classCode: classCode,
          studentCode: studentCode,
          teacherCode: decoded.username,
          courseCode: courseCode,
          schoolCode: decoded.schoolCode,
          date: date,
          timeSlot: timeSlot,
        },
        {
          $set: {
            note: note || '',
            grades: grades || [],
            presenceStatus: presenceStatus || null,
            descriptiveStatus: descriptiveStatus || '',
            assessments: assessments || [],
            persianDate: persianDate,
            persianMonth: persianMonthName,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      );

      await client.close();

      console.log("Save result:", { upserted: result.upsertedCount > 0, modified: result.modifiedCount > 0 });

      return NextResponse.json({
        success: true,
        message: 'اطلاعات با موفقیت ثبت شد',
        upserted: result.upsertedCount > 0,
        modified: result.modifiedCount > 0,
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
    console.error('Error saving classsheet data:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت اطلاعات' },
      { status: 500 }
    );
  }
}

