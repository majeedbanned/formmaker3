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

interface UpdateStoryBody {
  title?: string;
  caption?: string;
  imageData?: string;
  audienceType?: 'all' | 'class' | 'teachers';
  classCodes?: string[];
  visibleToTeachers?: boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // ~5MB base64 length approximation

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
        { success: false, message: 'فقط مدیر مدرسه می‌تواند استوری را حذف کند' },
        { status: 403 }
      );
    }

    const storyId = params.id;
    if (!storyId || !ObjectId.isValid(storyId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه استوری نامعتبر است' },
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

      const result = await db.collection('stories').deleteOne({
        _id: new ObjectId(storyId),
        schoolCode: decoded.schoolCode,
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'استوری مورد نظر یافت نشد' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'استوری حذف شد',
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error deleting story:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در حذف استوری' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
        { success: false, message: 'فقط مدیر مدرسه می‌تواند استوری را ویرایش کند' },
        { status: 403 }
      );
    }

    const storyId = params.id;
    if (!storyId || !ObjectId.isValid(storyId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه استوری نامعتبر است' },
        { status: 400 }
      );
    }

    const body: UpdateStoryBody = await request.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, message: 'هیچ تغییری ارسال نشده است' },
        { status: 400 }
      );
    }

    if (body.audienceType && !['all', 'class', 'teachers'].includes(body.audienceType)) {
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

    if (body.classCodes && !Array.isArray(body.classCodes)) {
      return NextResponse.json(
        { success: false, message: 'کلاس‌ها باید به صورت آرایه ارسال شوند' },
        { status: 400 }
      );
    }

    if (body.imageData !== undefined) {
      if (body.imageData !== null && typeof body.imageData !== 'string') {
        return NextResponse.json(
          { success: false, message: 'فرمت تصویر نامعتبر است' },
          { status: 400 }
        );
      }

      if (body.imageData && body.imageData.length > MAX_IMAGE_SIZE * 1.4) {
        return NextResponse.json(
          { success: false, message: 'حجم تصویر بیش از حد مجاز است (حداکثر ۵ مگابایت)' },
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

      const updateFields: Record<string, unknown> = {};

      if (typeof body.title === 'string') {
        const trimmedTitle = body.title.trim();
        if (!trimmedTitle) {
          return NextResponse.json(
            { success: false, message: 'عنوان استوری نمی‌تواند خالی باشد' },
            { status: 400 }
          );
        }
        if (trimmedTitle.length > 100) {
          return NextResponse.json(
            { success: false, message: 'حداکثر طول عنوان ۱۰۰ کاراکتر است' },
            { status: 400 }
          );
        }
        updateFields.title = trimmedTitle;
      }

      if (typeof body.caption === 'string') {
        updateFields.caption = body.caption;
      }

      if (body.audienceType) {
        updateFields.audienceType = body.audienceType;
        updateFields.classCodes = body.audienceType === 'class' ? body.classCodes || [] : [];
        updateFields.visibleToStudents = body.audienceType !== 'teachers';
      } else if (Array.isArray(body.classCodes)) {
        updateFields.classCodes = body.classCodes;
      }

      if (body.imageData) {
        updateFields.imageData = body.imageData;
      }

      if (typeof body.visibleToTeachers === 'boolean') {
        updateFields.visibleToTeachers = body.visibleToTeachers;
      }

      if (Object.keys(updateFields).length === 0) {
        return NextResponse.json(
          { success: false, message: 'هیچ تغییری برای ثبت وجود ندارد' },
          { status: 400 }
        );
      }

      updateFields.updatedAt = new Date();

      const result = await db.collection('stories').updateOne(
        {
          _id: new ObjectId(storyId),
          schoolCode: decoded.schoolCode,
        },
        {
          $set: updateFields,
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'استوری مورد نظر یافت نشد' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'استوری با موفقیت به‌روزرسانی شد',
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error updating story:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در ویرایش استوری' },
      { status: 500 }
    );
  }
}

