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

const ALLOWED_FIELDS = new Set([
  'studentName',
  'studentFamily',
  'studentCode',
  'phone',
  'phones',
  'codemelli',
  'birthDate',
  'birthplace',
  'IDserial',
  'address',
  'postalcode',
  'classCode',
  'groups',
  'infos',
  'fatherEducation',
  'fatherJob',
  'fatherWorkPlace',
  'motherEducation',
  'motherJob',
  'maghta',
  'isActive',
  'hasInstalledApp', // ignored but allowed for backward compatibility (will be stripped)
  'avatar',
]);

interface UpdateRequestBody {
  studentId?: string;
  updates?: Record<string, any>;
}

const sanitizePhoneEntries = (phones: any): Array<{ owner: string; number: string }> => {
  if (!Array.isArray(phones)) return [];

  return phones
    .map((entry) => ({
      owner: typeof entry?.owner === 'string' ? entry.owner.trim() : '',
      number: typeof entry?.number === 'string' ? entry.number.trim() : '',
    }))
    .filter((entry) => entry.number);
};

const sanitizeLabelValueArray = (items: any): Array<{ label: string; value: string }> => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      label: typeof item?.label === 'string' ? item.label.trim() : '',
      value: typeof item?.value === 'string' ? item.value.trim() : '',
    }))
    .filter((item) => item.label && item.value);
};

const sanitizeInfoEntries = (items: any): Array<{ title: string; value: string }> => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      title: typeof item?.title === 'string' ? item.title.trim() : '',
      value: typeof item?.value === 'string' ? item.value.trim() : '',
    }))
    .filter((item) => item.title && item.value);
};

export async function POST(request: NextRequest) {
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

    if (decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'تنها مدیر مدرسه امکان ویرایش اطلاعات دانش‌آموز را دارد' },
        { status: 403 }
      );
    }

    const body: UpdateRequestBody = await request.json();
    const { studentId, updates } = body;

    if (!studentId || !ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه دانش‌آموز نامعتبر است' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, message: 'داده‌ای برای ویرایش ارسال نشده است' },
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
      const studentsCollection = db.collection('students');

      const updateDoc: Record<string, unknown> = {
        updatedAt: new Date(),
        'data.updatedAt': new Date(),
        'data.updatedBy': decoded.userId,
      };

      for (const [key, value] of Object.entries(updates)) {
        if (!ALLOWED_FIELDS.has(key) || key === 'hasInstalledApp') {
          continue;
        }

        if (key === 'phones') {
          updateDoc['data.phones'] = sanitizePhoneEntries(value);
          continue;
        }

        if (key === 'classCode') {
          updateDoc['data.classCode'] = sanitizeLabelValueArray(value);
          continue;
        }

        if (key === 'groups') {
          updateDoc['data.groups'] = sanitizeLabelValueArray(value);
          continue;
        }

        if (key === 'infos') {
          updateDoc['data.infos'] = sanitizeInfoEntries(value);
          continue;
        }

        if (key === 'isActive') {
          updateDoc['data.isActive'] = !!value;
          continue;
        }

        updateDoc[`data.${key}`] = typeof value === 'string' ? value.trim() : value;
      }

      if (Object.keys(updateDoc).length <= 3) { // only meta fields present
        return NextResponse.json(
          { success: false, message: 'هیچ فیلد معتبری برای به‌روزرسانی ارسال نشده است' },
          { status: 400 }
        );
      }

      const filter = {
        _id: new ObjectId(studentId),
        'data.schoolCode': decoded.schoolCode,
      };

      const updateResult = await studentsCollection.updateOne(filter, { $set: updateDoc });

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'دانش‌آموز یافت نشد' },
          { status: 404 }
        );
      }

      const updatedStudent = await studentsCollection.findOne(filter);

      return NextResponse.json({
        success: true,
        message: 'اطلاعات دانش‌آموز با موفقیت به‌روزرسانی شد',
        data: updatedStudent
          ? {
              id: updatedStudent._id.toString(),
              studentCode: updatedStudent.data?.studentCode || '',
              studentName: updatedStudent.data?.studentName || '',
              studentFamily: updatedStudent.data?.studentFamily || '',
              phone: updatedStudent.data?.phone || '',
              codemelli: updatedStudent.data?.codemelli || '',
              birthDate: updatedStudent.data?.birthDate || '',
              birthplace: updatedStudent.data?.birthplace || updatedStudent.data?.['birthplace '] || '',
              IDserial: updatedStudent.data?.IDserial || '',
              address: updatedStudent.data?.address || '',
              postalcode: updatedStudent.data?.postalcode || '',
              schoolCode: updatedStudent.data?.schoolCode || '',
              classCode: updatedStudent.data?.classCode || [],
              groups: updatedStudent.data?.groups || [],
              infos: updatedStudent.data?.infos || [],
              isActive: updatedStudent.data?.isActive ?? true,
              phones: updatedStudent.data?.phones || [],
              fatherEducation: updatedStudent.data?.fatherEducation || '',
              fatherJob: updatedStudent.data?.fatherJob || '',
              fatherWorkPlace: updatedStudent.data?.fatherWorkPlace || '',
              motherEducation: updatedStudent.data?.motherEducation || '',
              motherJob: updatedStudent.data?.motherJob || '',
              maghta: updatedStudent.data?.maghta || '',
              updatedAt: updatedStudent.updatedAt || updatedStudent.data?.updatedAt || '',
            }
          : null,
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error updating student info:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در ویرایش اطلاعات دانش‌آموز' },
      { status: 500 }
    );
  }
}

