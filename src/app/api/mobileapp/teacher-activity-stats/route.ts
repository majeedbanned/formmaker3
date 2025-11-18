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

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401, headers: corsHeaders }
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
        { status: 401, headers: corsHeaders }
      );
    }

    // Only allow teachers
    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند این اطلاعات را مشاهده کنند' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify school code matches
    if (domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      const teacherCode = decoded.username;

      // Get today's date range (start and end of today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayEndStr = tomorrow.toISOString().split('T')[0]; // Use tomorrow for $lt comparison

      // Get overall date range (from beginning of school year to today)
      // School year starts from month 7 (Mehr) of previous year
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // 1-12
      
      let schoolYearStart: Date;
      if (currentMonth >= 7) {
        // Current year is the school year (Mehr to Shahrivar)
        schoolYearStart = new Date(currentYear, 6, 1); // July 1st
      } else {
        // Previous year is the school year start
        schoolYearStart = new Date(currentYear - 1, 6, 1); // July 1st of previous year
      }
      const overallStart = schoolYearStart.toISOString().split('T')[0];
      const overallEnd = tomorrow.toISOString().split('T')[0]; // Use tomorrow for $lt comparison

      // Fetch today's statistics
      const todayStats = await db.collection('classsheet').aggregate([
        {
          $match: {
            schoolCode: decoded.schoolCode,
            teacherCode: teacherCode,
            date: {
              $gte: todayStart,
              $lt: todayEndStr
            }
          }
        },
        {
          $group: {
            _id: null,
            gradeCounts: {
              $sum: {
                $cond: [{ $isArray: '$grades' }, { $size: '$grades' }, 0]
              }
            },
            presenceRecords: {
              $sum: {
                $cond: [{ $ne: ['$presenceStatus', null] }, 1, 0]
              }
            },
            assessments: {
              $sum: {
                $cond: [{ $isArray: '$assessments' }, { $size: '$assessments' }, 0]
              }
            },
            comments: {
              $sum: {
                $cond: [{ $gt: [{ $strLenCP: '$note' }, 0] }, 1, 0]
              }
            }
          }
        }
      ]).toArray();

      // Fetch today's events
      const todayEvents = await db.collection('events').countDocuments({
        schoolCode: decoded.schoolCode,
        teacherCode: teacherCode,
        date: {
          $gte: todayStart,
          $lt: todayEndStr
        }
      });

      // Fetch overall statistics
      const overallStats = await db.collection('classsheet').aggregate([
        {
          $match: {
            schoolCode: decoded.schoolCode,
            teacherCode: teacherCode,
            date: {
              $gte: overallStart,
              $lt: overallEnd
            }
          }
        },
        {
          $group: {
            _id: null,
            gradeCounts: {
              $sum: {
                $cond: [{ $isArray: '$grades' }, { $size: '$grades' }, 0]
              }
            },
            presenceRecords: {
              $sum: {
                $cond: [{ $ne: ['$presenceStatus', null] }, 1, 0]
              }
            },
            assessments: {
              $sum: {
                $cond: [{ $isArray: '$assessments' }, { $size: '$assessments' }, 0]
              }
            },
            comments: {
              $sum: {
                $cond: [{ $gt: [{ $strLenCP: '$note' }, 0] }, 1, 0]
              }
            },
            lastActivity: { $max: '$date' }
          }
        }
      ]).toArray();

      // Fetch overall events
      const overallEvents = await db.collection('events').countDocuments({
        schoolCode: decoded.schoolCode,
        teacherCode: teacherCode,
        date: {
          $gte: overallStart,
          $lt: overallEnd
        }
      });

      await client.close();

      // Process today's stats
      const todayData = todayStats[0] || {
        gradeCounts: 0,
        presenceRecords: 0,
        assessments: 0,
        comments: 0
      };
      const todayTotal = todayData.gradeCounts + todayData.presenceRecords + 
                        todayData.assessments + todayData.comments + todayEvents;

      // Process overall stats
      const overallData = overallStats[0] || {
        gradeCounts: 0,
        presenceRecords: 0,
        assessments: 0,
        comments: 0,
        lastActivity: null
      };
      const overallTotal = overallData.gradeCounts + overallData.presenceRecords + 
                          overallData.assessments + overallData.comments + overallEvents;

      return NextResponse.json({
        success: true,
        data: {
          today: {
            gradeCounts: todayData.gradeCounts || 0,
            presenceRecords: todayData.presenceRecords || 0,
            assessments: todayData.assessments || 0,
            comments: todayData.comments || 0,
            events: todayEvents || 0,
            totalActivities: todayTotal
          },
          overall: {
            gradeCounts: overallData.gradeCounts || 0,
            presenceRecords: overallData.presenceRecords || 0,
            assessments: overallData.assessments || 0,
            comments: overallData.comments || 0,
            events: overallEvents || 0,
            totalActivities: overallTotal,
            lastActivity: overallData.lastActivity || null
          }
        }
      }, { headers: corsHeaders });

    } catch (dbError) {
      await client.close();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Teacher activity stats API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

