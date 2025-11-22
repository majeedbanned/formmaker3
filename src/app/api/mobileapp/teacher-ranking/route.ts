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

interface TeacherDocument {
  _id: string;
  data: {
    teacherName: string;
    teacherCode: string;
    schoolCode: string;
    isActive?: boolean;
    avatar?: {
      path: string;
      filename?: string;
      originalName?: string;
    };
    [key: string]: unknown;
  };
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
const getDateRange = (timeframe: string): { start: string; end: string } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatLocalDate(tomorrow);

  switch (timeframe) {
    case 'today': {
      const todayStart = formatLocalDate(now);
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
      const weekStart = formatLocalDate(startOfWeek);
      
      // Week end should be 7 days after week start (next Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      const weekEnd = formatLocalDate(endOfWeek);
      
      return { start: weekStart, end: weekEnd };
    }
    case 'month': {
      // Start of current month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = formatLocalDate(monthStart);
      return { start: monthStartStr, end: tomorrowStr };
    }
    case 'year': {
      // Start of current year
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearStartStr = formatLocalDate(yearStart);
      return { start: yearStartStr, end: tomorrowStr };
    }
    default:
      // Default to today
      const todayStart = formatLocalDate(now);
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
      const currentTeacherCode = decoded.username;

      // Get date range based on timeframe
      const { start: dateStart, end: dateEnd } = getDateRange(timeframe);
      
      // Debug logging
      console.log('[TeacherRanking] Query params:', {
        userType: decoded.userType,
        username: decoded.username,
        schoolCode: decoded.schoolCode,
        timeframe,
        dateStart,
        dateEnd
      });

      // Fetch all teachers' activity statistics
      const teacherActivities = await db.collection('classsheet').aggregate([
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
            _id: '$teacherCode',
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

      // Fetch events count for each teacher
      const teacherEvents = await db.collection('events').aggregate([
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
            _id: '$teacherCode',
            events: { $sum: 1 }
          }
        }
      ]).toArray();

      // Create events map
      const eventsMap: Record<string, number> = {};
      teacherEvents.forEach((item: any) => {
        eventsMap[item._id] = item.events || 0;
      });

      // Get all teachers with their info
      const teachers = await db.collection('teachers').find({
        'data.schoolCode': decoded.schoolCode,
        'data.isActive': { $ne: false }
      }).toArray() as TeacherDocument[];

      // Create teacher map
      const teacherMap: Record<string, TeacherDocument> = {};
      teachers.forEach(teacher => {
        teacherMap[teacher.data.teacherCode] = teacher;
      });

      // Calculate weighted total activities and create ranking data
      // Weighting: presenceRecords: 0.5 points, grades: 1 point, assessments: 2 points, events: 4 points
      const rankingData = teacherActivities.map((activity: any) => {
        const teacherCode = activity._id;
        const events = eventsMap[teacherCode] || 0;
        
        // Calculate weighted score
        const weightedScore = 
          (activity.presenceRecords || 0) * 0.5 +
          (activity.gradeCounts || 0) * 1.0 +
          (activity.assessments || 0) * 2.0 +
          events * 4.0;
        
        // Keep unweighted total for display purposes
        const totalActivities = 
          (activity.gradeCounts || 0) + 
          (activity.presenceRecords || 0) + 
          (activity.assessments || 0) + 
          (activity.comments || 0) + 
          events;

        const teacher = teacherMap[teacherCode];

        return {
          teacherCode,
          teacherName: teacher?.data?.teacherName || teacherCode,
          avatar: teacher?.data?.avatar || null,
          totalActivities, // Unweighted count for display
          weightedScore, // Weighted score for ranking
          gradeCounts: activity.gradeCounts || 0,
          presenceRecords: activity.presenceRecords || 0,
          assessments: activity.assessments || 0,
          comments: activity.comments || 0,
          events
        };
      });

      // Include teachers with no activities (score 0)
      teachers.forEach(teacher => {
        const teacherCode = teacher.data.teacherCode;
        const hasActivity = rankingData.some((r: any) => r.teacherCode === teacherCode);
        if (!hasActivity) {
          rankingData.push({
            teacherCode,
            teacherName: teacher.data.teacherName || teacherCode,
            avatar: teacher.data.avatar || null,
            totalActivities: 0,
            weightedScore: 0,
            gradeCounts: 0,
            presenceRecords: 0,
            assessments: 0,
            comments: 0,
            events: 0
          });
        }
      });

      // Sort by weightedScore descending (use weighted score for ranking)
      rankingData.sort((a: any, b: any) => (b.weightedScore || 0) - (a.weightedScore || 0));

      // Add rank to each teacher
      const rankedTeachers = rankingData.map((teacher: any, index: number) => ({
        ...teacher,
        rank: index + 1
      }));

      // Find current user's rank (only for actual teachers, not school users)
      let currentUserRank = 0;
      let currentUser = null;
      
      if (decoded.userType === 'teacher') {
        // For teachers, find their rank in the ranking
        const userIndex = rankedTeachers.findIndex(
          (t: any) => t.teacherCode === currentTeacherCode
        );
        if (userIndex >= 0) {
          currentUserRank = userIndex + 1;
          currentUser = rankedTeachers[userIndex];
        }
      }
      // For school users, there's no "current user" in the ranking (they're not teachers)
      // So currentUserRank remains 0 and currentUser remains null

      await client.close();
      
      // Debug logging
      console.log('[TeacherRanking] Query result:', {
        totalTeachers: rankedTeachers.length,
        currentUserRank,
        hasCurrentUser: !!currentUser
      });

      return NextResponse.json({
        success: true,
        data: {
          teachers: rankedTeachers,
          currentUserRank,
          currentUser: currentUser || null
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
    console.error('Teacher ranking API error:', error);
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

