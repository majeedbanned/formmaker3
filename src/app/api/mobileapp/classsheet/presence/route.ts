import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

// Initialize dayjs for Jalali dates
dayjs.extend(jalaliday);

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

// Helper function: Get Persian month name
function getPersianMonthName(month: number): string {
  const persianMonths = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];
  return persianMonths[month - 1];
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

export async function POST(request: NextRequest) {
  try {
    console.log("Mobile classsheet presence update request received");
    
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

    console.log("Mobile presence update request for user:", decoded.userType, decoded.username);

    // Check if user is teacher
    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند حضور و غیاب را ثبت کنند' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { classCode, studentCode, courseCode, timeSlot, presenceStatus, date: requestedDate } = body;

    // Validate required fields
    if (!classCode || !studentCode || !courseCode || !timeSlot || !presenceStatus) {
      return NextResponse.json(
        { success: false, message: 'تمام فیلدهای الزامی را پر کنید' },
        { status: 400 }
      );
    }

    // Validate presence status
    if (!['present', 'absent', 'delayed'].includes(presenceStatus)) {
      return NextResponse.json(
        { success: false, message: 'وضعیت حضور نامعتبر است' },
        { status: 400 }
      );
    }

    // Use requested date or calculate today's date
    let date: string;
    let workingDate: Date;
    const now = new Date(); // For timestamps
    
    if (requestedDate) {
      date = requestedDate;
      const [year, month, day] = requestedDate.split('-').map(Number);
      workingDate = new Date(year, month - 1, day);
      console.log("Using requested date for presence:", date);
    } else {
      workingDate = new Date();
      date = dayjs(workingDate).format('YYYY-MM-DD');
      console.log("Using today's date for presence:", date);
    }
    
    // Get Persian date with Persian digits
    const [jYear, jMonth, jDay] = gregorian_to_jalali(
      workingDate.getFullYear(),
      workingDate.getMonth() + 1,
      workingDate.getDate()
    );
    const persianDate = formatJalaliDate(workingDate); // Persian date with Persian digits
    const persianMonthName = getPersianMonthName(jMonth); // Persian month name

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
    
    console.log("Connected to database:", dbName);

    try {
      // Verify teacher teaches this class
      const classDoc = await db.collection('classes').findOne({
        'data.classCode': classCode,
        'data.schoolCode': decoded.schoolCode
      });

      if (!classDoc) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'کلاس یافت نشد' },
          { status: 404 }
        );
      }

      const teacherTeachesClass = classDoc.data.teachers.some(
        (t: any) => t.teacherCode === decoded.username && t.courseCode === courseCode
      );

      if (!teacherTeachesClass) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'شما معلم این درس در این کلاس نیستید' },
          { status: 403 }
        );
      }

      // Check if record exists  edfef
      const existingRecord = await db.collection('classsheet').findOne({
        classCode: classCode,
        studentCode: studentCode,
        teacherCode: decoded.username,
        courseCode: courseCode,
        schoolCode: decoded.schoolCode,
        date: date,
        timeSlot: timeSlot
      });

      if (existingRecord) {
        // Update existing record
        await db.collection('classsheet').updateOne(
          {
            _id: existingRecord._id
          },
          {
            $set: {
              presenceStatus: presenceStatus,
              updatedAt: now,
              persianDate: persianDate,
              persianMonth: persianMonthName
            }
          }
        );
        
        console.log("Updated presence status for existing record");
      } else {
        // Create new record
        await db.collection('classsheet').insertOne({
          classCode: classCode,
          studentCode: studentCode,
          teacherCode: decoded.username,
          courseCode: courseCode,
          schoolCode: decoded.schoolCode,
          date: date,
          timeSlot: timeSlot,
          presenceStatus: presenceStatus,
          note: '',
          grades: [],
          assessments: [],
          descriptiveStatus: '',
          persianDate: persianDate,
          persianMonth: persianMonthName,
          createdAt: now,
          updatedAt: now
        });
        
        console.log("Created new presence record");
      }

      await client.close();

      return NextResponse.json({
        success: true,
        message: 'وضعیت حضور با موفقیت ثبت شد',
        presenceStatus: presenceStatus
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
    console.error('Error updating presence status:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت حضور و غیاب' },
      { status: 500 }
    );
  }
}

