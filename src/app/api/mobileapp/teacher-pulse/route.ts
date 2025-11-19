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
const getDateRange = (timeframe: string): { start: string; end: string; days: number } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  switch (timeframe) {
    case 'today': {
      const todayStart = now.toISOString().split('T')[0];
      return { start: todayStart, end: tomorrowStr, days: 1 };
    }
    case 'week': {
      // Get start of week (Saturday in Persian calendar)
      const dayOfWeek = now.getDay();
      let daysToSubtract = dayOfWeek;
      if (dayOfWeek === 0) {
        daysToSubtract = 1;
      } else if (dayOfWeek === 6) {
        daysToSubtract = 0;
      } else {
        daysToSubtract = dayOfWeek + 1;
      }
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - daysToSubtract);
      const weekStart = startOfWeek.toISOString().split('T')[0];
      return { start: weekStart, end: tomorrowStr, days: 7 };
    }
    case 'month': {
      // Start of current month - last 30 days
      const monthStart = new Date(now);
      monthStart.setDate(monthStart.getDate() - 30);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      return { start: monthStartStr, end: tomorrowStr, days: 30 };
    }
    case 'year': {
      // Last 12 months - 365 days
      const yearStart = new Date(now);
      yearStart.setDate(yearStart.getDate() - 365);
      const yearStartStr = yearStart.toISOString().split('T')[0];
      return { start: yearStartStr, end: tomorrowStr, days: 365 };
    }
    default: {
      // Default to week (7 days)
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      return { start: weekStartStr, end: tomorrowStr, days: 7 };
    }
  }
};

export async function GET(request: NextRequest) {
  try {
    // Get timeframe from query parameter (default to 'week')
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week';

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
      const currentTeacherCode = decoded.username;

      // Get date range based on timeframe
      const { start: dateStart, end: dateEnd, days } = getDateRange(timeframe);

      // Fetch all teachers' daily activity statistics
      const allTeachersDaily = await db.collection('classsheet').aggregate([
        {
          $match: {
            schoolCode: decoded.schoolCode,
            date: {
              $gte: dateStart,
              $lt: dateEnd
            }
          }
        },
        {
          $group: {
            _id: '$date',
            activities: {
              $sum: {
                $add: [
                  { $cond: [{ $isArray: '$grades' }, { $size: '$grades' }, 0] },
                  { $cond: [{ $ne: ['$presenceStatus', null] }, 1, 0] },
                  { $cond: [{ $isArray: '$assessments' }, { $size: '$assessments' }, 0] },
                  { $cond: [{ $gt: [{ $strLenCP: '$note' }, 0] }, 1, 0] }
                ]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();

      // Fetch events per day for all teachers
      const allTeachersEvents = await db.collection('events').aggregate([
        {
          $match: {
            schoolCode: decoded.schoolCode,
            date: {
              $gte: dateStart,
              $lt: dateEnd
            }
          }
        },
        {
          $group: {
            _id: '$date',
            events: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();

      // Get count of active teachers per day for average calculation
      const activeTeachersPerDay = await db.collection('classsheet').aggregate([
        {
          $match: {
            schoolCode: decoded.schoolCode,
            date: {
              $gte: dateStart,
              $lt: dateEnd
            }
          }
        },
        {
          $group: {
            _id: '$date',
            teacherCount: { $addToSet: '$teacherCode' }
          }
        },
        {
          $project: {
            _id: 1,
            teacherCount: { $size: '$teacherCount' }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();

      // Fetch current user's daily activity
      const currentUserDaily = await db.collection('classsheet').aggregate([
        {
          $match: {
            schoolCode: decoded.schoolCode,
            teacherCode: currentTeacherCode,
            date: {
              $gte: dateStart,
              $lt: dateEnd
            }
          }
        },
        {
          $group: {
            _id: '$date',
            activities: {
              $sum: {
                $add: [
                  { $cond: [{ $isArray: '$grades' }, { $size: '$grades' }, 0] },
                  { $cond: [{ $ne: ['$presenceStatus', null] }, 1, 0] },
                  { $cond: [{ $isArray: '$assessments' }, { $size: '$assessments' }, 0] },
                  { $cond: [{ $gt: [{ $strLenCP: '$note' }, 0] }, 1, 0] }
                ]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();

      // Fetch current user's events per day
      const currentUserEvents = await db.collection('events').aggregate([
        {
          $match: {
            schoolCode: decoded.schoolCode,
            teacherCode: currentTeacherCode,
            date: {
              $gte: dateStart,
              $lt: dateEnd
            }
          }
        },
        {
          $group: {
            _id: '$date',
            events: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();

      await client.close();

      // Create maps for easier lookup
      const activitiesMap: Record<string, number> = {};
      allTeachersDaily.forEach((item: any) => {
        activitiesMap[item._id] = item.activities || 0;
      });

      const eventsMap: Record<string, number> = {};
      allTeachersEvents.forEach((item: any) => {
        eventsMap[item._id] = item.events || 0;
      });

      const teacherCountMap: Record<string, number> = {};
      activeTeachersPerDay.forEach((item: any) => {
        teacherCountMap[item._id] = item.teacherCount || 1; // Default to 1 to avoid division by zero
      });

      const userActivitiesMap: Record<string, number> = {};
      currentUserDaily.forEach((item: any) => {
        userActivitiesMap[item._id] = item.activities || 0;
      });

      const userEventsMap: Record<string, number> = {};
      currentUserEvents.forEach((item: any) => {
        userEventsMap[item._id] = item.events || 0;
      });

      // Generate all dates in range
      const dates: string[] = [];
      const startDate = new Date(dateStart);
      const endDate = new Date(dateEnd);
      
      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }

      // Build daily data
      const dailyData = dates.map(date => {
        const totalActivities = (activitiesMap[date] || 0) + (eventsMap[date] || 0);
        const teacherCount = teacherCountMap[date] || 1;
        const schoolAverage = Math.round((totalActivities / teacherCount) * 10) / 10; // Round to 1 decimal
        
        const userTotal = (userActivitiesMap[date] || 0) + (userEventsMap[date] || 0);

        return {
          date,
          schoolAverage,
          userActivity: userTotal
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          dailyData,
          timeframe
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
    console.error('Teacher pulse API error:', error);
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

