import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Helper function: Convert Gregorian to Jalali
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
  const jm =
    days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = days < 186 ? (days % 31) + 1 : ((days - 186) % 30) + 1;
  return [jy, jm, jd];
}

// Helper function: Convert numbers to Persian digits
function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num)
    .split('')
    .map((digit) => persianDigits[parseInt(digit, 10)] || digit)
    .join('');
}

// Helper function: Convert a Date object to a formatted Jalali date string
function formatJalaliDate(date: Date): string {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const [jy, jm, jd] = gregorian_to_jalali(gy, gm, gd);
  const jYear = toPersianDigits(jy);
  const jMonth = toPersianDigits(jm.toString().padStart(2, '0'));
  const jDay = toPersianDigits(jd.toString().padStart(2, '0'));
  return `${jYear}/${jMonth}/${jDay}`;
}

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

// Get Persian day name for a date
function getPersianDayNameForDate(date: Date): string {
  const days = ['یکشنبه', 'دوشنبه', 'سه شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  const jsDay = date.getDay();
  const dayIndex = jsDay === 6 ? 6 : jsDay;
  return days[dayIndex];
}

export async function GET(request: NextRequest) {
  try {
    console.log("Available dates request received");
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند برنامه کلاسی را مشاهده کنند' },
        { status: 403 }
      );
    }

    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      // Find all classes where this teacher teaches
      const classes = await db.collection('classes').find({
        'data.schoolCode': decoded.schoolCode,
        'data.teachers.teacherCode': decoded.username
      }).toArray();

      // Collect all unique days this teacher has classes
      const teacherDays = new Set<string>();

      classes.forEach((classDoc: any) => {
        const teacherCourses = classDoc.data.teachers.filter(
          (t: any) => t.teacherCode === decoded.username
        );

        teacherCourses.forEach((teacherCourse: any) => {
          teacherCourse.weeklySchedule.forEach((slot: any) => {
            teacherDays.add(slot.day);
          });
        });
      });

      console.log("Teacher teaches on days:", Array.from(teacherDays));

      // Generate dates for the next 5 months (150 days), but only include days where teacher has classes
      const availableDates: any[] = [];
      
      for (let i = 0; i < 150; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const persianDay = getPersianDayNameForDate(date);
        
        // Only include if teacher has classes on this day
        if (teacherDays.has(persianDay)) {
          const gregorianDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const persianDate = formatJalaliDate(date);
          
          availableDates.push({
            date: gregorianDate,
            persianDate: persianDate,
            persianDay: persianDay,
            isToday: i === 0
          });
        }
      }

      await client.close();

      console.log("Available dates count:", availableDates.length);

      return NextResponse.json({
        success: true,
        dates: availableDates,
        teacherDays: Array.from(teacherDays)
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      await client.close();
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error fetching available dates:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تاریخ‌های موجود' },
      { status: 500 }
    );
  }
}

