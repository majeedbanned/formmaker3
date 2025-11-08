import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

interface DatabaseConfig {
  [domain: string]: {
    schoolCode: string;
    connectionString: string;
    description: string;
  };
}

const getDatabaseConfig = (): DatabaseConfig => {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'database.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading database config:', error);
    return {} as DatabaseConfig;
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
  name?: string;
  iat?: number;
  exp?: number;
}

interface CreateAnnouncementBody {
  message: string;
  icon: string;
  backgroundColor: string;
  audienceType: 'all' | 'class' | 'teachers';
  classCodes?: string[];
  expiresInHours?: number;
}

const VALID_ICONS = new Set([
  'megaphone',
  'school',
  'alarm',
  'calendar',
  'gift',
  'sparkles',
  'book',
  'trophy',
  'bulb',
]);

const DEFAULT_COLORS = ['#FDE68A', '#FCA5A5', '#BFDBFE', '#C4B5FD', '#A7F3D0'];

export async function POST(request: NextRequest) {
  try {
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
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    if (decoded.userType !== 'school' && decoded.role !== 'school') {
      return NextResponse.json(
        { success: false, message: 'فقط مدیر مدرسه می‌تواند اطلاعیه ثبت کند' },
        { status: 403 }
      );
    }

    const body: CreateAnnouncementBody = await request.json();

    if (!body || !body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { success: false, message: 'متن اطلاعیه الزامی است' },
        { status: 400 }
      );
    }

    if (body.message.length > 200) {
      return NextResponse.json(
        { success: false, message: 'متن اطلاعیه حداکثر باید ۲۰۰ کاراکتر باشد' },
        { status: 400 }
      );
    }

    if (!body.icon || !VALID_ICONS.has(body.icon)) {
      return NextResponse.json(
        { success: false, message: 'آیکن انتخابی معتبر نیست' },
        { status: 400 }
      );
    }

    if (!body.backgroundColor || typeof body.backgroundColor !== 'string') {
      body.backgroundColor = DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
    }

    if (!body.audienceType || !['all', 'class', 'teachers'].includes(body.audienceType)) {
      return NextResponse.json(
        { success: false, message: 'نوع مخاطب نامعتبر است' },
        { status: 400 }
      );
    }

    if (body.audienceType === 'class') {
      if (!Array.isArray(body.classCodes) || body.classCodes.length === 0) {
        return NextResponse.json(
          { success: false, message: 'انتخاب حداقل یک کلاس ضروری است' },
          { status: 400 }
        );
      }
    }

    const dbConfig = getDatabaseConfig();
    const schoolConfig = dbConfig[decoded.domain];

    if (!schoolConfig) {
      return NextResponse.json(
        { success: false, message: 'تنظیمات پایگاه داده یافت نشد' },
        { status: 500 }
      );
    }

    if (schoolConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400 }
      );
    }

    const client = new MongoClient(schoolConfig.connectionString);
    await client.connect();

    try {
      const dbName = schoolConfig.connectionString.split('/')[3].split('?')[0];
      const db = client.db(dbName);

      const now = new Date();
      const expiresAt = body.expiresInHours
        ? new Date(now.getTime() + body.expiresInHours * 60 * 60 * 1000)
        : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const announcementDoc = {
        schoolCode: decoded.schoolCode,
        message: body.message,
        icon: body.icon,
        backgroundColor: body.backgroundColor,
        audienceType: body.audienceType,
        classCodes: body.audienceType === 'class' ? body.classCodes || [] : [],
        createdAt: now,
        expiresAt,
        createdBy: {
          id: decoded.userId,
          name: decoded.name || 'مدرسه',
          username: decoded.username,
        },
      };

      await db.collection('announcements').insertOne(announcementDoc);

      return NextResponse.json({
        success: true,
        message: 'اطلاعیه با موفقیت ثبت شد',
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در ثبت اطلاعیه' },
      { status: 500 }
    );
  }
}

