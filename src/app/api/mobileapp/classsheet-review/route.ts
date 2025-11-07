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

function toPersianDigits(str: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

function formatPersianDate(year: number, month: number, day: number): string {
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return toPersianDigits(`${y}/${m}/${d}`);
}

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

    // Fetch all classsheet records for this student
    const records = await db.collection('classsheet').find({
      studentCode: studentCode,
      schoolCode: decoded.schoolCode,
    }).sort({ date: -1 }).toArray();

    // Get unique course codes
    const courseCodes = [...new Set(records.map((r: any) => r.courseCode))];
    
    // Fetch course names
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
    const teacherCodes = [...new Set(records.map((r: any) => r.teacherCode))];
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

    // Calculate overall statistics
    let totalGrades = 0;
    let totalGradesCount = 0;
    let totalAssessments = 0;
    let totalNotes = 0;
    let totalDescriptiveStatus = 0;

    // Group by course
    const byCourse: Record<string, any> = {};
    
    // Timeline records
    const timeline: any[] = [];

    records.forEach((record: any) => {
      const courseCode = record.courseCode || 'unknown';
      const courseName = courseMap[courseCode] || courseCode;
      const teacherName = teacherMap[record.teacherCode] || '';

      // Initialize course if not exists
      if (!byCourse[courseCode]) {
        byCourse[courseCode] = {
          courseCode,
          courseName,
          teacherName,
          totalGrades: 0,
          totalGradesCount: 0,
          totalAssessments: 0,
          totalNotes: 0,
          totalDescriptiveStatus: 0,
          records: [],
        };
      }

      // Format date
      let persianDate = record.persianDate || '';
      if (!persianDate && record.date) {
        try {
          const date = new Date(record.date);
          const [jYear, jMonth, jDay] = gregorian_to_jalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
          persianDate = formatPersianDate(jYear, jMonth, jDay);
        } catch (e) {
          persianDate = record.date;
        }
      }

      // Process grades
      const grades = (record.grades || []).map((g: any) => ({
        value: g.value,
        description: g.description || '',
        date: g.date,
        totalPoints: g.totalPoints || 20,
      }));

      if (grades.length > 0) {
        const avgGrade = grades.reduce((sum: number, g: any) => sum + (g.value || 0), 0) / grades.length;
        totalGrades += avgGrade;
        totalGradesCount++;
        byCourse[courseCode].totalGrades += avgGrade;
        byCourse[courseCode].totalGradesCount++;
      }

      // Process assessments
      const assessments = (record.assessments || []).map((a: any) => ({
        title: a.title || '',
        value: a.value || '',
        date: a.date,
        weight: a.weight || 0,
      }));

      if (assessments.length > 0) {
        totalAssessments += assessments.length;
        byCourse[courseCode].totalAssessments += assessments.length;
      }

      // Process notes
      if (record.note && record.note.trim()) {
        totalNotes++;
        byCourse[courseCode].totalNotes++;
      }

      // Process descriptive status
      if (record.descriptiveStatus && record.descriptiveStatus.trim()) {
        totalDescriptiveStatus++;
        byCourse[courseCode].totalDescriptiveStatus++;
      }

      const recordData = {
        id: record._id.toString(),
        date: record.date,
        persianDate,
        persianMonth: record.persianMonth || '',
        courseCode,
        courseName,
        teacherName,
        timeSlot: record.timeSlot || '',
        presenceStatus: record.presenceStatus || null,
        grades,
        assessments,
        note: record.note || '',
        descriptiveStatus: record.descriptiveStatus || '',
      };

      byCourse[courseCode].records.push(recordData);
      timeline.push(recordData);
    });

    // Calculate averages per course
    Object.keys(byCourse).forEach(courseCode => {
      const course = byCourse[courseCode];
      if (course.totalGradesCount > 0) {
        course.averageGrade = (course.totalGrades / course.totalGradesCount).toFixed(2);
      } else {
        course.averageGrade = null;
      }
    });

    // Sort courses by course name
    const coursesList = Object.values(byCourse).sort((a: any, b: any) => 
      a.courseName.localeCompare(b.courseName, 'fa')
    );

    await client.close();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRecords: records.length,
          totalGrades: totalGradesCount,
          averageGrade: totalGradesCount > 0 ? (totalGrades / totalGradesCount).toFixed(2) : null,
          totalAssessments,
          totalNotes,
          totalDescriptiveStatus,
        },
        byCourse: coursesList,
        timeline: timeline.slice(0, 50), // Limit to 50 most recent
      },
    });

  } catch (error: any) {
    console.error('Error fetching classsheet review:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
