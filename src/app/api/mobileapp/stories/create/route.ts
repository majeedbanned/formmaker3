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

interface CreateStoryBody {
  title?: string;
  caption?: string;
  imageData: string;
  audienceType: 'all' | 'class' | 'teachers';
  classCodes?: string[];
  visibleToTeachers?: boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB base64 length approx

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
        { success: false, message: 'فقط مدیر مدرسه می‌تواند استوری ایجاد کند' },
        { status: 403 }
      );
    }

    const body: CreateStoryBody = await request.json();

    if (!body || !body.imageData || typeof body.imageData !== 'string') {
      return NextResponse.json(
        { success: false, message: 'تصویر استوری الزامی است' },
        { status: 400 }
      );
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
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'عنوان استوری الزامی است' },
        { status: 400 }
      );
    }

    if (body.title.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: 'حداکثر طول عنوان ۱۰۰ کاراکتر است' },
        { status: 400 }
      );
    }
      }
    }

    if (body.imageData.length > MAX_IMAGE_SIZE * 1.4) {
      return NextResponse.json(
        { success: false, message: 'حجم تصویر بیش از حد مجاز است (حداکثر ۵ مگابایت)' },
        { status: 400 }
      );
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

      const storyDoc = {
        schoolCode: decoded.schoolCode,
        title: body.title.trim(),
        caption: body.caption || '',
        imageData: body.imageData,
        audienceType: body.audienceType,
        classCodes: body.audienceType === 'class' ? body.classCodes || [] : [],
        visibleToTeachers: body.visibleToTeachers !== false,
        visibleToStudents: body.audienceType !== 'teachers',
        createdAt: new Date(),
        createdBy: {
          id: decoded.userId,
          name: decoded.name || 'مدرسه',
          username: decoded.username,
        },
      };

      await db.collection('stories').insertOne(storyDoc);

      return NextResponse.json({
        success: true,
        message: 'استوری با موفقیت ایجاد شد',
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error creating story:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در ایجاد استوری' },
      { status: 500 }
    );
  }
}

