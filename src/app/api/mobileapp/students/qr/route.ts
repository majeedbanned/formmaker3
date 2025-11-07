import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';

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

    if (decoded.userType !== 'teacher' && decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'دسترسی برای مشاهده QR دانش‌آموز مجاز نیست' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId || !ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه دانش‌آموز نامعتبر است' },
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

    const client = new MongoClient(schoolConfig.connectionString);
    await client.connect();

    try {
      const db = client.db();
      const studentsCollection = db.collection('students');

      const student = await studentsCollection.findOne({
        _id: new ObjectId(studentId),
        'data.schoolCode': decoded.schoolCode,
      });

      if (!student) {
        return NextResponse.json(
          { success: false, message: 'دانش‌آموز یافت نشد' },
          { status: 404 }
        );
      }

      const studentCode = student.data?.studentCode;
      const password = student.data?.password;

      if (!studentCode) {
        return NextResponse.json(
          { success: false, message: 'کد دانش‌آموز برای تولید QR در دسترس نیست' },
          { status: 400 }
        );
      }

      if (!password) {
        return NextResponse.json(
          { success: false, message: 'رمز عبور برای این دانش‌آموز ثبت نشده است' },
          { status: 400 }
        );
      }

      const qrPayload = {
        domain: decoded.domain,
        userType: 'student',
        role: 'student',
        username: studentCode,
        schoolCode: decoded.schoolCode,
        password,
      };

      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          qrDataUrl,
          qrPayload,
          student: {
            id: student._id.toString(),
            studentName: student.data?.studentName || '',
            studentFamily: student.data?.studentFamily || '',
            studentCode,
            classCode: student.data?.classCode || [],
            isActive: student.data?.isActive ?? true,
          },
        },
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error generating student QR code:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در تولید QR کد دانش‌آموز' },
      { status: 500 }
    );
  }
}
