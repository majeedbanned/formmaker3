import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Load database configuration
const getDatabaseConfig = () => {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'database.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading database config:', error);
    return {};
  }
};

interface DatabaseConfig {
  [domain: string]: {
    schoolCode: string;
    connectionString: string;
    description: string;
  };
}

// JWT Configuration
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
    console.log('Change password request received');

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'رمز عبور فعلی و جدید الزامی است' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: 'رمز عبور جدید نمی‌تواند با رمز عبور فعلی یکسان باشد' },
        { status: 400 }
      );
    }

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    // Verify school code matches
    if (domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      // Determine collection based on user role
      let collectionName: string;
      let userCodeField: string;

      switch (decoded.userType) {
        case 'school':
          collectionName = 'schools';
          userCodeField = 'data.schoolCode';
          break;
        case 'teacher':
          collectionName = 'teachers';
          userCodeField = 'data.teacherCode';
          break;
        case 'student':
          collectionName = 'students';
          userCodeField = 'data.studentCode';
          break;
        default:
          await client.close();
          return NextResponse.json(
            { success: false, message: 'نوع کاربری نامعتبر است' },
            { status: 400 }
          );
      }

      // Find user and verify current password
      const user = await db.collection(collectionName).findOne({
        [userCodeField]: decoded.username,
        'data.schoolCode': decoded.schoolCode,
      });

      if (!user) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'کاربر یافت نشد' },
          { status: 404 }
        );
      }

      // Check if current password matches
      if (user.data.password !== currentPassword) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'رمز عبور فعلی اشتباه است' },
          { status: 400 }
        );
      }

      // Update password
      const updateResult = await db.collection(collectionName).updateOne(
        {
          [userCodeField]: decoded.username,
          'data.schoolCode': decoded.schoolCode,
        },
        {
          $set: {
            'data.password': newPassword,
            'data.updatedAt': new Date(),
            'data.updatedBy': decoded.username,
          },
        }
      );

      await client.close();

      if (updateResult.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'خطا در به‌روزرسانی رمز عبور' },
          { status: 500 }
        );
      }

      console.log(`Password changed successfully for ${decoded.userType}: ${decoded.username}`);

      return NextResponse.json({
        success: true,
        message: 'رمز عبور با موفقیت تغییر کرد',
      });

    } catch (dbError) {
      await client.close();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Change password API error:', error);
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

