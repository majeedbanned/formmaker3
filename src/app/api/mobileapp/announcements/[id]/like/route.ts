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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

      // Find the announcement
      const announcement = await db.collection('announcements').findOne({
        _id: new ObjectId(announcementId),
        schoolCode: decoded.schoolCode,
      });

      if (!announcement) {
        return NextResponse.json(
          { success: false, message: 'اطلاعیه مورد نظر یافت نشد' },
          { status: 404 }
        );
      }

      // Get current likes array or initialize it
      const currentLikes = Array.isArray(announcement.likes) ? announcement.likes : [];
      const isLiked = currentLikes.includes(decoded.userId);

      let updatedLikes: string[];
      if (isLiked) {
        // Unlike: remove user ID from likes array
        updatedLikes = currentLikes.filter((userId: string) => userId !== decoded.userId);
      } else {
        // Like: add user ID to likes array
        updatedLikes = [...currentLikes, decoded.userId];
      }

      // Update the announcement
      await db.collection('announcements').updateOne(
        {
          _id: new ObjectId(announcementId),
          schoolCode: decoded.schoolCode,
        },
        {
          $set: {
            likes: updatedLikes,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        data: {
          isLiked: !isLiked,
          likeCount: updatedLikes.length,
        },
        message: isLiked ? 'لایک حذف شد' : 'لایک ثبت شد',
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در ثبت لایک' },
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


