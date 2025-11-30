import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
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

interface TeacherSettings {
  showMonthlyGrade?: boolean;
  swapCellActions?: boolean;
  headerColor?: string;
  columnHeaderColor?: string;
  showAvatars?: boolean;
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

    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند به تنظیمات دسترسی داشته باشند' },
        { status: 403 }
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

    const { client, db } = await getDbClient(domainConfig.connectionString);

    try {
      // Find teacher settings
      const settings = await db.collection('teacherSettings').findOne({
        teacherCode: decoded.username,
        schoolCode: decoded.schoolCode,
      });

      // Return default settings if none found
      const defaultSettings: TeacherSettings = {
        showMonthlyGrade: false,
        swapCellActions: false,
        headerColor: '#6366F1',
        columnHeaderColor: '#6366F1',
        showAvatars: false,
      };

      return NextResponse.json({
        success: true,
        data: settings?.settings || defaultSettings,
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error fetching teacher settings:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
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

    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند تنظیمات را تغییر دهند' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, message: 'داده‌های تنظیمات نامعتبر است' },
        { status: 400 }
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

    const { client, db } = await getDbClient(domainConfig.connectionString);

    try {
      // Validate and sanitize settings
      const validSettings: TeacherSettings = {
        showMonthlyGrade: Boolean(settings.showMonthlyGrade),
        swapCellActions: Boolean(settings.swapCellActions),
        headerColor: typeof settings.headerColor === 'string' ? settings.headerColor : '#6366F1',
        columnHeaderColor: typeof settings.columnHeaderColor === 'string' ? settings.columnHeaderColor : '#6366F1',
        showAvatars: Boolean(settings.showAvatars),
      };

      // Update or create settings
      const now = new Date();
      await db.collection('teacherSettings').updateOne(
        {
          teacherCode: decoded.username,
          schoolCode: decoded.schoolCode,
        },
        {
          $set: {
            settings: validSettings,
            updatedAt: now,
          },
          $setOnInsert: {
            teacherCode: decoded.username,
            schoolCode: decoded.schoolCode,
            createdAt: now,
          },
        },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: 'تنظیمات با موفقیت ذخیره شد',
        data: validSettings,
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error saving teacher settings:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

