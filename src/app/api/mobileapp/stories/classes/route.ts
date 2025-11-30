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
  iat?: number;
  exp?: number;
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

    if (decoded.userType !== 'school' && decoded.role !== 'school') {
      return NextResponse.json(
        { success: false, message: 'فقط مدیر مدرسه می‌تواند فهرست کلاس‌ها را مشاهده کند' },
        { status: 403 }
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

      const classes = await db
        .collection('classes')
        .find({ 'data.schoolCode': decoded.schoolCode })
        .project({ 'data.classCode': 1, 'data.className': 1 })
        .sort({ 'data.className': 1 })
        .toArray();

      const classOptions = classes
        .map((cls) => {
          const classCodeValue = cls.data?.classCode?.value || cls.data?.classCode;
          const className = cls.data?.className || classCodeValue;
          if (!classCodeValue) return null;

          return {
            classCode: String(classCodeValue),
            className: String(className || classCodeValue),
          };
        })
        .filter(Boolean);

      return NextResponse.json({
        success: true,
        data: {
          classes: classOptions,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error fetching classes for stories:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در دریافت کلاس‌ها' },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}


