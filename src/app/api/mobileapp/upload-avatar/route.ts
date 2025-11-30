import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { mkdir, writeFile } from 'fs/promises';

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

    // Only allow students and teachers to upload their own avatar
    if (!['student', 'teacher'].includes(decoded.userType)) {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیر مجاز' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'فایلی انتخاب نشده است' },
        { status: 400 }
      );
    }

    // Verify user is uploading their own avatar
    if (!userId || userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'شما فقط می‌توانید تصویر خود را تغییر دهید' },
        { status: 403 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'فایل باید یک تصویر باشد' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'حجم فایل نباید بیشتر از ۵ مگابایت باشد' },
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
      // Determine collection based on user type
      const collectionName = decoded.userType === 'student' ? 'students' : 'teachers';
      const collection = db.collection(collectionName);

      // Find user by ID
      const user = await collection.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'کاربر یافت نشد' },
          { status: 404 }
        );
      }

      // Verify user belongs to the correct school
      const userSchoolCode = user.data?.schoolCode;
      if (userSchoolCode !== decoded.schoolCode) {
        return NextResponse.json(
          { success: false, message: 'کاربر به مدرسه شما تعلق ندارد' },
          { status: 403 }
        );
      }

      // Generate unique filename (matching teacher-profile pattern)
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const filename = `avatar_${timestamp}_${randomString}.${fileExtension}`;

      // Create upload directory (matching teacher-profile: public/uploads/avatars)
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore error
      }

      // Save file to disk
      const filePath = path.join(uploadDir, filename);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Prepare avatar object (matching teacher-profile and student update-profile structure)
      // Note: uploadedAt can be Date object or ISO string - both are accepted
      const avatarData = {
        filename: filename,
        originalName: file.name,
        path: `/uploads/avatars/${filename}`, // Matching /api/upload/avatars pattern
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(), // ISO string format (matches /api/upload/avatars)
      };

      // Update user record with new avatar
      const updateResult = await collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            'data.avatar': avatarData,
            updatedAt: new Date(),
          },
        }
      );

      if (updateResult.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'خطا در به‌روزرسانی تصویر' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'تصویر با موفقیت آپلود شد',
        avatar: avatarData,
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

