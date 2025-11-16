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
  iat?: number;
  exp?: number;
}

export async function POST(request: NextRequest) {
  try {
    // console.log("Delete grade request received");
    
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

    // Check if user is teacher
    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند این عملیات را انجام دهند' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { recordId, gradeToDelete } = body;

    if (!recordId || !gradeToDelete) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات کامل ارسال نشده است' },
        { status: 400 }
      );
    }

    // console.log("Delete grade request for recordId:", recordId);

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
      // Find the record
      const record = await db.collection('classsheet').findOne({
        _id: new ObjectId(recordId),
        teacherCode: decoded.username,
        schoolCode: decoded.schoolCode
      });

      if (!record) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'رکورد یافت نشد یا شما دسترسی به آن ندارید' },
          { status: 404 }
        );
      }

      // Find and remove the specific grade from the grades array
      // We match based on all fields to ensure we delete the exact grade
      const updatedGrades = (record.grades || []).filter((grade: any) => {
        return !(
          grade.value === gradeToDelete.value &&
          grade.description === gradeToDelete.description &&
          grade.date === gradeToDelete.date &&
          (grade.totalPoints || 20) === (gradeToDelete.totalPoints || 20)
        );
      });

      // Update the record
      const updateResult = await db.collection('classsheet').updateOne(
        { _id: new ObjectId(recordId) },
        { $set: { grades: updatedGrades } }
      );

      if (updateResult.modifiedCount === 0) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'خطا در حذف نمره' },
          { status: 500 }
        );
      }

      await client.close();

      return NextResponse.json({
        success: true,
        message: 'نمره با موفقیت حذف شد'
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
    console.error('Delete grade API error:', error);
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

