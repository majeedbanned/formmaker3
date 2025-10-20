import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface DatabaseConfig {
  [domain: string]: {
    uri: string;
    dbName: string;
  };
}

interface JWTPayload {
  id: string;
  domain: string;
  userType: 'student' | 'teacher' | 'school';
  schoolCode: string;
  username: string;
  name: string;
  role: string;
  permissions: string[];
}

function getDatabaseConfig(): DatabaseConfig {
  try {
    const dbConfig = require('@/config/database.json');
    return dbConfig;
  } catch (error) {
    console.error('Error loading database config:', error);
    throw new Error('Database configuration not found');
  }
}

function getUserFromToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;

  try {
    // Get authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    const user = getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user is school admin
    if (user.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'Access denied - Only school admins can view this report' },
        { status: 403, headers: corsHeaders }
      );
    }

    console.log('Installation report request from school:', user.schoolCode, 'domain:', user.domain);

    // Get database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[user.domain];

    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'Database configuration not found for domain' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Connect to MongoDB
    client = new MongoClient(domainConfig.uri);
    await client.connect();
    const db = client.db(domainConfig.dbName);

    // Fetch all teachers for this school
    const teachersCollection = db.collection('teachers');
    const allTeachers = await teachersCollection
      .find({ 'data.schoolCode': user.schoolCode })
      .project({
        'data.teacherCode': 1,
        'data.teacherName': 1,
        'data.pushTokens': 1,
        'data.lastTokenUpdate': 1,
      })
      .toArray();

    console.log(`Found ${allTeachers.length} teachers in school ${user.schoolCode}`);

    // Fetch all students for this school
    const studentsCollection = db.collection('students');
    const allStudents = await studentsCollection
      .find({ 'data.schoolCode': user.schoolCode })
      .project({
        'data.studentCode': 1,
        'data.studentName': 1,
        'data.studentFamily': 1,
        'data.classCode': 1,
        'data.pushTokens': 1,
        'data.lastTokenUpdate': 1,
      })
      .toArray();

    console.log(`Found ${allStudents.length} students in school ${user.schoolCode}`);

    // Process teachers data
    const teachersWithApp = allTeachers
      .filter(t => t.data?.pushTokens && Array.isArray(t.data.pushTokens) && t.data.pushTokens.length > 0)
      .map(t => ({
        teacherCode: t.data.teacherCode,
        teacherName: t.data.teacherName,
        pushTokens: t.data.pushTokens,
        lastTokenUpdate: t.data.lastTokenUpdate,
      }));

    const teachersWithoutApp = allTeachers.filter(
      t => !t.data?.pushTokens || !Array.isArray(t.data.pushTokens) || t.data.pushTokens.length === 0
    );

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
      }));

    const studentsWithoutApp = allStudents.filter(
      s => !s.data?.pushTokens || !Array.isArray(s.data.pushTokens) || s.data.pushTokens.length === 0
    );

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

    console.log('Installation report stats:', {
      totalTeachers,
      teachersWithAppCount,
      teacherInstallationRate: teacherInstallationRate.toFixed(2) + '%',
      totalStudents,
      studentsWithAppCount,
      studentInstallationRate: studentInstallationRate.toFixed(2) + '%',
      overallInstallationRate: overallInstallationRate.toFixed(2) + '%',
    });

    // Prepare response
    const reportData = {
      totalTeachers,
      teachersWithApp: teachersWithAppCount,
      teachersWithoutApp: teachersWithoutApp.length,
      totalStudents,
      studentsWithApp: studentsWithAppCount,
      studentsWithoutApp: studentsWithoutApp.length,
      teachers: teachersWithApp,
      students: studentsWithApp,
      installationRate: {
        teachers: parseFloat(teacherInstallationRate.toFixed(1)),
        students: parseFloat(studentInstallationRate.toFixed(1)),
        overall: parseFloat(overallInstallationRate.toFixed(1)),
      },
    };

    return NextResponse.json({
      success: true,
      data: reportData,
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Error generating installation report:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate installation report',
        error: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

