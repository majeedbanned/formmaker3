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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json();
    const { answers, submissionId } = body || {};

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { success: false, message: 'پاسخ‌های فرم ارسال نشده‌اند' },
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

      // Authorization checks similar to GET
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

      const active = isFormActive(form);
      if (!active) {
        return NextResponse.json(
          { success: false, message: 'مهلت ارسال این فرم به پایان رسیده است' },
          { status: 400 }
        );
      }

      const safeAnswers = JSON.parse(JSON.stringify(answers));

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

      if (
        form.oneTimeFillOnly &&
        userHasSubmitted &&
        !form.isEditable &&
        !form.multipleInstances &&
        !submissionId
      ) {
        return NextResponse.json(
          { success: false, message: 'شما قبلاً این فرم را تکمیل کرده‌اید' },
          { status: 400 }
        );
      }

      let studentName = decoded.name || '';
      let userName = '';
      let userFamily = '';

      if (studentName) {
        const parts = studentName.trim().split(' ');
        if (parts.length > 0) {
          userName = parts[0];
          userFamily = parts.slice(1).join(' ');
        }
      }

      if (decoded.userType === 'student') {
        const student = await db.collection('students').findOne({
          'data.studentCode': decoded.username,
          'data.schoolCode': decoded.schoolCode,
        });

        if (student?.data) {
          userName = student.data.studentName || userName;
          userFamily = student.data.studentFamily || userFamily;
        }
      }

      const userInfo = {
        username: decoded.username,
        userType: decoded.userType,
        userName,
        userFamily,
      };

      if (submissionId) {
        if (!form.isEditable && !form.multipleInstances) {
          return NextResponse.json(
            { success: false, message: 'ویرایش این فرم مجاز نیست' },
            { status: 403 }
          );
        }

        const submissionObjectId = new ObjectId(submissionId);

        const updatePayload = {
          $set: {
            answers: safeAnswers,
            updatedAt: new Date(),
            username: userInfo.username,
            userType: userInfo.userType,
            userName: userInfo.userName,
            userFamily: userInfo.userFamily,
            submittedBy: userInfo.username,
            submissionSource: 'mobile',
          },
        };

        const updateResult = await submissionsCollection.updateOne(
          {
            _id: submissionObjectId,
            formId,
            username: decoded.username,
          },
          updatePayload
        );

        let matchedCount = updateResult.matchedCount;

        if (matchedCount === 0) {
          const legacyResult = await legacySubmissionsCollection.updateOne(
            {
              _id: submissionObjectId,
              formId,
              username: decoded.username,
            },
            updatePayload
          );
          matchedCount = legacyResult.matchedCount;
        }

        if (matchedCount === 0) {
          return NextResponse.json(
            { success: false, message: 'پاسخ قبلی برای ویرایش یافت نشد' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'پاسخ فرم با موفقیت بروزرسانی شد',
          submissionId,
        });
      }

      const submissionDocument = {
        formId,
        formTitle: form.title,
        answers: safeAnswers,
        createdAt: new Date(),
        updatedAt: new Date(),
        username: userInfo.username,
        userType: userInfo.userType,
        userName: userInfo.userName,
        userFamily: userInfo.userFamily,
        submittedBy: userInfo.username,
        submissionSource: 'mobile',
        userAgent: request.headers.get('user-agent') || '',
        ipAddress: request.headers.get('x-forwarded-for') || '',
      };

      const insertResult = await submissionsCollection.insertOne(submissionDocument);

      return NextResponse.json({
        success: true,
        message: 'فرم با موفقیت ارسال شد',
        submissionId: insertResult.insertedId.toString(),
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در ارسال فرم' },
      { status: 500 }
    );
  }
}

