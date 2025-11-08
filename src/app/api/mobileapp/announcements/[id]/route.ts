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

interface UpdateAnnouncementBody {
  message?: string;
  icon?: string;
  backgroundColor?: string;
  audienceType?: 'all' | 'class' | 'teachers';
  classCodes?: string[];
  expiresInHours?: number | null;
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
        { success: false, message: 'فقط مدیر مدرسه می‌تواند اطلاعیه را حذف کند' },
        { status: 403 }
      );
    }

    const announcementId = params.id;
    if (!announcementId || !ObjectId.isValid(announcementId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه اطلاعیه نامعتبر است' },
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

      const result = await db.collection('announcements').deleteOne({
        _id: new ObjectId(announcementId),
        schoolCode: decoded.schoolCode,
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'اطلاعیه مورد نظر یافت نشد' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'اطلاعیه حذف شد',
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در حذف اطلاعیه' },
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
        { success: false, message: 'فقط مدیر مدرسه می‌تواند اطلاعیه را ویرایش کند' },
        { status: 403 }
      );
    }

    const announcementId = params.id;
    if (!announcementId || !ObjectId.isValid(announcementId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه اطلاعیه نامعتبر است' },
        { status: 400 }
      );
    }

    const body: UpdateAnnouncementBody = await request.json();

    const updateFields: Record<string, unknown> = {};

    if (body.message !== undefined) {
      if (typeof body.message !== 'string' || body.message.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: 'متن اطلاعیه نامعتبر است' },
          { status: 400 }
        );
      }
      if (body.message.length > 200) {
        return NextResponse.json(
          { success: false, message: 'متن اطلاعیه حداکثر باید ۲۰۰ کاراکتر باشد' },
          { status: 400 }
        );
      }
      updateFields.message = body.message.trim();
    }

    if (body.icon !== undefined) {
      if (!VALID_ICONS.has(body.icon)) {
        return NextResponse.json(
          { success: false, message: 'آیکن انتخابی معتبر نیست' },
          { status: 400 }
        );
      }
      updateFields.icon = body.icon;
    }

    if (body.backgroundColor !== undefined) {
      if (typeof body.backgroundColor !== 'string' || !body.backgroundColor.trim()) {
        return NextResponse.json(
          { success: false, message: 'رنگ پس‌زمینه معتبر نیست' },
          { status: 400 }
        );
      }
      updateFields.backgroundColor = body.backgroundColor;
    }

    if (body.audienceType !== undefined) {
      if (!['all', 'class', 'teachers'].includes(body.audienceType)) {
        return NextResponse.json(
          { success: false, message: 'نوع مخاطب نامعتبر است' },
          { status: 400 }
        );
      }
      updateFields.audienceType = body.audienceType;
      if (body.audienceType === 'class') {
        if (!Array.isArray(body.classCodes) || body.classCodes.length === 0) {
          return NextResponse.json(
            { success: false, message: 'انتخاب حداقل یک کلاس ضروری است' },
            { status: 400 }
          );
        }
        updateFields.classCodes = body.classCodes;
      } else {
        updateFields.classCodes = [];
      }
    } else if (body.classCodes !== undefined) {
      updateFields.classCodes = Array.isArray(body.classCodes) ? body.classCodes : [];
    }

    if (body.expiresInHours !== undefined) {
      const now = new Date();
      if (body.expiresInHours === null) {
        updateFields.expiresAt = null;
      } else if (typeof body.expiresInHours === 'number' && body.expiresInHours > 0) {
        updateFields.expiresAt = new Date(now.getTime() + body.expiresInHours * 60 * 60 * 1000);
      } else {
        return NextResponse.json(
          { success: false, message: 'مدت زمان اعتبار نامعتبر است' },
          { status: 400 }
        );
      }
    }

    if (Object.keys(updateFields).length === 0) {
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

      const result = await db.collection('announcements').updateOne(
        {
          _id: new ObjectId(announcementId),
          schoolCode: decoded.schoolCode,
        },
        {
          $set: {
            ...updateFields,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'اطلاعیه مورد نظر یافت نشد' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'اطلاعیه با موفقیت به‌روزرسانی شد',
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در ویرایش اطلاعیه' },
      { status: 500 }
    );
  }
}

