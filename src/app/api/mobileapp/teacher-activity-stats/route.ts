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

// Helper function: Convert Gregorian to Jalali (Persian)
function gregorian_to_jalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy = gy <= 1600 ? gy - 621 : gy - 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = days < 186 ? (days % 31) + 1 : ((days - 186) % 30) + 1;
  return [jy, jm, jd];
}

// Helper function: Convert digits to Persian
function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num)
    .split('')
    .map((digit) => persianDigits[parseInt(digit, 10)] || digit)
    .join('');
}

// Helper function: Format current date and time in Persian
function formatPersianDateTime(date: Date): string {
  const [jy, jm, jd] = gregorian_to_jalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  const persianDate = `${toPersianDigits(jd)} ${persianMonths[jm - 1]} ${toPersianDigits(jy)}`;
  const persianTime = `${toPersianDigits(hour.toString().padStart(2, '0'))}:${toPersianDigits(minute.toString().padStart(2, '0'))}`;
  
  return `${persianDate} - ${persianTime}`;
}

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
      // Get date range based on timeframe
      const { start: dateStart, end: dateEnd } = getDateRange(timeframe);
      
      // Build match filter based on user type
      const matchFilter: any = {
        schoolCode: decoded.schoolCode,
        date: {
          $gte: dateStart,
          $lt: dateEnd
        }
      };
      
      // For teachers, filter by their teacherCode
      // For school users, show all teachers' aggregated stats
      if (decoded.userType === 'teacher') {
        matchFilter.teacherCode = decoded.username;
      }
      // For school users, don't filter by teacherCode (show all teachers)
      
      // Debug logging (remove in production if needed)
      console.log('[TeacherActivityStats] Query params:', {
        userType: decoded.userType,
        username: decoded.username,
        schoolCode: decoded.schoolCode,
        timeframe,
        dateStart,
        dateEnd,
        matchFilter
      });

      // Fetch statistics for the selected timeframe
      const stats = await db.collection('classsheet').aggregate([
        {
          $match: matchFilter
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
      
      // Debug logging
      console.log('[TeacherActivityStats] Query result:', {
        statsFound: stats.length,
        statsData: stats[0] || null
      });

      // Build events match filter
      const eventsMatchFilter: any = {
        schoolCode: decoded.schoolCode,
        date: {
          $gte: dateStart,
          $lt: dateEnd
        }
      };
      
      // For teachers, filter events by their teacherCode
      // For school users, show all events
      if (decoded.userType === 'teacher') {
        eventsMatchFilter.teacherCode = decoded.username;
      } else if (decoded.userType === 'school') {
        // For school users, include both teacher-specific and school-wide events
        // Don't filter by teacherCode to get all events
      }
      
      // Fetch events for the selected timeframe
      const events = await db.collection('events').countDocuments(eventsMatchFilter);

      await client.close();

      // Process stats
      const data = stats[0] || {
        gradeCounts: 0,
        presenceRecords: 0,
        assessments: 0,
        comments: 0,
        lastActivity: null
      };
      
      // Calculate weighted total using the scoring system from config
      const { calculateWeightedScore, TEACHER_ACTIVITY_WEIGHTS } = await import('@/config/teacherActivityWeights');
      const weightedTotal = calculateWeightedScore({
        presenceRecords: data.presenceRecords || 0,
        grades: data.gradeCounts || 0,
        assessments: data.assessments || 0,
        comments: data.comments || 0,
        events: events || 0,
      });
      
      // Keep unweighted total for display purposes
      const total = data.gradeCounts + data.presenceRecords + 
                    data.assessments + data.comments + events;

      // Get current server time in Persian format
      const serverTime = formatPersianDateTime(new Date());
      
      // Debug: Log the final response data
      console.log('[TeacherActivityStats] Final response data:', {
        gradeCounts: data.gradeCounts || 0,
        presenceRecords: data.presenceRecords || 0,
        assessments: data.assessments || 0,
        comments: data.comments || 0,
        events: events || 0,
        totalActivities: total,
        weightedScore: weightedTotal,
        lastActivity: data.lastActivity || null
      });

      const responseData = {
        success: true,
        data: {
          gradeCounts: data.gradeCounts || 0,
          presenceRecords: data.presenceRecords || 0,
          assessments: data.assessments || 0,
          comments: data.comments || 0,
          events: events || 0,
          totalActivities: total, // Unweighted count for display
          weightedScore: weightedTotal, // Weighted score for ranking/comparison
          lastActivity: data.lastActivity || null,
          serverTime: serverTime
        }
      };
      
      return NextResponse.json(responseData, { headers: corsHeaders });

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

