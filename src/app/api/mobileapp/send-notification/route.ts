import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

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
}

// Extract user info from JWT token
const getUserFromToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

// Send push notification via Expo
async function sendExpoPushNotification(pushToken: string, title: string, body: string, data?: any) {
  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
      channelId: 'default',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Expo push response:', result);

    if (result.data && result.data[0]) {
      const ticket = result.data[0];
      if (ticket.status === 'error') {
        console.error('Push notification error:', ticket.message, ticket.details);
        return { success: false, error: ticket.message };
      }
      return { success: true, ticketId: ticket.id };
    }

    return { success: false, error: 'No response data' };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * POST /api/mobileapp/send-notification
 * Send push notification to specific user(s)
 * 
 * Body:
 * {
 *   targetUsers?: string[], // Array of user IDs to send to (optional)
 *   targetUserType?: 'student' | 'teacher', // Send to all users of this type (optional)
 *   targetClass?: string, // Send to all students in this class (optional)
 *   title: string,
 *   body: string,
 *   data?: object
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Send notification request received");

    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت یافت نشد' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // Only school admin can send notifications
    if (user.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'فقط ادمین مدرسه مجاز به ارسال اعلان است' },
        { status: 403 }
      );
    }

    console.log("Send notification request from:", user.userType, user.username);

    // Parse request body
    const body = await request.json();
    const { targetUsers, targetUserType, targetClass, title, body: messageBody, data } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, message: 'عنوان و متن پیام الزامی است' },
        { status: 400 }
      );
    }

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[user.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      let usersToNotify: any[] = [];

      // Find users based on target criteria
      if (targetUsers && targetUsers.length > 0) {
        // Send to specific users
        const studentsCollection = db.collection('students');
        const teachersCollection = db.collection('teachers');

        const students = await studentsCollection.find({
          'data.studentCode': { $in: targetUsers },
          'data.schoolCode': user.schoolCode,
          'data.pushTokens.0': { $exists: true }
        }).toArray();

        const teachers = await teachersCollection.find({
          'data.teacherCode': { $in: targetUsers },
          'data.schoolCode': user.schoolCode,
          'data.pushTokens.0': { $exists: true }
        }).toArray();

        usersToNotify = [...students, ...teachers];
      } else if (targetUserType) {
        // Send to all users of a type
        const collectionName = targetUserType === 'student' ? 'students' : 'teachers';
        const collection = db.collection(collectionName);

        usersToNotify = await collection.find({
          'data.schoolCode': user.schoolCode,
          'data.pushTokens.0': { $exists: true }
        }).toArray();
      } else if (targetClass) {
        // Send to all students in a class
        const studentsCollection = db.collection('students');
        
        usersToNotify = await studentsCollection.find({
          'data.schoolCode': user.schoolCode,
          'data.classCode': targetClass,
          'data.pushTokens.0': { $exists: true }
        }).toArray();
      } else {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'باید حداقل یک گروه هدف مشخص شود' },
          { status: 400 }
        );
      }

      console.log(`Found ${usersToNotify.length} users to notify`);

      // Send notifications
      const results = {
        total: 0,
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const userDoc of usersToNotify) {
        const pushTokens = userDoc.data?.pushTokens || [];
        const activeTokens = pushTokens.filter((t: any) => t.active);

        for (const tokenObj of activeTokens) {
          results.total++;
          
          const result = await sendExpoPushNotification(
            tokenObj.token,
            title,
            messageBody,
            data
          );

          if (result.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(result.error || 'Unknown error');
          }
        }
      }

      await client.close();

      return NextResponse.json({
        success: true,
        message: 'اعلان‌ها ارسال شد',
        results: {
          totalNotifications: results.total,
          successful: results.success,
          failed: results.failed,
          uniqueUsers: usersToNotify.length
        }
      });

    } catch (dbError) {
      await client.close();
      console.error("Database error:", dbError);
      return NextResponse.json(
        { success: false, message: 'خطای پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور' },
      { status: 500 }
    );
  }
}

