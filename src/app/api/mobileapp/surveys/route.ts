import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

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

interface DatabaseConfigEntry {
  schoolCode: string;
  connectionString: string;
  description?: string;
}

interface DatabaseConfig {
  [domain: string]: DatabaseConfigEntry;
}

const getDatabaseConfig = (): DatabaseConfig => {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'database.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading database config:', error);
    return {};
  }
};

const getDatabaseClient = async (connectionString: string) => {
  const client = new MongoClient(connectionString);
  await client.connect();
  const dbName = connectionString.split('/')[3].split('?')[0];
  const db = client.db(dbName);
  return { client, db };
};

const getStudentClassCodes = async (db: any, schoolCode: string, studentCode: string): Promise<string[]> => {
  const studentDoc = await db.collection('students').findOne({
    'data.schoolCode': schoolCode,
    'data.studentCode': studentCode,
  });

  if (!studentDoc?.data?.classCode || !Array.isArray(studentDoc.data.classCode)) {
    return [];
  }

  return studentDoc.data.classCode
    .filter((item: any) => item && typeof item === 'object' && item.value)
    .map((item: any) => item.value);
};

const mapSurvey = (
  survey: any,
  participation: { hasParticipated: boolean; isWithinDateRange: boolean; canParticipate: boolean }
) => ({
  id: survey._id.toString(),
  title: survey.title,
  description: survey.description || '',
  status: survey.status,
  startDate: survey.startDate ? survey.startDate.toISOString?.() ?? survey.startDate : null,
  endDate: survey.endDate ? survey.endDate.toISOString?.() ?? survey.endDate : null,
  allowAnonymous: !!survey.allowAnonymous,
  showResults: !!survey.showResults,
  questionsCount: Array.isArray(survey.questions) ? survey.questions.length : 0,
  responseCount: survey.responseCount ?? 0,
  classTargets: survey.classTargets ?? [],
  hasParticipated: participation.hasParticipated,
  isWithinDateRange: participation.isWithinDateRange,
  canParticipate: participation.canParticipate,
});

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
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

    if (decoded.userType !== 'student') {
      return NextResponse.json(
        { success: false, message: 'این سرویس فقط برای دانش‌آموزان در دسترس است' },
        { status: 403 }
      );
    }

    const dbConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];

    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'پیکربندی مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    if (domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400 }
      );
    }

    const { client, db } = await getDatabaseClient(domainConfig.connectionString);

    try {
      const studentClasses = await getStudentClassCodes(db, decoded.schoolCode, decoded.username);

      if (studentClasses.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            surveys: [],
          },
        });
      }

      const now = new Date();
      const baseFilter: Record<string, unknown> = {
        schoolCode: decoded.schoolCode,
        status: 'active',
        $or: [
          { classTargets: { $in: studentClasses } },
          { teacherTargets: { $in: [decoded.username] } },
        ],
      };

      const surveys = await db.collection('surveys').find(baseFilter).sort({ createdAt: -1 }).toArray();

      if (!surveys.length) {
        return NextResponse.json({
          success: true,
          data: {
            surveys: [],
          },
        });
      }

      const surveyIds = surveys.map((survey: any) => survey._id);
      const userResponses = await db
        .collection('survey_responses')
        .find({
          surveyId: { $in: surveyIds },
          responderId: decoded.userId,
        })
        .project({ surveyId: 1 })
        .toArray();

      const respondedSurveyIds = new Set(userResponses.map((response: any) => response.surveyId.toString()));

      const formattedSurveys = surveys.map((survey: any) => {
        const hasParticipated = respondedSurveyIds.has(survey._id.toString());
        const startDate = survey.startDate ? new Date(survey.startDate) : null;
        const endDate = survey.endDate ? new Date(survey.endDate) : null;

        const isWithinDateRange =
          (!startDate || now >= startDate) &&
          (!endDate || now <= endDate);

        const canParticipate = !hasParticipated && isWithinDateRange && survey.status === 'active';

        return mapSurvey(survey, { hasParticipated, isWithinDateRange, canParticipate });
      });

      return NextResponse.json({
        success: true,
        data: {
          surveys: formattedSurveys,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error fetching mobile surveys:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت نظرسنجی‌ها' },
      { status: 500 }
    );
  }
}

