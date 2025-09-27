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

interface ClassData {
  _id: string;
  data: {
    classCode: string;
    className: string;
    major: string;
    Grade: string;
    schoolCode: string;
    teachers: TeacherSchedule[];
  };
}

interface TeacherSchedule {
  teacherCode: string;
  courseCode: string;
  weeklySchedule: {
    day: string;
    timeSlot: string;
  }[];
}

interface TeacherData {
  _id: string;
  data: {
    teacherName: string;
    teacherCode: string;
    schoolCode: string;
  };
}

interface CourseData {
  _id: string;
  data: {
    courseCode: string;
    courseName: string;
    Grade: string;
    vahed: number;
    major: string;
    schoolCode: string;
  };
}

interface ScheduleResponse {
  success: boolean;
  message?: string;
  data?: {
    classes: ClassData[];
    teachers: TeacherData[];
    courses: CourseData[];
    userRole: string;
    userCode: string;
  };
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
      // Fetch courses
      const courses = await db.collection('courses').find({
        'data.schoolCode': decoded.schoolCode
      }).toArray();

      // Fetch teachers
      const teachers = await db.collection('teachers').find({
        'data.schoolCode': decoded.schoolCode
      }).toArray();

      // Fetch classes based on user role
      let classes: ClassData[] = [];

      if (decoded.role === 'school' || decoded.userType === 'school') {
        // School admin sees all classes
        classes = await db.collection('classes').find({
          'data.schoolCode': decoded.schoolCode
        }).toArray();
      } else if (decoded.role === 'teacher' || decoded.userType === 'teacher') {
        // Teacher sees only their classes
        classes = await db.collection('classes').find({
          'data.schoolCode': decoded.schoolCode,
          'data.teachers.teacherCode': decoded.username
        }).toArray();
      } else if (decoded.role === 'student' || decoded.userType === 'student') {
        // Student sees only their class
        classes = await db.collection('classes').find({
          'data.schoolCode': decoded.schoolCode,
          'data.students.studentCode': decoded.username
        }).toArray();
      }

      await client.close();

      return NextResponse.json({
        success: true,
        data: {
          classes,
          teachers,
          courses,
          userRole: decoded.role || decoded.userType,
          userCode: decoded.username
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
    console.error('Schedule API error:', error);
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


