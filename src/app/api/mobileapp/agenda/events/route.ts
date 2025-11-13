import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

interface JWTPayload {
  userId: string;
  domain: string;
  schoolCode: string;
  role: string;
  userType: string;
  username: string;
  name?: string;
  iat?: number;
  exp?: number;
}

interface DatabaseConfigEntry {
  schoolCode: string;
  connectionString: string;
  description?: string;
}

interface DatabaseConfig {
  [domain: string]: DatabaseConfigEntry;
}

const getDatabaseConfig = (): DatabaseConfig => {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'database.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading database config:', error);
    return {};
  }
};

const getDbClient = async (connectionString: string) => {
  const client = new MongoClient(connectionString);
  await client.connect();
  const dbName = connectionString.split('/')[3].split('?')[0];
  const db = client.db(dbName);
  return { client, db };
};

const toEnglishDigits = (input: string): string =>
  input
    .replace(/[۰-۹]/g, (char) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(char)));

const jalaliToGregorian = (jy: number, jm: number, jd: number): [number, number, number] => {
  let gy = jy <= 979 ? 621 : 1600;
  jy = jy <= 979 ? jy : jy - 979;
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  for (gm = 0; gm < 13; gm++) {
    const v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }
  return [gy, gm, gd];
};

const normalisePersianDate = (value: string) => toEnglishDigits(value.trim());

const convertPersianDateToGregorian = (persianDate: string) => {
  const normalized = normalisePersianDate(persianDate);
  const [yearStr, monthStr, dayStr] = normalized.split('/');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) {
    throw new Error('Invalid Persian date');
  }
  const [gy, gm, gd] = jalaliToGregorian(year, month, day);
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${gy}-${pad(gm)}-${pad(gd)}`;
};

const fetchStudentClassCodes = async (db: any, username: string, schoolCode: string) => {
  const studentDoc = await db.collection('students').findOne({
    'data.studentCode': username,
    'data.schoolCode': schoolCode,
  });

  if (!studentDoc?.data?.classCode || !Array.isArray(studentDoc.data.classCode)) {
    return [];
  }

  return studentDoc.data.classCode
    .filter((item: any) => item && typeof item === 'object' && item.value)
    .map((item: any) => item.value);
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    const dbConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];

    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'پیکربندی مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    if (domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const monthParam = searchParams.get('month'); // expect YYYY-MM (jalali)
    const showAll = searchParams.get('showAll') === 'true';

    const { client, db } = await getDbClient(domainConfig.connectionString);

    try {
      const eventsCollection = db.collection('events');
      const query: Record<string, any> = {
        schoolCode: decoded.schoolCode,
      };

      if (decoded.userType === 'teacher') {
        // By default, teachers only see their own events
        // If showAll=true, they can see all events (teachers and school)
        if (!showAll) {
          query.teacherCode = decoded.username;
        }
        // If showAll=true, don't filter by teacherCode, allowing all events
      } else if (decoded.userType === 'school') {
        // By default, school users see all events
        // If showAll=false, they only see events they created
        if (!showAll) {
          query.createdBy = decoded.username;
        }
        // If showAll=true, don't filter by createdBy, allowing all events
      } else if (decoded.userType === 'student') {
        const studentClassCodes = await fetchStudentClassCodes(db, decoded.username, decoded.schoolCode);
        if (!studentClassCodes.length) {
          return NextResponse.json({
            success: true,
            data: { events: [] },
          });
        }
        // Query events where classCode (array or single value) contains any of student's class codes
        // MongoDB's $in operator works for both arrays and single values
        query.classCode = { $in: studentClassCodes };
      }

      if (startDateParam || endDateParam) {
        query.date = {};
        if (startDateParam) query.date.$gte = startDateParam;
        if (endDateParam) query.date.$lte = endDateParam;
      } else if (monthParam) {
        const [jy, jm] = monthParam.split('-').map((part) => Number(part));
        if (jy && jm) {
          const startPersian = `${jy}/${jm.toString().padStart(2, '0')}/01`;
          const [gyStart, gmStart, gdStart] = jalaliToGregorian(jy, jm, 1);
          const startGregorian = `${gyStart}-${gmStart.toString().padStart(2, '0')}-${gdStart
            .toString()
            .padStart(2, '0')}`;

          let nextJy = jy;
          let nextJm = jm + 1;
          if (nextJm > 12) {
            nextJm = 1;
            nextJy += 1;
          }
          const [gyEnd, gmEnd, gdEnd] = jalaliToGregorian(nextJy, nextJm, 1);
          const endGregorian = `${gyEnd}-${gmEnd.toString().padStart(2, '0')}-${gdEnd
            .toString()
            .padStart(2, '0')}`;

          query.date = {
            $gte: startGregorian,
            $lt: endGregorian,
          };
        }
      }

      let events = await eventsCollection.find(query).sort({ date: 1, timeSlot: 1 }).toArray();

      // Normalize classCode and courseCode to arrays for backward compatibility
      events = events.map((event) => ({
        ...event,
        classCode: Array.isArray(event.classCode) ? event.classCode : event.classCode ? [event.classCode] : [],
        courseCode: Array.isArray(event.courseCode) ? event.courseCode : event.courseCode ? [event.courseCode] : [],
      }));

      // For students, filter events where at least one classCode matches
      if (decoded.userType === 'student') {
        const studentClassCodes = await fetchStudentClassCodes(db, decoded.username, decoded.schoolCode);
        events = events.filter((event) => {
          const eventClassCodes = Array.isArray(event.classCode) ? event.classCode : [event.classCode];
          return eventClassCodes.some((code) => studentClassCodes.includes(code));
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          events,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error fetching agenda events:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت رویدادها' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    if (decoded.userType !== 'school' && decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیر مجاز' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      persianDate,
      timeSlot,
      teacherCode,
      courseCode,
      classCode,
      isSchoolEvent,
    } = body;

    const effectiveTeacherCode = decoded.userType === 'teacher' ? decoded.username : teacherCode;

    // Normalize to arrays for multiple selection support
    const classCodes = Array.isArray(classCode) ? classCode : classCode ? [classCode] : [];
    const courseCodes = Array.isArray(courseCode) ? courseCode : courseCode ? [courseCode] : [];

    if (
      !title ||
      !persianDate ||
      !timeSlot ||
      !effectiveTeacherCode ||
      courseCodes.length === 0 ||
      classCodes.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: 'لطفاً تمام فیلدهای ضروری را تکمیل کنید' },
        { status: 400 }
      );
    }

    if (decoded.userType === 'teacher' && teacherCode && teacherCode !== decoded.username) {
      return NextResponse.json(
        { success: false, message: 'امکان ایجاد رویداد برای سایر اساتید وجود ندارد' },
        { status: 403 }
      );
    }

    const dbConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];

    if (!domainConfig || domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'پیکربندی مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    const { client, db } = await getDbClient(domainConfig.connectionString);

    try {
      const eventsCollection = db.collection('events');
      const gregorianDate = convertPersianDateToGregorian(persianDate);
      const normalizedPersianDate = normalisePersianDate(persianDate);
      const now = new Date();

      // Create a single event with arrays for classCode and courseCode
      const newEvent = {
        _id: new ObjectId(),
        schoolCode: decoded.schoolCode,
        teacherCode: effectiveTeacherCode,
        courseCode: courseCodes, // Array
        classCode: classCodes, // Array
        date: gregorianDate,
        timeSlot,
        title,
        description: description || '',
        persianDate: normalizedPersianDate,
        createdBy: decoded.username,
        isSchoolEvent: decoded.userType === 'school' || isSchoolEvent === true,
        createdAt: now,
        updatedAt: now,
      };

      const insertResult = await eventsCollection.insertOne(newEvent);

      if (!insertResult.acknowledged) {
        throw new Error('Failed to insert event');
      }

      return NextResponse.json({
        success: true,
        data: newEvent,
        message: 'رویداد با موفقیت ایجاد شد',
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error creating agenda event:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد رویداد' },
      { status: 500 }
    );
  }
}


