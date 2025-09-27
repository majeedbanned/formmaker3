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

interface Message {
  _id: string;
  data: {
    mailId: string;
    sendername: string;
    sendercode: string;
    title: string;
    persiandate: string;
    message: string;
    receivercode: string;
    files: string[];
    isRead: boolean;
    readTime?: string;
    readPersianDate?: string;
    isFavorite?: boolean;
    createdAt: string;
  };
}

interface MessagesResponse {
  success: boolean;
  message?: string;
  data?: {
    messages: Message[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const searchQuery = url.searchParams.get('search') || '';
    const readFilter = url.searchParams.get('read') || 'all'; // all, read, unread
    const starredFilter = url.searchParams.get('starred') || 'all'; // all, starred

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
      // Calculate pagination values
      const skip = (page - 1) * limit;

      // Build query filter
      let filter: any = { 'data.receivercode': decoded.username };

      // Apply search filter
      if (searchQuery.trim()) {
        filter.$or = [
          { 'data.title': { $regex: searchQuery, $options: 'i' } },
          { 'data.message': { $regex: searchQuery, $options: 'i' } },
          { 'data.sendername': { $regex: searchQuery, $options: 'i' } },
        ];
      }

      // Apply read status filter
      if (readFilter === 'read') {
        filter['data.isRead'] = true;
      } else if (readFilter === 'unread') {
        filter['data.isRead'] = false;
      }

      // Apply starred filter
      if (starredFilter === 'starred') {
        filter['data.isFavorite'] = true;
      }

      // Query messages
      const messages = await db.collection('messagelist')
        .find(filter)
        .sort({ 'data.createdAt': -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Get total count for pagination
      const totalCount = await db.collection('messagelist').countDocuments(filter);

      await client.close();

      return NextResponse.json({
        success: true,
        data: {
          messages: messages,
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit)
          }
        }
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
    console.error('Messages inbox API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}


