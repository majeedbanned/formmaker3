import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "شناسه دانش‌آموز نامعتبر است" },
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
      const student = await db.collection("students").findOne({
        _id: new ObjectId(id),
        'data.schoolCode': decoded.schoolCode,
      });

      if (!student) {
        await client.close();
        return NextResponse.json(
          { success: false, message: "دانش‌آموز یافت نشد" },
          { status: 404 }
        );
      }

      // Transform the data
      // Check if student has installed the app by checking pushTokens
      const pushTokens = student.data?.pushTokens || [];
      const activeTokens = pushTokens.filter((token: any) => token.active === true);
      const hasInstalledApp = activeTokens.length > 0;
      
      const transformedStudent = {
        id: student._id.toString(),
        studentCode: student.data?.studentCode || "",
        studentName: student.data?.studentName || "",
        studentFamily: student.data?.studentFamily || "",
        phone: student.data?.phone || "",
        codemelli: student.data?.codemelli || "",
        birthDate: student.data?.birthDate || "",
        birthplace: student.data?.birthplace || student.data?.["birthplace "] || "",
        IDserial: student.data?.IDserial || "",
        address: student.data?.address || "",
        postalcode: student.data?.postalcode || "",
        schoolCode: student.data?.schoolCode || "",
        classCode: student.data?.classCode || [],
        groups: student.data?.groups || [],
        infos: student.data?.infos || [],
        isActive: student.data?.isActive ?? true,
        avatar: student.data?.avatar || null,
        phones: student.data?.phones || [],
        fatherEducation: student.data?.fatherEducation || "",
        fatherJob: student.data?.fatherJob || "",
        fatherWorkPlace: student.data?.fatherWorkPlace || "",
        motherEducation: student.data?.motherEducation || "",
        motherJob: student.data?.motherJob || "",
        createdAt: student.createdAt || "",
        updatedAt: student.updatedAt || student.data?.updatedAt || "",
        updatedBy: student.data?.updatedBy || "",
        hasInstalledApp,
        appInstallInfo: {
          installed: hasInstalledApp,
          devicesCount: activeTokens.length,
          lastTokenUpdate: student.data?.lastTokenUpdate ? new Date(student.data.lastTokenUpdate).toISOString() : "",
          devices: activeTokens.map((token: any) => ({
            deviceName: token.deviceInfo?.deviceName || "Unknown",
            deviceType: token.deviceInfo?.deviceType || "Unknown",
            platform: token.deviceInfo?.platform || "Unknown",
            osName: token.deviceInfo?.osName || "",
            osVersion: token.deviceInfo?.osVersion || "",
            brand: token.deviceInfo?.brand || "",
            modelName: token.deviceInfo?.modelName || "",
            lastUpdated: token.lastUpdated ? new Date(token.lastUpdated).toISOString() : "",
            registeredAt: token.registeredAt ? new Date(token.registeredAt).toISOString() : "",
          }))
        }
      };

      await client.close();

      return NextResponse.json({
        success: true,
        data: transformedStudent,
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
    console.error("Error fetching student details:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "خطا در دریافت اطلاعات دانش‌آموز",
        error: error instanceof Error ? error.message : "Unknown error"
      },
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
