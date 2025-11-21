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

// Helper function to get date range based on timeframe
const getDateRange = (timeframe: string): { start: string; end: string } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  switch (timeframe) {
    case 'today': {
      const todayStart = now.toISOString().split('T')[0];
      return { start: todayStart, end: tomorrowStr };
    }
    case 'week': {
      // Get start of week (Saturday in Persian calendar)
      // JavaScript Date: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      // Persian week starts on Saturday (day 6)
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      let daysToSubtract = dayOfWeek;
      // If Sunday (0), subtract 1 day to get Saturday
      // If Monday (1), subtract 2 days to get Saturday, etc.
      if (dayOfWeek === 0) {
        daysToSubtract = 1; // Go back to Saturday
      } else if (dayOfWeek === 6) {
        daysToSubtract = 0; // Already Saturday
      } else {
        daysToSubtract = dayOfWeek + 1; // Add 1 because we want to go back to Saturday
      }
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - daysToSubtract);
      const weekStart = startOfWeek.toISOString().split('T')[0];
      return { start: weekStart, end: tomorrowStr };
    }
    case 'month': {
      // Start of current month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      return { start: monthStartStr, end: tomorrowStr };
    }
    case 'year': {
      // Start of current year
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearStartStr = yearStart.toISOString().split('T')[0];
      return { start: yearStartStr, end: tomorrowStr };
    }
    default:
      // Default to today
      const todayStart = now.toISOString().split('T')[0];
      return { start: todayStart, end: tomorrowStr };
  }
};

export async function GET(request: NextRequest) {
  try {
    // Get timeframe from query parameter (default to 'today')
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'today';

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

    // Only allow teachers and school users
    if (decoded.userType !== 'teacher' && decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
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

      // Get date range based on timeframe
      const { start: dateStart, end: dateEnd } = getDateRange(timeframe);

      // Fetch statistics for the selected timeframe
      const stats = await db.collection('classsheet').aggregate([
        {
          $match: {
            schoolCode: decoded.schoolCode,
            teacherCode: teacherCode,
            date: {
              $gte: dateStart,
              $lt: dateEnd
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

      // Fetch events for the selected timeframe
      const events = await db.collection('events').countDocuments({
        schoolCode: decoded.schoolCode,
        teacherCode: teacherCode,
        date: {
          $gte: dateStart,
          $lt: dateEnd
        }
      });

      await client.close();

      // Process stats
      const data = stats[0] || {
        gradeCounts: 0,
        presenceRecords: 0,
        assessments: 0,
        comments: 0,
        lastActivity: null
      };
      const total = data.gradeCounts + data.presenceRecords + 
                    data.assessments + data.comments + events;

      return NextResponse.json({
        success: true,
        data: {
          gradeCounts: data.gradeCounts || 0,
          presenceRecords: data.presenceRecords || 0,
          assessments: data.assessments || 0,
          comments: data.comments || 0,
          events: events || 0,
          totalActivities: total,
          lastActivity: data.lastActivity || null
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

