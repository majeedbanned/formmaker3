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

const normalizeSurveyQuestion = (question: any, index: number) => ({
  id: question.id ?? index.toString(),
  text: question.text,
  type: question.type,
  required: !!question.required,
  options: question.options ?? [],
  maxRating: question.maxRating ?? 5,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const surveyId = params.id;
    if (!surveyId || !ObjectId.isValid(surveyId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه نظرسنجی نامعتبر است' },
        { status: 400 }
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
      const survey = await db.collection('surveys').findOne({
        _id: new ObjectId(surveyId),
        schoolCode: decoded.schoolCode,
        status: 'active',
      });

      if (!survey) {
        return NextResponse.json(
          { success: false, message: 'نظرسنجی یافت نشد یا فعال نیست' },
          { status: 404 }
        );
      }

      const studentClasses = await getStudentClassCodes(db, decoded.schoolCode, decoded.username);
      const hasClassAccess =
        !Array.isArray(survey.classTargets) ||
        survey.classTargets.length === 0 ||
        survey.classTargets.some((target: string) => studentClasses.includes(target));

      const hasDirectAccess =
        Array.isArray(survey.teacherTargets) &&
        survey.teacherTargets.includes(decoded.username);

      if (!hasClassAccess && !hasDirectAccess) {
        return NextResponse.json(
          { success: false, message: 'دسترسی به این نظرسنجی برای شما مجاز نیست' },
          { status: 403 }
        );
      }

      const now = new Date();
      const startDate = survey.startDate ? new Date(survey.startDate) : null;
      const endDate = survey.endDate ? new Date(survey.endDate) : null;

      const isWithinDateRange =
        (!startDate || now >= startDate) &&
        (!endDate || now <= endDate);

      const existingResponse = !survey.allowAnonymous
        ? await db.collection('survey_responses').findOne({
            surveyId: new ObjectId(surveyId),
            responderId: decoded.userId,
          })
        : null;

      const hasParticipated = !!existingResponse;
      const canParticipate = isWithinDateRange && survey.status === 'active' && !hasParticipated;

      const formattedSurvey = {
        id: survey._id.toString(),
        title: survey.title,
        description: survey.description || '',
        status: survey.status,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        allowAnonymous: !!survey.allowAnonymous,
        showResults: !!survey.showResults,
        responseCount: survey.responseCount ?? 0,
        questions: Array.isArray(survey.questions)
          ? survey.questions.map((question: any, index: number) =>
              normalizeSurveyQuestion(question, index)
            )
          : [],
      };

      return NextResponse.json({
        success: true,
        data: {
          survey: formattedSurvey,
          meta: {
            hasParticipated,
            canParticipate,
            isWithinDateRange,
            allowMultipleSubmissions: !!survey.allowAnonymous,
          },
          existingResponse: existingResponse
            ? {
                id: existingResponse._id.toString(),
                submittedAt: existingResponse.createdAt?.toISOString?.() ?? existingResponse.createdAt,
                answers: existingResponse.responses ?? [],
              }
            : null,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error fetching mobile survey detail:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات نظرسنجی' },
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


