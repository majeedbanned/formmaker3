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
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

interface LoginRequest {
  role: 'student' | 'teacher' | 'school';
  domain: string;
  schoolCode: string;
  userCode: string; // studentCode or teacherCode or username
  password: string;
}

interface AuthenticatedUser {
  id: string;
  domain: string;
  userType: string;
  schoolCode: string;
  username: string;
  name: string;
  role: string;
  permissions: any[];
  classCode?: { label: string; value: string }[];
  groups?: { label: string; value: string }[];
  maghta?: string;
}

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
export async function Get(request: NextRequest) {
    return NextResponse.json({ message: 'Hello, world!' });
}


// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { role, domain, schoolCode, userCode, password } = body;

    // Validate required fields
    if (!role || !domain || !schoolCode || !userCode || !password) {
      return NextResponse.json(
        { success: false, message: 'همه فیلدها الزامی هستند' },
        { status: 400, headers: corsHeaders }
      );
    }
    console.log("role", role);
    console.log("domain", domain);
    console.log("schoolCode", schoolCode);
    console.log("userCode", userCode);
    console.log("password", password);

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    
    // Find database configuration for the domain
    const domainConfig = dbConfig[domain];
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify school code matches the domain configuration
    if (domainConfig.schoolCode !== schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("Using connection string for domain:", domain);
    console.log("Connection string:", domainConfig.connectionString);

    // Connect to MongoDB using domain-specific connection string
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    let user: any = null;
    let authenticatedUser: AuthenticatedUser | null = null;

    try {
      switch (role) {
        case 'student':
          // Find student by studentCode, schoolCode and password
          user = await db.collection('students').findOne({
            'data.studentCode': userCode,
            'data.schoolCode': schoolCode,
            'data.password': password,
            'data.isActive': true
          });

          if (user) {
            authenticatedUser = {
              id: user._id.toString(),
              domain,
              userType: 'student',
              schoolCode: user.data.schoolCode,
              username: user.data.studentCode,
              name: `${user.data.studentName} ${user.data.studentFamily}`,
              role: 'student',
              permissions: user.data.premisions || [],
              classCode: user.data.classCode ? [{ label: user.data.classCode, value: user.data.classCode }] : [],
              groups: [{ label: 'گروه دانش آموزی', value: '1' }],
              maghta: user.data.maghta || '3'
            };
          }
          break;

        case 'teacher':
          // Find teacher by teacherCode, schoolCode and password
          user = await db.collection('teachers').findOne({
            'data.teacherCode': userCode,
            'data.schoolCode': schoolCode,
            'data.password': password,
            'data.isActive': true
          });

          if (user) {
            authenticatedUser = {
              id: user._id.toString(),
              domain,
              userType: 'teacher',
              schoolCode: user.data.schoolCode,
              username: user.data.teacherCode,
              name: user.data.teacherName,
              role: 'teacher',
              permissions: user.data.premisions || [],
              groups: [{ label: 'گروه معلم', value: '2' }]
            };
          }
          break;

        case 'school':
          // Find school by username (or schoolCode), schoolCode and password
          user = await db.collection('schools').findOne({
            $or: [
              { 'data.username': userCode },
              { 'data.schoolCode': userCode }
            ],
            'data.schoolCode': schoolCode,
            'data.password': password,
            'data.isActive': true,
            'data.domain': domain
          });

          if (user) {
            authenticatedUser = {
              id: user._id.toString(),
              domain: user.data.domain,
              userType: 'school',
              schoolCode: user.data.schoolCode,
              username: user.data.username,
              name: user.data.schoolName,
              role: 'school',
              permissions: user.data.premisions || [],
              maghta: user.data.maghta
            };
          }
          break;

        default:
          await client.close();
          return NextResponse.json(
            { success: false, message: 'نقش کاربری نامعتبر است' },
            { status: 400, headers: corsHeaders }
          );
      }

      await client.close();

      if (!authenticatedUser) {
        return NextResponse.json(
          { success: false, message: 'اطلاعات ورود نامعتبر است' },
          { status: 401, headers: corsHeaders }
        );
      }

      // Generate JWT token
      const jwtPayload: JWTPayload = {
        userId: authenticatedUser.id,
        domain: authenticatedUser.domain,
        schoolCode: authenticatedUser.schoolCode,
        role: authenticatedUser.role,
        userType: authenticatedUser.userType,
        username: authenticatedUser.username,
      };

      const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // Return successful authentication with JWT token
      return NextResponse.json({
        success: true,
        message: 'ورود موفق',
        token,
        user: authenticatedUser
      }, { headers: corsHeaders });

    } catch (dbError) {
      await client.close();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
