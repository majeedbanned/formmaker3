import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
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

interface StoryResponseItem {
  id: string;
  caption: string;
  imageData: string;
  createdAt: string;
  expiresAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  audienceType: 'all' | 'class';
  classCodes: string[];
}

export async function GET(request: NextRequest) {
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

      const rawStories = await db
        .collection('stories')
        .find({
          schoolCode: decoded.schoolCode,
          expiresAt: { $gt: now },
        })
        .sort({ createdAt: -1 })
        .toArray();

      let filteredStories = rawStories;

      if (decoded.userType === 'student' || decoded.role === 'student') {
        const student = await db.collection('students').findOne({
          'data.schoolCode': decoded.schoolCode,
          'data.studentCode': decoded.username,
        });

        const classCodes = Array.isArray(student?.data?.classCode)
          ? student!.data.classCode.map((cls: any) => cls.value || cls)
          : [];

        filteredStories = rawStories.filter((story) => {
          if (story.audienceType === 'all') return true;
          if (!Array.isArray(story.classCodes) || story.classCodes.length === 0) return false;
          return story.classCodes.some((code: string) => classCodes.includes(code));
        });
      } else if (decoded.userType === 'teacher' || decoded.role === 'teacher') {
        const teacher = await db.collection('teachers').findOne({
          'data.schoolCode': decoded.schoolCode,
          'data.teacherCode': decoded.username,
        });

        const teacherClasses = Array.isArray(teacher?.data?.classCode)
          ? teacher!.data.classCode.map((cls: any) => cls.value || cls)
          : [];

        if (teacherClasses.length > 0) {
          filteredStories = rawStories.filter((story) => {
            if (story.audienceType === 'all') return true;
            if (!Array.isArray(story.classCodes) || story.classCodes.length === 0) return false;
            return story.classCodes.some((code: string) => teacherClasses.includes(code));
          });
        }
      }

      const stories: StoryResponseItem[] = filteredStories.map((story) => ({
        id: story._id instanceof ObjectId ? story._id.toHexString() : String(story._id),
        caption: story.caption || '',
        imageData: story.imageData || '',
        createdAt: story.createdAt ? new Date(story.createdAt).toISOString() : new Date().toISOString(),
        expiresAt: story.expiresAt ? new Date(story.expiresAt).toISOString() : '',
        createdBy: {
          id: story.createdBy?.id || '',
          name: story.createdBy?.name || 'مدرسه',
        },
        audienceType: story.audienceType || 'all',
        classCodes: Array.isArray(story.classCodes) ? story.classCodes : [],
      }));

      return NextResponse.json({
        success: true,
        data: {
          stories,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در دریافت استوری‌ها' },
      { status: 500 }
    );
  }
}

