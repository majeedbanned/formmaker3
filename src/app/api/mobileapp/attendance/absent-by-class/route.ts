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

interface ClassAbsenceGroup {
  classCode: string;
  className: string;
  students: {
    studentId: string;
    studentName: string;
    studentFamily: string;
    studentCode: string;
  }[];
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
        { success: false, message: 'دسترسی غیرمجاز - فقط مدیران مدرسه می‌توانند گزارش حضور و غیاب را مشاهده کنند' },
        { status: 403 }
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
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Use aggregation to get absent students grouped by class
      // This is more performant than fetching all and grouping in JS
      const absentByClassAggregation = await db.collection('classsheet').aggregate([
        {
          $match: {
            schoolCode: decoded.schoolCode,
            date: todayStr,
            presenceStatus: 'absent'
          }
        },
        {
          $group: {
            _id: {
              classCode: '$classCode',
              studentCode: '$studentCode'
            },
            classCode: { $first: '$classCode' },
            studentCode: { $first: '$studentCode' }
          }
        },
        {
          $group: {
            _id: '$classCode',
            studentCodes: { $push: '$studentCode' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).toArray();

      // Get unique codes for batch fetching
      const classCodes = absentByClassAggregation.map(group => group._id);
      const allStudentCodes = absentByClassAggregation.flatMap(group => group.studentCodes);

      // Fetch class and student information in parallel
      const [classes, students] = await Promise.all([
        db.collection('classes').find({
          'data.schoolCode': decoded.schoolCode,
          'data.classCode.value': { $in: classCodes }
        }).toArray(),
        
        db.collection('students').find({
          'data.schoolCode': decoded.schoolCode,
          'data.studentCode': { $in: allStudentCodes }
        }).toArray()
      ]);

      // Create lookup maps with better error handling
      const classMap = new Map();
      classes.forEach(c => {
        if (c.data && c.data.classCode) {
          const classCode = typeof c.data.classCode === 'object' ? c.data.classCode.value : c.data.classCode;
          const className = c.data.className || c.data.classCode?.label || classCode;
          classMap.set(classCode, className);
        }
      });

      const studentMap = new Map();
      students.forEach(s => {
        if (s.data && s.data.studentCode) {
          studentMap.set(s.data.studentCode, {
            studentId: s._id.toString(),
            studentName: s.data.studentName || 'نامشخص',
            studentFamily: s.data.studentFamily || '',
            studentCode: s.data.studentCode
          });
        }
      });

      // Transform the data
      const absentByClass: ClassAbsenceGroup[] = absentByClassAggregation.map(group => {
        const className = classMap.get(group._id) || group._id;
        
        const students = group.studentCodes
          .map((code: string) => studentMap.get(code))
          .filter((student: any) => student !== undefined)
          .map((student: any) => ({
            studentId: student.studentId || '',
            studentName: student.studentName || 'نامشخص',
            studentFamily: student.studentFamily || '',
            studentCode: student.studentCode || ''
          }));

        return {
          classCode: group._id || '',
          className: className || 'نامشخص',
          students
        };
      }).filter(group => group.students.length > 0); // Only include groups with valid students

      await client.close();

      return NextResponse.json({
        success: true,
        data: absentByClass
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
    console.error('Absent by class API error:', error);
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

