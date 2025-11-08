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

      // Count absent and delayed students (optimized aggregation)
      const [absentCount, delayedCount, coursesData, classCount] = await Promise.all([
        // Count total absent records
        db.collection('classsheet').countDocuments({
          schoolCode: decoded.schoolCode,
          date: todayStr,
          presenceStatus: 'absent'
        }),
        
        // Count total delayed records
        db.collection('classsheet').countDocuments({
          schoolCode: decoded.schoolCode,
          date: todayStr,
          presenceStatus: 'late'
        }),
        
        // Get course presence information
        db.collection('classsheet').aggregate([
          {
            $match: {
              schoolCode: decoded.schoolCode,
              date: todayStr
            }
          },
          {
            $group: {
              _id: '$courseCode',
              courseName: { $first: '$courseName' },
              hasPresence: {
                $max: {
                  $cond: [
                    {
                      $in: ['$presenceStatus', ['present', 'absent', 'late']]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ]).toArray(),
        
        // Count total classes
        db.collection('classsheet').distinct('classCode', {
          schoolCode: decoded.schoolCode,
          date: todayStr
        })
      ]);

      // Fetch course names for courses that need them
      const courseCodes = coursesData.map(c => c._id);
      const courses = await db.collection('courses').find({
        'data.schoolCode': decoded.schoolCode,
        'data.courseCode': { $in: courseCodes }
      }).toArray();

      const courseMap = new Map();
      courses.forEach(course => {
        courseMap.set(course.data.courseCode, course.data.courseName || course.data.courseCode);
      });

      // Separate courses with and without presence
      const coursesWithPresence: { courseCode: string; courseName: string }[] = [];
      const coursesWithoutPresence: { courseCode: string; courseName: string }[] = [];

      coursesData.forEach((course: any) => {
        const courseName = courseMap.get(course._id) || course.courseName || course._id;
        const payload = { courseCode: course._id, courseName };
        
        if (course.hasPresence === 1) {
          coursesWithPresence.push(payload);
        } else {
          coursesWithoutPresence.push(payload);
        }
      });

      await client.close();

      return NextResponse.json({
        success: true,
        data: {
          totalAbsent: absentCount,
          totalDelayed: delayedCount,
          totalClasses: classCount.length,
          coursesWithPresence,
          coursesWithoutPresence
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
    console.error('Summary API error:', error);
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

