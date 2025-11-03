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

// Default templates
const DEFAULT_TEMPLATES = [
  { id: "1", title: "حضور به موقع", content: "با سلام، لطفا به موقع در مدرسه حضور پیدا کنید.", isDefault: true },
  { id: "2", title: "یادآوری امتحان", content: "عزیز، یادآوری می‌شود که فردا امتحان دارید.", isDefault: true },
  { id: "3", title: "مشاوره", content: "لطفا جهت مشاوره با دفتر مدرسه تماس بگیرید.", isDefault: true },
  { id: "4", title: "جلسه والدین", content: "والدین گرامی، حضور شما در جلسه فردا ضروری است.", isDefault: true },
];

// GET - Fetch templates
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

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      // Fetch custom templates for this school
      const customTemplates = await db.collection('smstemplates')
        .find({ schoolCode: decoded.schoolCode })
        .sort({ createdAt: -1 })
        .toArray();

      await client.close();

      // Transform templates
      const transformedCustomTemplates = customTemplates.map(template => ({
        id: template._id.toString(),
        title: template.title,
        content: template.content,
        isDefault: false,
        createdBy: template.createdBy,
        createdAt: template.createdAt,
      }));

      return NextResponse.json({
        success: true,
        data: {
          defaultTemplates: DEFAULT_TEMPLATES,
          customTemplates: transformedCustomTemplates,
          allTemplates: [...DEFAULT_TEMPLATES, ...transformedCustomTemplates],
        },
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
    console.error('SMS templates GET API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
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

    // Only teachers and school admins can create templates
    if (decoded.userType !== 'teacher' && decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'شما مجاز به ایجاد قالب نیستید' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, content } = body;

    // Validate input
    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'عنوان قالب الزامی است' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, message: 'محتوای قالب الزامی است' },
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

    // Connect to MongoDB
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      const now = new Date();
      
      // Create template document
      const templateDoc = {
        title: title.trim(),
        content: content.trim(),
        schoolCode: decoded.schoolCode,
        createdBy: decoded.username,
        userType: decoded.userType,
        createdAt: now,
        updatedAt: now,
      };

      const result = await db.collection('smstemplates').insertOne(templateDoc);

      await client.close();

      return NextResponse.json({
        success: true,
        message: 'قالب با موفقیت ایجاد شد',
        data: {
          id: result.insertedId.toString(),
          ...templateDoc,
        },
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
    console.error('SMS templates POST API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

