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

interface GradeEntry {
  value: number;
  description: string;
  date: string;
  totalPoints?: number;
}

interface AssessmentEntry {
  title: string;
  value: string;
  date: string;
  weight?: number;
}

interface StudentGradeRecord {
  id: string;
  studentCode: string;
  studentName: string;
  studentFamily: string;
  classCode: string;
  className: string;
  teacherCode: string;
  teacherName: string;
  courseCode: string;
  courseName: string;
  timeSlot: string;
  date: string;
  persianDate: string;
  persianMonth: string;
  grades: GradeEntry[];
  assessments: AssessmentEntry[];
  note: string;
  descriptiveStatus?: string;
}

interface StudentGradesResponse {
  success: boolean;
  message?: string;
  data?: {
    records: StudentGradeRecord[];
    courses: { courseCode: string; courseName: string }[];
    summary: {
      totalRecords: number;
      totalGrades: number;
      totalAssessments: number;
      averageGrade: number;
      coursesWithGrades: number;
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

// Helper function: Get Persian month name
function getPersianMonthName(month: number): string {
  const persianMonths = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
  ];
  return persianMonths[month - 1];
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

    // Check if user is student
    if (decoded.role !== 'student' && decoded.userType !== 'student') {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز - فقط دانش‌آموزان می‌توانند نمرات خود را مشاهده کنند' },
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
      // Get student information first
      const student = await db.collection('students').findOne({
        'data.schoolCode': decoded.schoolCode,
        'data.studentCode': decoded.username
      });

      if (!student) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'اطلاعات دانش‌آموز یافت نشد' },
          { status: 404 }
        );
      }

      const studentCode = student.data.studentCode;

      // Find all classsheet records for this student that have grades, assessments, or notes
      const gradeRecords = await db.collection('classsheet').find({
        schoolCode: decoded.schoolCode,
        studentCode: studentCode,
        $or: [
          { grades: { $exists: true, $ne: [], $not: { $size: 0 } } },
          { assessments: { $exists: true, $ne: [], $not: { $size: 0 } } },
          { note: { $exists: true, $ne: "" } },
          { descriptiveStatus: { $exists: true, $ne: "" } }
        ]
      }).sort({ date: -1, timeSlot: 1 }).toArray();

      // Get unique class codes to fetch class information
      const classCodes = [...new Set(gradeRecords.map(record => record.classCode))];
      
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

      // Get unique teacher codes to fetch teacher information
      const teacherCodes = [...new Set(gradeRecords.map(record => record.teacherCode))];
      
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
      const courseCodes = [...new Set(gradeRecords.map(record => record.courseCode))];
      
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

      // Transform grade records
      const transformedRecords: StudentGradeRecord[] = gradeRecords.map(record => {
        const classInfo = classMap.get(record.classCode);
        const teacher = teacherMap.get(record.teacherCode);
        const course = courseMap.get(record.courseCode);

        // Convert date to Persian format
        const recordDate = new Date(record.date);
        const [jYear, jMonth, jDay] = gregorian_to_jalali(
          recordDate.getFullYear(),
          recordDate.getMonth() + 1,
          recordDate.getDate()
        );
        const persianDate = formatJalaliDate(recordDate);
        const persianMonth = getPersianMonthName(jMonth);

        return {
          id: `${record.classCode}_${record.studentCode}_${record.teacherCode}_${record.courseCode}_${record.date}_${record.timeSlot}`,
          studentCode: record.studentCode,
          studentName: student.data.studentName,
          studentFamily: student.data.studentFamily,
          classCode: record.classCode,
          className: classInfo?.className || 'نامشخص',
          teacherCode: record.teacherCode,
          teacherName: teacher?.teacherName || record.teacherCode,
          courseCode: record.courseCode,
          courseName: course?.courseName || record.courseCode,
          timeSlot: record.timeSlot,
          date: record.date,
          persianDate: record.persianDate || persianDate,
          persianMonth: record.persianMonth || persianMonth,
          grades: record.grades || [],
          assessments: record.assessments || [],
          note: record.note || '',
          descriptiveStatus: record.descriptiveStatus || ''
        };
      });

      // Calculate summary statistics
      const totalRecords = transformedRecords.length;
      const totalGrades = transformedRecords.reduce((sum, record) => sum + record.grades.length, 0);
      const totalAssessments = transformedRecords.reduce((sum, record) => sum + record.assessments.length, 0);
      
      // Calculate average grade
      let totalGradeValue = 0;
      let totalGradeCount = 0;
      transformedRecords.forEach(record => {
        record.grades.forEach(grade => {
          const totalPoints = grade.totalPoints || 20;
          const percentage = (grade.value / totalPoints) * 100;
          totalGradeValue += percentage;
          totalGradeCount++;
        });
      });
      const averageGrade = totalGradeCount > 0 ? totalGradeValue / totalGradeCount : 0;

      // Get unique courses for filtering
      const uniqueCourses = Array.from(courseMap.entries()).map(([courseCode, courseInfo]) => ({
        courseCode,
        courseName: courseInfo.courseName
      }));

      await client.close();

      return NextResponse.json({
        success: true,
        data: {
          records: transformedRecords,
          courses: uniqueCourses,
          summary: {
            totalRecords,
            totalGrades,
            totalAssessments,
            averageGrade: Math.round(averageGrade * 100) / 100,
            coursesWithGrades: uniqueCourses.length
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
    console.error('Student grades API error:', error);
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


