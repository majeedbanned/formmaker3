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

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;

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

    // Check if user is school admin
    if (decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'دسترسی محدود - فقط مدیران مدرسه می‌توانند این گزارش را مشاهده کنند' },
        { status: 403 }
      );
    }

    // console.log('Installation report request from school:', decoded.schoolCode, 'domain:', decoded.domain);

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
    client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      // Fetch all teachers for this school
      const teachersCollection = db.collection('teachers');
      const allTeachers = await teachersCollection
        .find({ 'data.schoolCode': decoded.schoolCode })
        .project({
          'data.teacherCode': 1,
          'data.teacherName': 1,
          'data.pushTokens': 1,
          'data.lastTokenUpdate': 1,
        })
        .toArray();

      // console.log(`Found ${allTeachers.length} teachers in school ${decoded.schoolCode}`);

      // Fetch all students for this school
      const studentsCollection = db.collection('students');
      const allStudents = await studentsCollection
        .find({ 'data.schoolCode': decoded.schoolCode })
        .project({
          'data.studentCode': 1,
          'data.studentName': 1,
          'data.studentFamily': 1,
          'data.classCode': 1,
          'data.pushTokens': 1,
          'data.lastTokenUpdate': 1,
        })
        .toArray();

      // console.log(`Found ${allStudents.length} students in school ${decoded.schoolCode}`);

      // Process teachers data
      const teachersWithApp = allTeachers
        .filter(t => t.data?.pushTokens && Array.isArray(t.data.pushTokens) && t.data.pushTokens.length > 0)
        .map(t => ({
          teacherCode: t.data.teacherCode,
          teacherName: t.data.teacherName,
          pushTokens: t.data.pushTokens,
          lastTokenUpdate: t.data.lastTokenUpdate,
          hasApp: true,
        }))
        .sort((a, b) => {
          // Sort by latest installation (most recent first)
          const aDate = a.lastTokenUpdate ? new Date(a.lastTokenUpdate).getTime() : 0;
          const bDate = b.lastTokenUpdate ? new Date(b.lastTokenUpdate).getTime() : 0;
          return bDate - aDate;
        });

      const teachersWithoutApp = allTeachers
        .filter(t => !t.data?.pushTokens || !Array.isArray(t.data.pushTokens) || t.data.pushTokens.length === 0)
        .map(t => ({
          teacherCode: t.data.teacherCode,
          teacherName: t.data.teacherName,
          pushTokens: [],
          lastTokenUpdate: null,
          hasApp: false,
        }))
        .sort((a, b) => {
          // Sort alphabetically by name
          return (a.teacherName || '').localeCompare(b.teacherName || '', 'fa');
        });

      // Process students data
      const studentsWithApp = allStudents
        .filter(s => s.data?.pushTokens && Array.isArray(s.data.pushTokens) && s.data.pushTokens.length > 0)
        .map(s => ({
          studentCode: s.data.studentCode,
          studentName: s.data.studentName,
          studentFamily: s.data.studentFamily,
          classCode: s.data.classCode,
          pushTokens: s.data.pushTokens,
          lastTokenUpdate: s.data.lastTokenUpdate,
          hasApp: true,
        }))
        .sort((a, b) => {
          // Sort by latest installation (most recent first)
          const aDate = a.lastTokenUpdate ? new Date(a.lastTokenUpdate).getTime() : 0;
          const bDate = b.lastTokenUpdate ? new Date(b.lastTokenUpdate).getTime() : 0;
          return bDate - aDate;
        });

      const studentsWithoutApp = allStudents
        .filter(s => !s.data?.pushTokens || !Array.isArray(s.data.pushTokens) || s.data.pushTokens.length === 0)
        .map(s => ({
          studentCode: s.data.studentCode,
          studentName: s.data.studentName,
          studentFamily: s.data.studentFamily,
          classCode: s.data.classCode,
          pushTokens: [],
          lastTokenUpdate: null,
          hasApp: false,
        }))
        .sort((a, b) => {
          // Sort alphabetically by full name
          const aName = `${a.studentName || ''} ${a.studentFamily || ''}`.trim();
          const bName = `${b.studentName || ''} ${b.studentFamily || ''}`.trim();
          return aName.localeCompare(bName, 'fa');
        });

      // Calculate statistics
      const totalTeachers = allTeachers.length;
      const totalStudents = allStudents.length;
      const teachersWithAppCount = teachersWithApp.length;
      const studentsWithAppCount = studentsWithApp.length;
      const totalUsers = totalTeachers + totalStudents;
      const totalWithApp = teachersWithAppCount + studentsWithAppCount;

      const teacherInstallationRate = totalTeachers > 0 ? (teachersWithAppCount / totalTeachers) * 100 : 0;
      const studentInstallationRate = totalStudents > 0 ? (studentsWithAppCount / totalStudents) * 100 : 0;
      const overallInstallationRate = totalUsers > 0 ? (totalWithApp / totalUsers) * 100 : 0;

      // console.log('Installation report stats:', {
      //   totalTeachers,
      //   teachersWithAppCount,
      //   teacherInstallationRate: teacherInstallationRate.toFixed(2) + '%',
      //   totalStudents,
      //   studentsWithAppCount,
      //   studentInstallationRate: studentInstallationRate.toFixed(2) + '%',
      //   overallInstallationRate: overallInstallationRate.toFixed(2) + '%',
      // });

      // Combine teachers (installed first, then not installed)
      const allTeachersData = [...teachersWithApp, ...teachersWithoutApp];
      
      // Combine students (installed first, then not installed)
      const allStudentsData = [...studentsWithApp, ...studentsWithoutApp];

      // Prepare response
      const reportData = {
        totalTeachers,
        teachersWithApp: teachersWithAppCount,
        teachersWithoutApp: teachersWithoutApp.length,
        totalStudents,
        studentsWithApp: studentsWithAppCount,
        studentsWithoutApp: studentsWithoutApp.length,
        teachers: allTeachersData,
        students: allStudentsData,
        installationRate: {
          teachers: parseFloat(teacherInstallationRate.toFixed(1)),
          students: parseFloat(studentInstallationRate.toFixed(1)),
          overall: parseFloat(overallInstallationRate.toFixed(1)),
        },
      };

      return NextResponse.json({
        success: true,
        data: reportData,
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'خطا در دریافت اطلاعات از پایگاه داده' },
        { status: 500 }
      );
    } finally {
      if (client) {
        await client.close();
      }
    }

  } catch (error: any) {
    console.error('Error generating installation report:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'خطای سرور داخلی',
        error: error.message,
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
