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
  iat?: number;
  exp?: number;
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

export async function POST(request: NextRequest) {
  try {
    console.log("Push token registration request received");

    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت یافت نشد' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    console.log("Push token request for user:", user.userType, user.username);

    // Parse request body
    const body = await request.json();
    const { pushToken, deviceInfo } = body;

    if (!pushToken) {
      return NextResponse.json(
        { success: false, message: 'توکن نوتیفیکیشن الزامی است' },
        { status: 400 }
      );
    }

    console.log("User from token:", user);

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    
    // Find database configuration for the domain
    const domainConfig = dbConfig[user.domain];
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    console.log("Using connection string for domain:", user.domain);

    // Connect to MongoDB using domain-specific connection string
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    console.log("Connected to database:", dbName);

    try {
      // Determine collection based on user type
      const collectionName = user.userType === 'student' ? 'students' : 'teachers';
      const collection = db.collection(collectionName);

      // Create device token object
      const deviceToken = {
        token: pushToken,
        deviceInfo: deviceInfo || {},
        registeredAt: new Date(),
        lastUpdated: new Date(),
        active: true
      };

      // Find user and update or add push token
      const userQuery = user.userType === 'student' 
        ? { 'data.studentCode': user.username, 'data.schoolCode': user.schoolCode }
        : { 'data.teacherCode': user.username, 'data.schoolCode': user.schoolCode };

      console.log("Looking for user with query:", JSON.stringify(userQuery));

      const foundUser = await collection.findOne(userQuery);

      if (!foundUser) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'کاربر یافت نشد' },
          { status: 404 }
        );
      }

      console.log("User found:", user.userType, user.username);

      // Check if token already exists
      const existingTokens = foundUser.data?.pushTokens || [];
      const tokenIndex = existingTokens.findIndex((t: any) => t.token === pushToken);

      if (tokenIndex >= 0) {
        // Update existing token
        console.log("Updating existing push token");
        existingTokens[tokenIndex] = {
          ...existingTokens[tokenIndex],
          ...deviceToken
        };
      } else {
        // Add new token
        console.log("Adding new push token");
        existingTokens.push(deviceToken);
      }

      // Update user document
      const updateResult = await collection.updateOne(
        userQuery,
        {
          $set: {
            'data.pushTokens': existingTokens,
            'data.lastTokenUpdate': new Date()
          }
        }
      );

      await client.close();

      if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
        console.log("Push token saved successfully");
        return NextResponse.json({
          success: true,
          message: 'توکن نوتیفیکیشن با موفقیت ثبت شد',
          tokenCount: existingTokens.length
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'خطا در ذخیره توکن نوتیفیکیشن'
        });
      }

    } catch (dbError) {
      await client.close();
      console.error("Database error:", dbError);
      return NextResponse.json(
        { success: false, message: 'خطای پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in push token registration:", error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve user's registered tokens
export async function GET(request: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت یافت نشد' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    console.log("Get push tokens request for user:", user.userType, user.username);

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    
    // Find database configuration for the domain
    const domainConfig = dbConfig[user.domain];
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    // Connect to MongoDB using domain-specific connection string
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    const collectionName = user.userType === 'student' ? 'students' : 'teachers';
    const collection = db.collection(collectionName);

    const userQuery = user.userType === 'student' 
      ? { 'data.studentCode': user.username, 'data.schoolCode': user.schoolCode }
      : { 'data.teacherCode': user.username, 'data.schoolCode': user.schoolCode };

    const foundUser = await collection.findOne(userQuery);
    await client.close();

    if (!foundUser) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tokens: foundUser.data?.pushTokens || []
    });

  } catch (error) {
    console.error("Error fetching push tokens:", error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور' },
      { status: 500 }
    );
  }
}

// Optional: DELETE endpoint to remove a token (e.g., on logout)
export async function DELETE(request: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت یافت نشد' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pushToken } = body;

    if (!pushToken) {
      return NextResponse.json(
        { success: false, message: 'توکن نوتیفیکیشن الزامی است' },
        { status: 400 }
      );
    }

    console.log("Delete push token request for user:", user.userType, user.username);

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    
    // Find database configuration for the domain
    const domainConfig = dbConfig[user.domain];
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    // Connect to MongoDB using domain-specific connection string
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    const collectionName = user.userType === 'student' ? 'students' : 'teachers';
    const collection = db.collection(collectionName);

    const userQuery = user.userType === 'student' 
      ? { 'data.studentCode': user.username, 'data.schoolCode': user.schoolCode }
      : { 'data.teacherCode': user.username, 'data.schoolCode': user.schoolCode };

    // Remove the token from the array
    const updateResult = await collection.updateOne(
      userQuery,
      {
        $pull: {
          'data.pushTokens': { token: pushToken } as any
        }
      } as any
    );

    await client.close();

    if (updateResult.modifiedCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'توکن نوتیفیکیشن حذف شد'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'توکن یافت نشد'
      });
    }

  } catch (error) {
    console.error("Error deleting push token:", error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور' },
      { status: 500 }
    );
  }
}

