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
  iat?: number;
  exp?: number;
}

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

    if (decoded.userType !== 'teacher' && decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'دسترسی برای تغییر اطلاعات دانش‌آموز مجاز نیست' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, newPassword, isActive } = body as {
      studentId?: string;
      newPassword?: string;
      isActive?: boolean;
    };

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: 'شناسه دانش‌آموز الزامی است' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه دانش‌آموز نامعتبر است' },
        { status: 400 }
      );
    }

    const trimmedPassword = typeof newPassword === 'string' ? newPassword.trim() : undefined;
    if (trimmedPassword && trimmedPassword.length < 4) {
      return NextResponse.json(
        { success: false, message: 'رمز عبور باید حداقل ۴ کاراکتر باشد' },
        { status: 400 }
      );
    }

    if (trimmedPassword === '') {
      return NextResponse.json(
        { success: false, message: 'رمز عبور نمی‌تواند خالی باشد' },
        { status: 400 }
      );
    }

    if (trimmedPassword === undefined && typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'هیچ تغییری ارسال نشده است' },
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

      const filter = {
        _id: new ObjectId(studentId),
        'data.schoolCode': decoded.schoolCode,
      };

      const updateFields: Record<string, unknown> = {};

      if (trimmedPassword !== undefined) {
        updateFields['data.password'] = trimmedPassword;
      }

      if (typeof isActive === 'boolean') {
        updateFields['data.isActive'] = isActive;
      }

      updateFields.updatedAt = new Date();
      updateFields['data.updatedAt'] = new Date();
      updateFields['data.updatedBy'] = decoded.userId;

      const updateResult = await studentsCollection.updateOne(filter, {
        $set: updateFields,
      });

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'دانش‌آموز یافت نشد' },
          { status: 404 }
        );
      }

      const updatedStudent = await studentsCollection.findOne(filter);

      return NextResponse.json({
        success: true,
        message: 'اطلاعات دانش‌آموز با موفقیت به‌روزرسانی شد',
        data: {
          student: updatedStudent
            ? {
                id: updatedStudent._id.toString(),
                studentCode: updatedStudent.data?.studentCode || '',
                studentName: updatedStudent.data?.studentName || '',
                studentFamily: updatedStudent.data?.studentFamily || '',
                isActive: updatedStudent.data?.isActive ?? true,
                password: updatedStudent.data?.password || '',
                classCode: updatedStudent.data?.classCode || [],
                phones: updatedStudent.data?.phones || [],
              }
            : null,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error updating student credentials:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در به‌روزرسانی اطلاعات دانش‌آموز' },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

