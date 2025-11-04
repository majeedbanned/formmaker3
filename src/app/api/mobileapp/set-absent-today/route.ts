import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

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

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

interface JWTPayload {
  userId: string;
  domain: string;
  schoolCode: string;
  role: string;
  userType: string;
  username: string;
}

function gregorian_to_jalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy = gy <= 1600 ? gy - 621 : gy - 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
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

const persianDays = ['یکشنبه', 'دوشنبه', 'سه شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
const persianMonths = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

function getTodayPersianDay(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  return persianDays[dayOfWeek];
}

function toPersianDigits(str: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

// GET: Fetch today's courses for a student
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    if (decoded.userType !== 'teacher' && decoded.userType !== 'school') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentCode = searchParams.get('studentCode');
    if (!studentCode) {
      return NextResponse.json({ success: false, message: 'Student code is required' }, { status: 400 });
    }

    const dbConfig = getDatabaseConfig();
    const schoolConfig = dbConfig[decoded.domain];
    if (!schoolConfig) {
      return NextResponse.json({ success: false, message: 'Database configuration not found' }, { status: 500 });
    }

    const client = new MongoClient(schoolConfig.connectionString);
    await client.connect();
    const db = client.db();

    // Find student's class
    const studentClass = await db.collection('classes').findOne({
      'data.schoolCode': decoded.schoolCode,
      'data.students.studentCode': studentCode,
    });

    if (!studentClass) {
      await client.close();
      return NextResponse.json({ success: false, message: 'Student class not found' }, { status: 404 });
    }

    const todayPersianDay = getTodayPersianDay();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const [jYear, jMonth, jDay] = gregorian_to_jalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const persianDate = toPersianDigits(`${jYear}/${jMonth}/${jDay}`);
    const persianMonth = persianMonths[jMonth];

    // Filter teachers/courses for today
    const todaysCourses = studentClass.data.teachers
      .filter((teacher: any) => 
        teacher.weeklySchedule && 
        teacher.weeklySchedule.some((schedule: any) => schedule.day === todayPersianDay)
      )
      .map((teacher: any) => {
        const todaySlots = teacher.weeklySchedule.filter((s: any) => s.day === todayPersianDay);
        return todaySlots.map((slot: any) => ({
          teacherCode: teacher.teacherCode,
          courseCode: teacher.courseCode,
          timeSlot: slot.timeSlot,
        }));
      })
      .flat();

    // Fetch course names
    const courseCodes = [...new Set(todaysCourses.map((c: any) => c.courseCode))];
    const courses = await db.collection('courses').find({
      'data.schoolCode': decoded.schoolCode,
      'data.courseCode': { $in: courseCodes },
    }).toArray();

    const courseMap: Record<string, string> = {};
    courses.forEach((course: any) => {
      if (course.data?.courseCode && course.data?.courseName) {
        courseMap[course.data.courseCode] = course.data.courseName;
      }
    });

    // Fetch teacher names
    const teacherCodes = [...new Set(todaysCourses.map((c: any) => c.teacherCode))];
    const teachers = await db.collection('teachers').find({
      'data.schoolCode': decoded.schoolCode,
      'data.teacherCode': { $in: teacherCodes },
    }).toArray();

    const teacherMap: Record<string, string> = {};
    teachers.forEach((teacher: any) => {
      if (teacher.data?.teacherCode && teacher.data?.teacherName) {
        teacherMap[teacher.data.teacherCode] = teacher.data.teacherName + ' ' + (teacher.data.teacherlname || '');
      }
    });

    // Check existing records in classsheet for today
    const existingRecords = await db.collection('classsheet').find({
      studentCode: studentCode,
      schoolCode: decoded.schoolCode,
      date: todayStr,
    }).toArray();

    const existingMap: Record<string, any> = {};
    existingRecords.forEach((record: any) => {
      const key = `${record.courseCode}-${record.timeSlot}`;
      existingMap[key] = record;
    });

    // Build course list with existing status
    const courseList = todaysCourses.map((course: any) => {
      const key = `${course.courseCode}-${course.timeSlot}`;
      const existing = existingMap[key];
      return {
        courseCode: course.courseCode,
        courseName: courseMap[course.courseCode] || course.courseCode,
        teacherCode: course.teacherCode,
        teacherName: teacherMap[course.teacherCode] || '',
        timeSlot: course.timeSlot,
        alreadyMarked: !!existing,
        currentStatus: existing?.presenceStatus || null,
      };
    });

    await client.close();

    return NextResponse.json({
      success: true,
      data: {
        classCode: studentClass.data.classCode,
        className: studentClass.data.className,
        date: todayStr,
        persianDate,
        persianMonth,
        dayOfWeek: todayPersianDay,
        courses: courseList,
      },
    });

  } catch (error: any) {
    console.error('Error fetching today\'s courses:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Mark student absent for selected courses
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    if (decoded.userType !== 'teacher' && decoded.userType !== 'school') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { studentCode, classCode, date, persianDate, persianMonth, coursesData, absenceAcceptable, absenceDescription } = body;

    if (!studentCode || !classCode || !date || !coursesData || !Array.isArray(coursesData)) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const dbConfig = getDatabaseConfig();
    const schoolConfig = dbConfig[decoded.domain];
    if (!schoolConfig) {
      return NextResponse.json({ success: false, message: 'Database configuration not found' }, { status: 500 });
    }

    const client = new MongoClient(schoolConfig.connectionString);
    await client.connect();
    const db = client.db();

    let createdCount = 0;
    let updatedCount = 0;

    for (const courseData of coursesData) {
      const { courseCode, teacherCode, timeSlot, presenceStatus } = courseData;
      
      // Check if record exists
      const existing = await db.collection('classsheet').findOne({
        studentCode: studentCode,
        schoolCode: decoded.schoolCode,
        classCode: classCode,
        courseCode: courseCode,
        teacherCode: teacherCode,
        timeSlot: timeSlot,
        date: date,
      });

      // Determine if we should set absence-related fields
      const isAbsence = presenceStatus === 'absent' || presenceStatus === 'late';
      const isPresent = presenceStatus === 'present';

      if (existing) {
        // Update existing record
        const updateFields: any = {
          presenceStatus: presenceStatus,
          updatedAt: new Date(),
        };

        // For present status, always set absenceAcceptable to true
        if (isPresent) {
          updateFields.absenceAcceptable = true;
          updateFields.absenceDescription = '';
        }
        // For absence/late, use the provided values
        else if (isAbsence) {
          updateFields.absenceAcceptable = absenceAcceptable;
          updateFields.absenceDescription = absenceDescription || '';
        }

        await db.collection('classsheet').updateOne(
          { _id: existing._id },
          { $set: updateFields }
        );
        updatedCount++;
      } else {
        // Create new record
        const newRecord: any = {
          classCode: classCode,
          courseCode: courseCode,
          date: date,
          schoolCode: decoded.schoolCode,
          studentCode: studentCode,
          teacherCode: teacherCode,
          timeSlot: timeSlot,
          assessments: [],
          descriptiveStatus: '',
          grades: [],
          note: '',
          persianDate: persianDate,
          persianMonth: persianMonth,
          presenceStatus: presenceStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // For present status, always set absenceAcceptable to true
        if (isPresent) {
          newRecord.absenceAcceptable = true;
          newRecord.absenceDescription = '';
        }
        // For absence/late, use the provided values
        else if (isAbsence) {
          newRecord.absenceAcceptable = absenceAcceptable;
          newRecord.absenceDescription = absenceDescription || '';
        }

        await db.collection('classsheet').insertOne(newRecord);
        createdCount++;
      }
    }

    await client.close();

    return NextResponse.json({
      success: true,
      message: `وضعیت حضور با موفقیت ثبت شد (${createdCount} جدید، ${updatedCount} به‌روزرسانی)`,
      data: { createdCount, updatedCount },
    });

  } catch (error: any) {
    console.error('Error marking student absent:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
