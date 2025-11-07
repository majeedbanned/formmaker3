import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

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

function toPersianDigits(input: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
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

    if (decoded.userType !== 'teacher' && decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان یا مدیران می‌توانند به نتایج آزمون دسترسی داشته باشند' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const studentCode = searchParams.get('studentCode');

    if (!studentCode) {
      return NextResponse.json(
        { success: false, message: 'کد دانش‌آموز الزامی است' },
        { status: 400 }
      );
    }

    const dbConfig: DatabaseConfig = getDatabaseConfig();
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

      const examStudentsInfoCollection = db.collection('examstudentsinfo');
      const examsCollection = db.collection('exam');

      const studentExamRecords = await examStudentsInfoCollection
        .find({
          userId: studentCode,
          $or: [
            { schoolCode: decoded.schoolCode },
            { schoolCode: '' },
            { schoolCode: { $exists: false } },
          ],
        })
        .sort({ updatedAt: -1, gradingTime: -1 })
        .toArray();

      if (studentExamRecords.length === 0) {
        return NextResponse.json({ success: true, data: { exams: [] } });
      }

      const examCache = new Map<string, any>();

      const exams = await Promise.all(
        studentExamRecords.map(async (record) => {
          const examId = record.examId;
          if (!examId) return null;

          if (!examCache.has(examId)) {
            let examDoc = null;
            try {
              examDoc = await examsCollection.findOne({ _id: new ObjectId(examId) });
            } catch (error) {
              examDoc = await examsCollection.findOne({ 'data.examCode': examId });
            }
            examCache.set(examId, examDoc);
          }

          const exam = examCache.get(examId);
          if (!exam) return null;

          const examSettings = exam.data?.settings || {};
          const showScore = examSettings.showScoreAfterExam === true || examSettings.showScoreAfterExam === 'true';

          const rawSumScore = record.sumScore;
          const rawMaxScore = record.maxScore;

          const sumScore =
            typeof rawSumScore === 'number'
              ? rawSumScore
              : rawSumScore !== undefined && rawSumScore !== null
              ? Number(rawSumScore)
              : null;

          const maxScore =
            typeof rawMaxScore === 'number'
              ? rawMaxScore
              : rawMaxScore !== undefined && rawMaxScore !== null
              ? Number(rawMaxScore)
              : null;

          const percentage =
            sumScore !== null && maxScore !== null && maxScore > 0
              ? (sumScore / maxScore) * 100
              : null;

          const status = record.gradingStatus || (record.isFinished ? 'finished' : 'in-progress');

          return {
            examId,
            examCode: exam.data?.examCode || exam.examCode || examId,
            examName: exam.data?.examName || exam.title || 'آزمون بدون عنوان',
            teacherName: exam.data?.teacherName || '',
            entryDate: record.persianEntryDate || record.entryDate || '',
            entryTime: record.entryTime || '',
            isFinished: !!record.isFinished,
            gradingStatus: status,
            score:
              showScore && sumScore !== null
                ? {
                    value: toPersianDigits(sumScore),
                    max: maxScore !== null ? toPersianDigits(maxScore) : null,
                    percentage: percentage !== null ? toPersianDigits(percentage.toFixed(1)) : null,
                  }
                : null,
            showScore,
            totalQuestions: record.totalQuestions ?? null,
            correctAnswerCount: record.correctAnswerCount ?? null,
            wrongAnswerCount: record.wrongAnswerCount ?? null,
            unansweredCount: record.unansweredCount ?? null,
            lastUpdatedAt: record.updatedAt || record.gradingTime || null,
          };
        })
      );

      const filteredExams = exams.filter((exam): exam is NonNullable<typeof exam> => exam !== null);

      return NextResponse.json({
        success: true,
        data: {
          exams: filteredExams,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در دریافت نتایج آزمون' },
      { status: 500 }
    );
  }
}
