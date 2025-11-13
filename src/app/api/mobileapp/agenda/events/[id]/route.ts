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

const convertPersianDateToGregorian = (persianDate: string) => {
  const normalized = toEnglishDigits(persianDate.trim());
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

const normalisePersianDate = (value: string) => toEnglishDigits(value.trim());

const verifyToken = (request: NextRequest): JWTPayload => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('AUTH_MISSING');
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('AUTH_INVALID');
  }
};

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = verifyToken(request);

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'شناسه رویداد نامعتبر است' },
        { status: 400 }
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
      const eventId = new ObjectId(params.id);

      const existingEvent = await eventsCollection.findOne({
        _id: eventId,
        schoolCode: decoded.schoolCode,
      });

      if (!existingEvent) {
        return NextResponse.json(
          { success: false, message: 'رویداد یافت نشد' },
          { status: 404 }
        );
      }

      // Only allow editing events created by the current user
      if (existingEvent.createdBy !== decoded.username) {
        return NextResponse.json(
          { success: false, message: 'شما اجازه ویرایش این رویداد را ندارید' },
          { status: 403 }
        );
      }

      const gregorianDate = convertPersianDateToGregorian(persianDate);

      const updateDoc = {
        $set: {
          title,
          description: description || '',
          persianDate: normalisePersianDate(persianDate),
          date: gregorianDate,
          timeSlot,
          teacherCode: effectiveTeacherCode,
          courseCode: courseCodes, // Array
          classCode: classCodes, // Array
          isSchoolEvent:
            existingEvent.isSchoolEvent ||
            decoded.userType === 'school' ||
            isSchoolEvent === true,
          updatedAt: new Date(),
        },
      };

      await eventsCollection.updateOne({ _id: eventId }, updateDoc);

      return NextResponse.json({
        success: true,
        message: 'رویداد با موفقیت به‌روزرسانی شد',
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'AUTH_MISSING') {
        return NextResponse.json(
          { success: false, message: 'توکن احراز هویت الزامی است' },
          { status: 401 }
        );
      }
      if (error.message === 'AUTH_INVALID') {
        return NextResponse.json(
          { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
          { status: 401 }
        );
      }
    }
    console.error('Error updating agenda event:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی رویداد' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = verifyToken(request);

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'شناسه رویداد نامعتبر است' },
        { status: 400 }
      );
    }

    if (decoded.userType !== 'school' && decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیر مجاز' },
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
      const eventId = new ObjectId(params.id);

      const existingEvent = await eventsCollection.findOne({
        _id: eventId,
        schoolCode: decoded.schoolCode,
      });

      if (!existingEvent) {
        return NextResponse.json(
          { success: false, message: 'رویداد یافت نشد' },
          { status: 404 }
        );
      }

      // Only allow deleting events created by the current user
      if (existingEvent.createdBy !== decoded.username) {
        return NextResponse.json(
          { success: false, message: 'شما اجازه حذف این رویداد را ندارید' },
          { status: 403 }
        );
      }

      await eventsCollection.deleteOne({ _id: eventId });

      return NextResponse.json({
        success: true,
        message: 'رویداد با موفقیت حذف شد',
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'AUTH_MISSING') {
        return NextResponse.json(
          { success: false, message: 'توکن احراز هویت الزامی است' },
          { status: 401 }
        );
      }
      if (error.message === 'AUTH_INVALID') {
        return NextResponse.json(
          { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
          { status: 401 }
        );
      }
    }
    console.error('Error deleting agenda event:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف رویداد' },
      { status: 500 }
    );
  }
}


