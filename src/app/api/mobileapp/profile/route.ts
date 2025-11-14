import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
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
      const collectionName =
        decoded.userType === 'student'
          ? 'students'
          : decoded.userType === 'teacher'
          ? 'teachers'
          : 'schools';
      const collection = db.collection(collectionName);

      // Find user by ID
      const user = await collection.findOne({
        _id: new ObjectId(decoded.userId),
        'data.schoolCode': decoded.schoolCode,
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'کاربر یافت نشد' },
          { status: 404 }
        );
      }

      // Prepare response based on user type
      let profileData: any = {
        id: user._id.toString(),
        username: decoded.username,
        schoolCode: decoded.schoolCode,
        domain: decoded.domain,
        userType: decoded.userType,
        role: decoded.role,
        avatar: user.data?.avatar || null,
      };

      if (decoded.userType === 'student') {
        profileData = {
          ...profileData,
          name: `${user.data?.studentName || ''} ${user.data?.studentFamily || ''}`.trim(),
          studentCode: user.data?.studentCode || '',
          studentName: user.data?.studentName || '',
          studentFamily: user.data?.studentFamily || '',
          classCode: user.data?.classCode || [],
          groups: user.data?.groups || [],
          maghta: user.data?.maghta || '',
        };
      } else if (decoded.userType === 'teacher') {
        profileData = {
          ...profileData,
          name: user.data?.teacherName || '',
          teacherCode: user.data?.teacherCode || '',
          teacherName: user.data?.teacherName || '',
        };
      } else if (decoded.userType === 'school') {
        profileData = {
          ...profileData,
          name: user.data?.schoolName || '',
          schoolName: user.data?.schoolName || '',
        };
      }

      return NextResponse.json({
        success: true,
        data: profileData,
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
      { status: 500 }
    );
  }
}

