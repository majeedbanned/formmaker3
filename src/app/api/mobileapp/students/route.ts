import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
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

interface Student {
  id: string;
  studentName: string;
  studentFamily: string;
  studentCode: string;
  classCode: string;
  schoolCode: string;
  phone?: string;
  isActive: boolean;
  addedAt: string;
  lastUpdated: string;
}

export async function GET(request: NextRequest) {
    try {
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

    // Check if user is school/admin
    if (decoded.role !== 'school' && decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز - فقط مدیران مدرسه می‌توانند لیست دانش‌آموزان را مشاهده کنند' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const classCode = searchParams.get('classCode') || '';

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
      // Build query filter
      const filter: any = {
        'data.schoolCode': decoded.schoolCode,
        'data.isActive': true
      };

      // Add search filter
      if (search) {
        filter.$or = [
          { 'data.studentName': { $regex: search, $options: 'i' } },
          { 'data.studentFamily': { $regex: search, $options: 'i' } },
          { 'data.studentCode': { $regex: search, $options: 'i' } }
        ];
      }

      // Add class filter
      if (classCode) {
        // Filter by classCode value in the array
        filter['data.classCode.value'] = classCode;
      }

      // Get total count for pagination
      const totalCount = await db.collection('students').countDocuments(filter);

      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalCount / limit);

      // Fetch students with pagination
      const students = await db.collection('students')
        .find(filter)
        .sort({ 'data.studentName': 1, 'data.studentFamily': 1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Transform data
      const transformedStudents: Student[] = students.map(student => {
        // Check if student has installed the app by checking pushTokens
        const pushTokens = student.data?.pushTokens || [];
        const hasActiveTokens = pushTokens.some((token: any) => token.active === true);
        
        return {
          id: student._id.toString(),
          studentName: student.data.studentName,
          studentFamily: student.data.studentFamily,
          studentCode: student.data.studentCode,
          classCode: student.data.classCode,
          schoolCode: student.data.schoolCode,
          phone: student.data.phone,
          isActive: student.data.isActive,
          hasInstalledApp: hasActiveTokens,
          addedAt: student.createdAt ? new Date(student.createdAt).toISOString() : new Date().toISOString(),
          lastUpdated: student.updatedAt ? new Date(student.updatedAt).toISOString() : new Date().toISOString(),
        };
      });

      // Get unique class codes for filter options
      const classCodes = await db.collection('students')
        .distinct('data.classCode', {
          'data.schoolCode': decoded.schoolCode,
          'data.isActive': true
        });

      await client.close();

      return NextResponse.json({
        success: true,
        data: {
          students: transformedStudents,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            classCodes: classCodes.sort()
          }
        }
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
    console.error('Students API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
