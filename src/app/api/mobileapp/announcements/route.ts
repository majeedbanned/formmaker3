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

interface AnnouncementItem {
  id: string;
  message: string;
  icon: string;
  backgroundColor: string;
  createdAt: string;
  expiresAt?: string;
  createdBy: {
    id: string;
    name: string;
  };
  audienceType: 'all' | 'class' | 'teachers';
  classCodes: string[];
  likes?: string[];
  likeCount?: number;
  isLiked?: boolean;
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

      // Note: Expiration dates are ignored - all announcements are shown regardless of expiresAt
      const rawAnnouncements = await db
        .collection('announcements')
        .find({
          schoolCode: decoded.schoolCode,
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      let filtered = rawAnnouncements;

      if (decoded.userType === 'student' || decoded.role === 'student') {
        const student = await db.collection('students').findOne({
          'data.schoolCode': decoded.schoolCode,
          'data.studentCode': decoded.username,
        });

        const studentClasses = Array.isArray(student?.data?.classCode)
          ? student!.data.classCode.map((cls: any) => cls.value || cls)
          : [];

        filtered = rawAnnouncements.filter((announcement) => {
          if (announcement.audienceType === 'teachers') return false;
          if (announcement.audienceType === 'all') return true;
          if (!Array.isArray(announcement.classCodes) || announcement.classCodes.length === 0) return false;
          return announcement.classCodes.some((code: string) => studentClasses.includes(code));
        });
      } else if (decoded.userType === 'teacher' || decoded.role === 'teacher') {
        const teacher = await db.collection('teachers').findOne({
          'data.schoolCode': decoded.schoolCode,
          'data.teacherCode': decoded.username,
        });

        const teacherClasses = Array.isArray(teacher?.data?.classCode)
          ? teacher!.data.classCode.map((cls: any) => cls.value || cls)
          : [];

        filtered = rawAnnouncements.filter((announcement) => {
          if (announcement.audienceType === 'teachers') return true;
          if (announcement.audienceType === 'all') return true;
          if (!Array.isArray(announcement.classCodes) || announcement.classCodes.length === 0) return false;
          return announcement.classCodes.some((code: string) => teacherClasses.includes(code));
        });
      }

      const announcements: AnnouncementItem[] = filtered.map((announcement) => {
        const likes = Array.isArray(announcement.likes) ? announcement.likes : [];
        const likeCount = likes.length;
        const isLiked = likes.includes(decoded.userId);
        
        return {
          id: announcement._id instanceof ObjectId ? announcement._id.toHexString() : String(announcement._id),
          message: announcement.message || '',
          icon: announcement.icon || 'megaphone',
          backgroundColor: announcement.backgroundColor || '#F1F5F9',
          createdAt: announcement.createdAt ? new Date(announcement.createdAt).toISOString() : new Date().toISOString(),
          expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString() : undefined,
          createdBy: {
            id: announcement.createdBy?.id || '',
            name: announcement.createdBy?.name || 'مدرسه',
          },
          audienceType: announcement.audienceType || 'all',
          classCodes: Array.isArray(announcement.classCodes) ? announcement.classCodes : [],
          likes,
          likeCount,
          isLiked,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          announcements,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در دریافت اطلاعیه‌ها' },
      { status: 500 }
    );
  }
}

