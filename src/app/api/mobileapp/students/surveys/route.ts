import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

interface DatabaseConfig {
  [domain: string]: {
    schoolCode: string;
    connectionString: string;
    description: string;
  };
}

const getDatabaseConfig = (): DatabaseConfig => {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'database.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading database config:', error);
    return {} as DatabaseConfig;
  }
};

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
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    if (decoded.userType !== 'school' && decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'دسترسی مجاز نیست' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId || !ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه دانش‌آموز نامعتبر است' },
        { status: 400 }
      );
    }

    const dbConfig = getDatabaseConfig();
    const schoolConfig = dbConfig[decoded.domain];

    if (!schoolConfig) {
      return NextResponse.json(
        { success: false, message: 'تنظیمات پایگاه داده یافت نشد' },
        { status: 500 }
      );
    }

    const client = new MongoClient(schoolConfig.connectionString);
    await client.connect();

    try {
      const db = client.db();

      const student = await db.collection('students').findOne({
        _id: new ObjectId(studentId),
        'data.schoolCode': decoded.schoolCode,
      });

      if (!student) {
        return NextResponse.json(
          { success: false, message: 'دانش‌آموز یافت نشد' },
          { status: 404 }
        );
      }

      if (decoded.userType === 'teacher') {
        const studentClassCodes = student.data.classCode?.map((c: { value: string }) => c.value) || [];

        const teacher = await db.collection('teachers').findOne({
          'data.teacherCode': decoded.username,
          'data.schoolCode': decoded.schoolCode,
        });

        if (!teacher) {
          return NextResponse.json(
            { success: false, message: 'اطلاعات معلم یافت نشد' },
            { status: 403 }
          );
        }

        const teacherClassCodes = teacher.data.classCode?.map((c: { value: string }) => c.value) || [];
        const hasAccess = studentClassCodes.some((classCode: string) => teacherClassCodes.includes(classCode));

        if (!hasAccess) {
          return NextResponse.json(
            { success: false, message: 'دسترسی به این دانش‌آموز مجاز نیست' },
            { status: 403 }
          );
        }
      }

      const responderCandidates = new Set<string>();
      responderCandidates.add(student._id.toString());

      if (student.data?.studentCode) {
        responderCandidates.add(String(student.data.studentCode));
      }

      if (student.data?.username) {
        responderCandidates.add(String(student.data.username));
      }

      const responderConditions = Array.from(responderCandidates).map((candidate) => ({ responderId: candidate }));

      if (responderConditions.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            surveys: [],
            student: {
              id: student._id.toString(),
              name: `${student.data?.studentName || ''} ${student.data?.studentFamily || ''}`.trim(),
              code: student.data?.studentCode || '',
            },
            total: 0,
          },
        });
      }

      const surveyResponses = await db
        .collection('survey_responses')
        .find({
          schoolCode: decoded.schoolCode,
          $or: responderConditions,
        })
        .sort({ createdAt: -1 })
        .toArray();

      if (surveyResponses.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            surveys: [],
            student: {
              id: student._id.toString(),
              name: `${student.data?.studentName || ''} ${student.data?.studentFamily || ''}`.trim(),
              code: student.data?.studentCode || '',
            },
            total: 0,
          },
        });
      }

      const uniqueSurveyIds = Array.from(
        new Set(
          surveyResponses
            .map((response) => response.surveyId)
            .filter((id): id is ObjectId => id instanceof ObjectId)
        )
      );

      const surveys = await db
        .collection('surveys')
        .find({ _id: { $in: uniqueSurveyIds } })
        .toArray();

      const surveyMap = new Map<string, any>();
      surveys.forEach((surveyDoc) => {
        surveyMap.set(surveyDoc._id.toString(), surveyDoc);
      });

      const studentSurveys = surveyResponses.map((response) => {
        const surveyDoc = response.surveyId ? surveyMap.get(response.surveyId.toString()) : null;

        const questions = Array.isArray(surveyDoc?.questions) ? surveyDoc.questions : [];
        const classTargets = Array.isArray(surveyDoc?.classTargets) ? surveyDoc.classTargets : [];
        const teacherTargets = Array.isArray(surveyDoc?.teacherTargets) ? surveyDoc.teacherTargets : [];

        const formatDate = (value: unknown): string => {
          if (!value) return '';
          try {
            return new Date(value as string | number | Date).toISOString();
          } catch (error) {
            return '';
          }
        };

        return {
          _id: response._id.toString(),
          surveyId: response.surveyId instanceof ObjectId ? response.surveyId.toString() : String(response.surveyId || ''),
          title: surveyDoc?.title || `نظرسنجی ${response.surveyId?.toString().slice(-6) || ''}`,
          description: surveyDoc?.description || '',
          status: surveyDoc?.status || 'unknown',
          allowAnonymous: surveyDoc?.allowAnonymous ?? false,
          showResults: surveyDoc?.showResults ?? false,
          startDate: formatDate(surveyDoc?.startDate),
          endDate: formatDate(surveyDoc?.endDate),
          questions,
          classTargets,
          teacherTargets,
          answers: Array.isArray(response.responses) ? response.responses : [],
          responderType: response.responderType || 'unknown',
          responderName: response.responderName || '',
          createdAt: formatDate(response.createdAt),
          updatedAt: formatDate(response.updatedAt || response.createdAt),
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          surveys: studentSurveys,
          student: {
            id: student._id.toString(),
            name: `${student.data?.studentName || ''} ${student.data?.studentFamily || ''}`.trim(),
            code: student.data?.studentCode || '',
          },
          total: studentSurveys.length,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error fetching student surveys:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در دریافت نظرسنجی‌های دانش‌آموز' },
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

