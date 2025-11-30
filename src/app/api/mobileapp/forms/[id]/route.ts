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
  name?: string;
  iat?: number;
  exp?: number;
}

const isFormActive = (form: any) => {
  const now = new Date();
  const startDate = form.formStartEntryDatetime ? new Date(form.formStartEntryDatetime) : null;
  const endDate = form.formEndEntryDateTime ? new Date(form.formEndEntryDateTime) : null;

  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;

  return true;
};

const formatFormResponse = (form: any, submissionCount: number, userHasSubmitted: boolean) => ({
  id: form._id.toString(),
  title: form.title,
  description: form.description || '',
  fields: form.fields || [],
  isMultiStep: form.isMultiStep || false,
  steps: form.steps || [],
  formStartEntryDatetime: form.formStartEntryDatetime || null,
  formEndEntryDateTime: form.formEndEntryDateTime || null,
  assignedClassCodes: form.assignedClassCodes || [],
  assignedTeacherCodes: form.assignedTeacherCodes || [],
  isEditable: form.isEditable !== false,
  oneTimeFillOnly: form.oneTimeFillOnly || false,
  multipleInstances: form.multipleInstances || false,
  createdAt: form.createdAt || null,
  updatedAt: form.updatedAt || null,
  metadata: form.metadata || {},
  submissionCount,
  userHasSubmitted,
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const formId = params.id;
    if (!formId || !ObjectId.isValid(formId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه فرم نامعتبر است' },
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

    if (schoolConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400 }
      );
    }

    const client = new MongoClient(schoolConfig.connectionString);
    await client.connect();

    try {
      const dbName = schoolConfig.connectionString.split('/')[3].split('?')[0];
      const db = client.db(dbName);

      const formsCollection = db.collection('forms');
      const submissionsCollection = db.collection('formsInput');
      const legacySubmissionsCollection = db.collection('formsubmissions');

      const form = await formsCollection.findOne({ _id: new ObjectId(formId) });

      if (!form) {
        return NextResponse.json(
          { success: false, message: 'فرم یافت نشد' },
          { status: 404 }
        );
      }

      // Authorization for students/teachers
      if (decoded.userType === 'student') {
        const student = await db.collection('students').findOne({
          'data.studentCode': decoded.username,
          'data.schoolCode': decoded.schoolCode,
        });

        const studentClassCodes: string[] = Array.isArray(student?.data?.classCode)
          ? student!.data.classCode
              .filter((cls: any) => cls && typeof cls === 'object' && cls.value)
              .map((cls: any) => cls.value)
          : [];

        if (
          Array.isArray(form.assignedClassCodes) &&
          form.assignedClassCodes.length > 0 &&
          !form.assignedClassCodes.some((code: string) => studentClassCodes.includes(code))
        ) {
          return NextResponse.json(
            { success: false, message: 'دسترسی به این فرم برای شما مجاز نیست' },
            { status: 403 }
          );
        }
      } else if (decoded.userType === 'teacher') {
        const teacherCode = decoded.username;
        const assignedTeacherCodes: string[] = Array.isArray(form.assignedTeacherCodes)
          ? form.assignedTeacherCodes
          : [];

        if (assignedTeacherCodes.length > 0 && !assignedTeacherCodes.includes(teacherCode)) {
          return NextResponse.json(
            { success: false, message: 'دسترسی به این فرم برای شما مجاز نیست' },
            { status: 403 }
          );
        }
      }

      const primaryCount = await submissionsCollection.countDocuments({ formId }).catch(() => 0);
      const legacyCount = await legacySubmissionsCollection.countDocuments({ formId }).catch(() => 0);
      const totalSubmissions = primaryCount + legacyCount;

      let existingSubmission = await submissionsCollection.findOne({
        formId,
        username: decoded.username,
      });

      if (!existingSubmission) {
        existingSubmission = await legacySubmissionsCollection.findOne({
          formId,
          username: decoded.username,
        });
      }

      const userHasSubmitted = !!existingSubmission;

      const formattedForm = formatFormResponse(form, totalSubmissions, userHasSubmitted);
      const active = isFormActive(form);

      const canSubmit = (() => {
        if (!active) return false;
        if (form.oneTimeFillOnly && userHasSubmitted && !formattedForm.isEditable && !formattedForm.multipleInstances) {
          return false;
        }
        return true;
      })();

      return NextResponse.json({
        success: true,
        form: formattedForm,
        existingSubmission: existingSubmission
          ? {
              id: existingSubmission._id.toString(),
              answers: existingSubmission.answers || {},
              updatedAt: existingSubmission.updatedAt || existingSubmission.createdAt || null,
            }
          : null,
        canSubmit,
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error fetching form detail:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در دریافت فرم' },
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


