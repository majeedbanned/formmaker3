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
  name?: string;
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

const getStudentRecord = async (db: any, schoolCode: string, studentCode: string) => {
  return db.collection('students').findOne({
    'data.schoolCode': schoolCode,
    'data.studentCode': studentCode,
  });
};

const getStudentClassCodes = (studentDoc: any): string[] => {
  if (!studentDoc?.data?.classCode || !Array.isArray(studentDoc.data.classCode)) {
    return [];
  }

  return studentDoc.data.classCode
    .filter((item: any) => item && typeof item === 'object' && item.value)
    .map((item: any) => item.value);
};

const sanitizeAnswer = (question: any, answer: unknown) => {
  switch (question.type) {
    case 'text': {
      if (answer === null || answer === undefined) return '';
      const textAnswer = String(answer).trim();
      if (question.required && textAnswer.length === 0) {
        throw new Error('پاسخ این سوال الزامی است');
      }
      return textAnswer;
    }
    case 'radio': {
      if (!Array.isArray(question.options) || question.options.length === 0) {
        throw new Error('گزینه‌های سوال نامعتبر است');
      }
      const optionCaptions = question.options.map((opt: any) =>
        typeof opt === 'string' ? opt : opt.caption
      );
      const selected = answer ? String(answer) : '';
      if (question.required && !selected) {
        throw new Error('لطفاً یک گزینه را انتخاب کنید');
      }
      if (selected && !optionCaptions.includes(selected)) {
        throw new Error('گزینه انتخاب شده معتبر نیست');
      }
      return selected;
    }
    case 'checkbox': {
      if (!Array.isArray(question.options) || question.options.length === 0) {
        throw new Error('گزینه‌های سوال نامعتبر است');
      }
      if (question.required && (!Array.isArray(answer) || answer.length === 0)) {
        throw new Error('لطفاً حداقل یک گزینه را انتخاب کنید');
      }
      if (!answer) {
        return [];
      }
      if (!Array.isArray(answer)) {
        throw new Error('پاسخ چند انتخابی باید آرایه باشد');
      }
      const optionCaptions = question.options.map((opt: any) =>
        typeof opt === 'string' ? opt : opt.caption
      );
      const selectedOptions = Array.from(
        new Set(
          answer
            .map((item) => String(item))
            .filter((item) => optionCaptions.includes(item))
        )
      );
      if (question.required && selectedOptions.length === 0) {
        throw new Error('لطفاً حداقل یک گزینه معتبر انتخاب کنید');
      }
      return selectedOptions;
    }
    case 'rating': {
      const maxRating = question.maxRating ?? 5;
      const numericAnswer = Number(answer ?? 0);
      if (question.required && (Number.isNaN(numericAnswer) || numericAnswer <= 0)) {
        throw new Error('لطفاً امتیاز معتبر وارد کنید');
      }
      if (numericAnswer < 0 || numericAnswer > maxRating) {
        throw new Error('مقدار امتیاز خارج از محدوده است');
      }
      return numericAnswer;
    }
    default:
      throw new Error('نوع سوال پشتیبانی نمی‌شود');
  }
};

export async function POST(
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

    const body = await request.json();
    const { responses } = body || {};

    if (!Array.isArray(responses)) {
      return NextResponse.json(
        { success: false, message: 'پاسخ‌های ارسالی نامعتبر هستند' },
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

      const studentDoc = await getStudentRecord(db, decoded.schoolCode, decoded.username);
      const studentClasses = getStudentClassCodes(studentDoc);

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

      if (startDate && now < startDate) {
        return NextResponse.json(
          { success: false, message: 'زمان شروع این نظرسنجی هنوز فرا نرسیده است' },
          { status: 400 }
        );
      }

      if (endDate && now > endDate) {
        return NextResponse.json(
          { success: false, message: 'مهلت شرکت در این نظرسنجی به پایان رسیده است' },
          { status: 400 }
        );
      }

      if (!survey.allowAnonymous) {
        const existingResponse = await db.collection('survey_responses').findOne({
          surveyId: new ObjectId(surveyId),
          responderId: decoded.userId,
        });

        if (existingResponse) {
          return NextResponse.json(
            { success: false, message: 'شما قبلاً در این نظرسنجی شرکت کرده‌اید' },
            { status: 400 }
          );
        }
      }

      if (!Array.isArray(survey.questions) || survey.questions.length === 0) {
        return NextResponse.json(
          { success: false, message: 'سؤالات نظرسنجی نامعتبر است' },
          { status: 400 }
        );
      }

      if (responses.length !== survey.questions.length) {
        return NextResponse.json(
          { success: false, message: 'تعداد پاسخ‌ها با تعداد پرسش‌ها مطابقت ندارد' },
          { status: 400 }
        );
      }

      const sanitizedResponses = survey.questions.map((question: any, index: number) => {
        const rawAnswer = responses[index]?.answer;
        const sanitizedAnswer = sanitizeAnswer(question, rawAnswer);

        return {
          questionId: question.id ?? index,
          questionText: question.text,
          questionType: question.type,
          answer: sanitizedAnswer,
        };
      });

      const responderName =
        studentDoc?.data?.name && studentDoc?.data?.family
          ? `${studentDoc.data.name} ${studentDoc.data.family}`
          : decoded.name || decoded.username;

      const responseDoc = {
        surveyId: new ObjectId(surveyId),
        responderId: survey.allowAnonymous ? null : decoded.userId,
        responderType: decoded.userType,
        responderName: survey.allowAnonymous ? 'ناشناس' : responderName,
        responses: sanitizedResponses,
        schoolCode: decoded.schoolCode,
        createdAt: new Date(),
      };

      const insertResult = await db.collection('survey_responses').insertOne(responseDoc);

      await db.collection('surveys').updateOne(
        { _id: new ObjectId(surveyId) },
        { $inc: { responseCount: 1 } }
      );

      return NextResponse.json({
        success: true,
        message: 'پاسخ شما با موفقیت ثبت شد',
        data: {
          responseId: insertResult.insertedId.toString(),
        },
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error submitting mobile survey response:', error);
    const message =
      error instanceof Error ? error.message : 'خطای ناشناخته در ثبت پاسخ رخ داد';
    return NextResponse.json(
      { success: false, message },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}


