import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// GET - Fetch all online classes for the current user
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401, headers: corsHeaders }
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
        { status: 401, headers: corsHeaders }
      );
    }

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      console.log('[OnlineClasses] Domain not found:', decoded.domain);
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      const classesCollection = db.collection('skyroomclasses');

      // Build query based on user type
      let query: any = {
        'data.schoolCode': decoded.schoolCode,
      };

      const userType = decoded.userType || decoded.role;
      console.log('[OnlineClasses] User type:', userType, 'School code:', decoded.schoolCode);

      if (userType === 'teacher') {
        query.$or = [
          { 'data.selectedTeachers': decoded.userId },
        ];
      } else if (userType === 'student') {
        // Get student's class codes
        const studentsCollection = db.collection('students');
        const student = await studentsCollection.findOne({
          _id: new ObjectId(decoded.userId),
          'data.schoolCode': decoded.schoolCode,
        });

        // Normalize student's class codes
        let studentClassCodes: string[] = [];
        const rawClassCode = student?.data?.classCode;

        if (Array.isArray(rawClassCode)) {
          studentClassCodes = rawClassCode
            .map((item: any) => {
              if (typeof item === 'string') return item;
              if (item && typeof item.value === 'string') return item.value;
              return null;
            })
            .filter((v: string | null): v is string => !!v);
        } else if (typeof rawClassCode === 'string') {
          studentClassCodes = [rawClassCode];
        }

        query.$or = [
          { 'data.selectedStudents': decoded.userId },
          { 'data.selectedClasses': { $in: studentClassCodes } },
        ];
      }
      // School user: see all classes in this school (no additional filter)

      console.log('[OnlineClasses] Query:', JSON.stringify(query));

      // Find all classes for this user
      const classes = await classesCollection.find(query).toArray();
      console.log('[OnlineClasses] Found classes count:', classes.length);

      // Map classes to response format (return ALL classes with their schedule slots)
      const resultClasses = classes.map((cls) => {
        const data: any = cls.data || {};
        const scheduleSlots = Array.isArray(data.scheduleSlots) ? data.scheduleSlots : [];
        const duration = typeof data.duration === 'number' ? data.duration : 
                        typeof data.duration === 'string' ? parseInt(data.duration) || 60 : 60;

        return {
          _id: cls._id.toString(),
          className: data.className || 'بدون نام',
          classDescription: data.classDescription,
          maxUsers: typeof data.maxUsers === 'number' ? data.maxUsers : 
                   typeof data.maxUsers === 'string' ? parseInt(data.maxUsers) || 50 : 50,
          classType: data.classType || 'skyroom',
          skyroomRoomId: data.skyroomRoomId,
          googleMeetLink: data.googleMeetLink,
          adobeConnectUrl: data.adobeConnectUrl,
          adobeConnectScoId: data.adobeConnectScoId,
          bbbMeetingID: data.bbbMeetingID,
          bbbMeetingName: data.bbbMeetingName,
          scheduleSlots: scheduleSlots.map((slot: any) => ({
            day: slot.day?.toLowerCase() || '',
            startTime: slot.startTime || '',
            endTime: slot.endTime || '',
          })),
          duration,
        };
      });

      await client.close();

      console.log('[OnlineClasses] Returning classes:', resultClasses.length);

      return NextResponse.json({
        success: true,
        data: {
          classes: resultClasses,
          userType: userType,
        },
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
    console.error('Online classes API error:', error);
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
