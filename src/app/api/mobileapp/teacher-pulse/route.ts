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

// Helper function: Format date as YYYY-MM-DD without timezone conversion
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get date range based on timeframe
const getDateRange = (timeframe: string): { start: string; end: string; days: number } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatLocalDate(tomorrow);

  switch (timeframe) {
    case 'today': {
      const todayStart = formatLocalDate(now);
      return { start: todayStart, end: tomorrowStr, days: 1 };
    }
    case 'week': {
      // Get start of week (Saturday in Persian calendar)
      // JavaScript Date: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      // Persian week starts on Saturday (day 6)
      const dayOfWeek = now.getDay();
      let daysToSubtract = dayOfWeek;
      if (dayOfWeek === 0) {
        daysToSubtract = 1; // Go back to Saturday
      } else if (dayOfWeek === 6) {
        daysToSubtract = 0; // Already Saturday
      } else {
        daysToSubtract = dayOfWeek + 1; // Add 1 because we want to go back to Saturday
      }
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - daysToSubtract);
      const weekStart = formatLocalDate(startOfWeek);
      
      // Week end should be 7 days after week start (next Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      const weekEnd = formatLocalDate(endOfWeek);
      
      return { start: weekStart, end: weekEnd, days: 7 };
    }
    case 'month': {
      // Start of current month - last 30 days
      const monthStart = new Date(now);
      monthStart.setDate(monthStart.getDate() - 30);
      const monthStartStr = formatLocalDate(monthStart);
      return { start: monthStartStr, end: tomorrowStr, days: 30 };
    }
    case 'year': {
      // Last 12 months - 365 days
      const yearStart = new Date(now);
      yearStart.setDate(yearStart.getDate() - 365);
      const yearStartStr = formatLocalDate(yearStart);
      return { start: yearStartStr, end: tomorrowStr, days: 365 };
    }
    default: {
      // Default to week (7 days)
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = formatLocalDate(weekStart);
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
      const currentTeacherCode = decoded.username;

      // Get date range based on timeframe
      const { start: dateStart, end: dateEnd, days } = getDateRange(timeframe);
      
      // Debug logging
      console.log('[TeacherPulse] Query params:', {
        userType: decoded.userType,
        username: decoded.username,
        schoolCode: decoded.schoolCode,
        timeframe,
        dateStart,
        dateEnd
      });

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
      // Only fetch user activity for actual teachers
      // School users don't have personal activity records
      let currentUserDaily: any[] = [];
      let currentUserEvents: any[] = [];
      
      if (decoded.userType === 'teacher') {
        // Fetch teacher's daily activity
        currentUserDaily = await db.collection('classsheet').aggregate([
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

        // Fetch teacher's events per day
        currentUserEvents = await db.collection('events').aggregate([
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
      }

      // Fetch all teacher activities per day
      const teachersDailyActivities = await db.collection('classsheet').aggregate([
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
            _id: {
              date: '$date',
              teacherCode: '$teacherCode'
            },
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
        }
      ]).toArray();

      // Fetch events per teacher per day
      const teachersDailyEvents = await db.collection('events').aggregate([
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
            _id: {
              date: '$date',
              teacherCode: '$teacherCode'
            },
            events: { $sum: 1 }
          }
        }
      ]).toArray();

      // Get all teachers info for avatar lookup
      const teachers = await db.collection('teachers').find({
        'data.schoolCode': decoded.schoolCode,
        'data.isActive': { $ne: false }
      }).toArray();

      // Create teacher map for quick lookup
      const teacherMap: Record<string, any> = {};
      teachers.forEach((teacher: any) => {
        teacherMap[teacher.data.teacherCode] = {
          name: teacher.data.teacherName || teacher.data.teacherCode,
          avatar: teacher.data.avatar || null
        };
      });

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

      // Create maps for teacher activities and events
      const teacherActivitiesMap: Record<string, Record<string, number>> = {};
      teachersDailyActivities.forEach((item: any) => {
        const date = item._id.date;
        const teacherCode = item._id.teacherCode;
        if (!teacherActivitiesMap[date]) {
          teacherActivitiesMap[date] = {};
        }
        teacherActivitiesMap[date][teacherCode] = item.activities || 0;
      });

      const teacherEventsMap: Record<string, Record<string, number>> = {};
      teachersDailyEvents.forEach((item: any) => {
        const date = item._id.date;
        const teacherCode = item._id.teacherCode;
        if (!teacherEventsMap[date]) {
          teacherEventsMap[date] = {};
        }
        teacherEventsMap[date][teacherCode] = item.events || 0;
      });

      // Calculate top teacher per day (teacher with highest total activities + events)
      const topTeacherMap: Record<string, { teacherCode: string; total: number }> = {};
      Object.keys(teacherActivitiesMap).forEach(date => {
        const teachersForDay = teacherActivitiesMap[date];
        let topTeacher = null;
        let topTotal = -1;

        Object.keys(teachersForDay).forEach(teacherCode => {
          const activities = teachersForDay[teacherCode] || 0;
          const events = teacherEventsMap[date]?.[teacherCode] || 0;
          const total = activities + events;

          if (total > topTotal) {
            topTotal = total;
            topTeacher = teacherCode;
          }
        });

        // Also check teachers who only have events
        if (teacherEventsMap[date]) {
          Object.keys(teacherEventsMap[date]).forEach(teacherCode => {
            if (!teachersForDay[teacherCode]) {
              // Teacher only has events, no classsheet activities
              const events = teacherEventsMap[date][teacherCode] || 0;
              if (events > topTotal) {
                topTotal = events;
                topTeacher = teacherCode;
              }
            }
          });
        }

        if (topTeacher) {
          topTeacherMap[date] = { teacherCode: topTeacher, total: topTotal };
        }
      });

      // Generate all dates in range
      const dates: string[] = [];
      const startDate = new Date(dateStart);
      const endDate = new Date(dateEnd);
      
      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }

      // Build daily data with top teacher info
      const dailyData = dates.map(date => {
        const totalActivities = (activitiesMap[date] || 0) + (eventsMap[date] || 0);
        const teacherCount = teacherCountMap[date] || 1;
        const schoolAverage = Math.round((totalActivities / teacherCount) * 10) / 10; // Round to 1 decimal
        
        const userTotal = (userActivitiesMap[date] || 0) + (userEventsMap[date] || 0);

        // Get top teacher for this day
        const topTeacherInfo = topTeacherMap[date];
        const topTeacherData = topTeacherInfo ? teacherMap[topTeacherInfo.teacherCode] : null;

        return {
          date,
          schoolAverage,
          userActivity: userTotal,
          topTeacher: topTeacherData ? {
            teacherCode: topTeacherInfo.teacherCode,
            teacherName: topTeacherData.name,
            avatar: topTeacherData.avatar,
            activities: topTeacherInfo.total
          } : null
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

