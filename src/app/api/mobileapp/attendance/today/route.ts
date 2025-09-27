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

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  studentFamily: string;
  studentCode: string;
  classCode: string;
  className: string;
  teacherCode: string;
  teacherName: string;
  courseCode: string;
  courseName: string;
  timeSlot: string;
  presenceStatus: 'absent' | 'late';
  note?: string;
  date: string;
  persianDate: string;
}

interface AttendanceResponse {
  success: boolean;
  message?: string;
  data?: {
    absentStudents: AttendanceRecord[];
    delayedStudents: AttendanceRecord[];
    summary: {
      totalAbsent: number;
      totalDelayed: number;
      totalClasses: number;
    };
  };
}

// Helper function: Convert Gregorian to Jalali
function gregorian_to_jalali(gy: number, gm: number, gd: number) {
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
function toPersianDigits(num: number | string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num)
    .split("")
    .map((digit) => persianDigits[parseInt(digit, 10)])
    .join("");
}

// Helper function: Format Jalali date
function formatJalaliDate(date: Date) {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const [jy, jm, jd] = gregorian_to_jalali(gy, gm, gd);
  const jYear = toPersianDigits(jy);
  const jMonth = toPersianDigits(jm.toString().padStart(2, "0"));
  const jDay = toPersianDigits(jd.toString().padStart(2, "0"));
  return `${jYear}/${jMonth}/${jDay}`;
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

      // Find all attendance records for today with absent or late status
      const attendanceRecords = await db.collection('classsheet').find({
        schoolCode: decoded.schoolCode,
        date: todayStr,
        presenceStatus: { $in: ['absent', 'late'] }
      }).toArray();

      // Get unique class codes to fetch class information
      const classCodes = [...new Set(attendanceRecords.map(record => record.classCode))];
      
      // Fetch class information
      const classes = await db.collection('classes').find({
        'data.schoolCode': decoded.schoolCode,
        'data.classCode.value': { $in: classCodes }
      }).toArray();

      // Create class lookup map
      const classMap = new Map();
      classes.forEach(cls => {
        const classCode = cls.data.classCode.value;
        classMap.set(classCode, {
          className: cls.data.className,
          classCode: classCode
        });
      });

      // Get unique student codes to fetch student information
      const studentCodes = [...new Set(attendanceRecords.map(record => record.studentCode))];
      
      // Fetch student information
      const students = await db.collection('students').find({
        'data.schoolCode': decoded.schoolCode,
        'data.studentCode': { $in: studentCodes }
      }).toArray();

      // Create student lookup map
      const studentMap = new Map();
      students.forEach(student => {
        const studentCode = student.data.studentCode;
        studentMap.set(studentCode, {
          studentId: student._id.toString(),
          studentName: student.data.studentName,
          studentFamily: student.data.studentFamily,
          studentCode: studentCode
        });
      });

      // Get unique teacher codes to fetch teacher information
      const teacherCodes = [...new Set(attendanceRecords.map(record => record.teacherCode))];
      
      // Fetch teacher information
      const teachers = await db.collection('teachers').find({
        'data.schoolCode': decoded.schoolCode,
        'data.teacherCode': { $in: teacherCodes }
      }).toArray();

      // Create teacher lookup map
      const teacherMap = new Map();
      teachers.forEach(teacher => {
        const teacherCode = teacher.data.teacherCode;
        teacherMap.set(teacherCode, {
          teacherName: teacher.data.teacherName || teacherCode
        });
      });

      // Get unique course codes to fetch course information
      const courseCodes = [...new Set(attendanceRecords.map(record => record.courseCode))];
      
      // Fetch course information
      const courses = await db.collection('courses').find({
        'data.schoolCode': decoded.schoolCode,
        'data.courseCode': { $in: courseCodes }
      }).toArray();

      // Create course lookup map
      const courseMap = new Map();
      courses.forEach(course => {
        const courseCode = course.data.courseCode;
        courseMap.set(courseCode, {
          courseName: course.data.courseName || courseCode
        });
      });

      // Transform attendance records
      const transformedRecords: AttendanceRecord[] = attendanceRecords.map(record => {
        const student = studentMap.get(record.studentCode);
        const classInfo = classMap.get(record.classCode);
        const teacher = teacherMap.get(record.teacherCode);
        const course = courseMap.get(record.courseCode);

        return {
          studentId: student?.studentId || '',
          studentName: student?.studentName || 'نامشخص',
          studentFamily: student?.studentFamily || 'نامشخص',
          studentCode: record.studentCode,
          classCode: record.classCode,
          className: classInfo?.className || 'نامشخص',
          teacherCode: record.teacherCode,
          teacherName: teacher?.teacherName || record.teacherCode,
          courseCode: record.courseCode,
          courseName: course?.courseName || record.courseCode,
          timeSlot: record.timeSlot,
          presenceStatus: record.presenceStatus as 'absent' | 'late',
          note: record.note || '',
          date: record.date,
          persianDate: record.persianDate || formatJalaliDate(today)
        };
      });

      // Separate absent and delayed students
      const absentStudents = transformedRecords.filter(record => record.presenceStatus === 'absent');
      const delayedStudents = transformedRecords.filter(record => record.presenceStatus === 'late');

      // Get total number of classes for today (for context)
      const totalClassesToday = await db.collection('classsheet').distinct('classCode', {
        schoolCode: decoded.schoolCode,
        date: todayStr
      });

      await client.close();

      return NextResponse.json({
        success: true,
        data: {
          absentStudents,
          delayedStudents,
          summary: {
            totalAbsent: absentStudents.length,
            totalDelayed: delayedStudents.length,
            totalClasses: totalClassesToday.length
          }
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
    console.error('Attendance API error:', error);
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
