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

      const studentCode = student.data?.studentCode;
      const studentUsername = student.data?.username || studentCode;

      if (!studentCode) {
        return NextResponse.json({
          success: true,
          data: {
            forms: [],
            student: {
              id: student._id.toString(),
              name: `${student.data?.studentName || ''} ${student.data?.studentFamily || ''}`.trim(),
              code: studentCode,
            },
            total: 0,
          },
        });
      }

      const formSubmissions = await db
        .collection('formsInput')
        .find({
          $or: [
            { username: studentCode },
            { username: studentUsername },
            { submittedBy: studentCode },
            { submittedBy: studentUsername },
          ],
        })
        .sort({ createdAt: -1 })
        .toArray();

      const uniqueFormIds = [...new Set(formSubmissions.map((sub: any) => sub.formId))];

      const formDefinitions = await db
        .collection('forms')
        .find({
          _id: { $in: uniqueFormIds.map((id: string) => new ObjectId(id)) },
        })
        .toArray();

      const formDefMap = new Map<string, any>();
      formDefinitions.forEach((form: any) => {
        formDefMap.set(form._id.toString(), form);
      });

      const studentForms = formSubmissions.map((submission: any) => {
        const formDef = formDefMap.get(submission.formId);

        return {
          _id: submission._id.toString(),
          formId: submission.formId,
          title: submission.formTitle || formDef?.title || `Form ${submission.formId.slice(-8)}`,
          description: formDef?.description || '',
          fields: formDef?.fields || [],
          steps: formDef?.steps || [],
          isMultiStep: formDef?.isMultiStep ?? false,
          answers: submission.answers || {},
          createdAt: submission.createdAt ? new Date(submission.createdAt).toISOString() : '',
          updatedAt: submission.updatedAt ? new Date(submission.updatedAt).toISOString() : '',
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          forms: studentForms,
          student: {
            id: student._id.toString(),
            name: `${student.data?.studentName || ''} ${student.data?.studentFamily || ''}`.trim(),
            code: studentCode,
          },
          total: studentForms.length,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error fetching student forms:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در دریافت فرم‌های دانش‌آموز' },
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


