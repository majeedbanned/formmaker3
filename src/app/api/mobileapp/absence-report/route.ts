import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
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

    const allRecords = await db.collection('classsheet').find({
      studentCode: studentCode,
      schoolCode: decoded.schoolCode,
    }).toArray();

    const totalPresent = allRecords.filter((r: any) => r.presenceStatus === 'present').length;
    const classsheetRecords = allRecords.filter((r: any) => 
      r.presenceStatus && ['absent', 'late', 'delayed', 'excused'].includes(r.presenceStatus)
    );

    const courseCodes = [...new Set(classsheetRecords.map((r: any) => r.courseCode))];
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

    const summaryStats = {
      totalAbsent: 0,
      totalLate: 0,
      totalDelayed: 0,
      totalExcused: 0,
      totalAcceptable: 0,
      totalUnacceptable: 0,
      totalPresent: totalPresent,
      totalRecords: classsheetRecords.length,
      totalSessions: allRecords.length,
    };

    const recordsByCourse: Record<string, any[]> = {};

    classsheetRecords.forEach((record: any) => {
      const status = record.presenceStatus || 'absent';
      if (status === 'absent') summaryStats.totalAbsent++;
      else if (status === 'late') summaryStats.totalLate++;
      else if (status === 'delayed') summaryStats.totalDelayed++;
      else if (status === 'excused') summaryStats.totalExcused++;

      if (record.absenceAcceptable === true) {
        summaryStats.totalAcceptable++;
      } else {
        summaryStats.totalUnacceptable++;
      }

      const courseCode = record.courseCode || 'unknown';
      if (!recordsByCourse[courseCode]) {
        recordsByCourse[courseCode] = [];
      }

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

      recordsByCourse[courseCode].push({
        id: record._id.toString(),
        date: record.date,
        persianDate: persianDate,
        persianMonth: record.persianMonth || '',
        courseCode: courseCode,
        courseName: courseMap[courseCode] || courseCode,
        status: status,
        statusText: status === 'absent' ? 'غیبت' : status === 'late' ? 'تأخیر' : status === 'delayed' ? 'دیرکرد' : status === 'excused' ? 'موجه' : 'نامشخص',
        acceptable: record.absenceAcceptable === true,
        unacceptable: record.absenceAcceptable === false,
        description: record.absenceDescription || record.descriptiveStatus || '',
        timeSlot: record.timeSlot || '',
      });
    });

    const courseSummary = Object.keys(recordsByCourse).map((courseCode) => {
      const records = recordsByCourse[courseCode];
      let courseAbsent = 0, courseLate = 0, courseDelayed = 0, courseExcused = 0, courseAcceptable = 0, courseUnacceptable = 0;

      records.forEach((record) => {
        if (record.status === 'absent') courseAbsent++;
        else if (record.status === 'late') courseLate++;
        else if (record.status === 'delayed') courseDelayed++;
        else if (record.status === 'excused') courseExcused++;
        if (record.acceptable) courseAcceptable++;
        else courseUnacceptable++;
      });

      return {
        courseCode: courseCode,
        courseName: courseMap[courseCode] || courseCode,
        total: records.length,
        absent: courseAbsent,
        late: courseLate,
        delayed: courseDelayed,
        excused: courseExcused,
        acceptable: courseAcceptable,
        unacceptable: courseUnacceptable,
        records: records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      };
    });

    courseSummary.sort((a, b) => b.total - a.total);
    await client.close();

    return NextResponse.json({
      success: true,
      data: {
        summary: summaryStats,
        courses: courseSummary,
      },
    });

  } catch (error: any) {
    console.error('Error fetching absence report:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
    const { recordId, absenceAcceptable, absenceDescription } = body;

    if (!recordId) {
      return NextResponse.json({ success: false, message: 'Record ID is required' }, { status: 400 });
    }

    const dbConfig = getDatabaseConfig();
    const schoolConfig = dbConfig[decoded.domain];
    if (!schoolConfig) {
      return NextResponse.json({ success: false, message: 'Database configuration not found' }, { status: 500 });
    }

    const client = new MongoClient(schoolConfig.connectionString);
    await client.connect();
    const db = client.db();

    const { ObjectId } = require('mongodb');
    const result = await db.collection('classsheet').updateOne(
      { _id: new ObjectId(recordId), schoolCode: decoded.schoolCode },
      { 
        $set: { 
          absenceAcceptable: absenceAcceptable,
          absenceDescription: absenceDescription || '',
          updatedAt: new Date(),
        } 
      }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'وضعیت با موفقیت به‌روزرسانی شد' });

  } catch (error: any) {
    console.error('Error updating absence status:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}


// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

