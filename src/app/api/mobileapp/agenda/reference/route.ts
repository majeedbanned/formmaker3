import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
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

const getDbClient = async (connectionString: string) => {
  const client = new MongoClient(connectionString);
  await client.connect();
  const dbName = connectionString.split('/')[3].split('?')[0];
  const db = client.db(dbName);
  return { client, db };
};

const toEnglishDigits = (input: string): string =>
  input
    .replace(/[۰-۹]/g, (char) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(char)));

const ensureString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'value' in value) {
    return ensureString((value as { value: unknown }).value, fallback);
  }
  return fallback;
};

const extractDataProperty = <T>(document: any, key: string, fallback: T): T => {
  if (!document) return fallback;
  if (document[key] !== undefined) return document[key];
  if (document.data && document.data[key] !== undefined) return document.data[key];
  return fallback;
};

const buildTeacherClassMapping = (classes: any[]) => {
  const map: Record<string, { classCode: string; className: string; courses: string[] }[]> = {};

  classes.forEach((cls) => {
    const classCode = extractDataProperty(cls, 'classCode', '');
    const className = extractDataProperty(cls, 'className', classCode);
    const teachers = extractDataProperty(cls, 'teachers', []) as any[];

    if (!classCode || !Array.isArray(teachers)) {
      return;
    }

    teachers.forEach((teacher) => {
      const tCode = ensureString(teacher.teacherCode);
      const courseCode = ensureString(teacher.courseCode);
      if (!tCode || !courseCode) return;

      if (!map[tCode]) {
        map[tCode] = [];
      }

      const existing = map[tCode].find((entry) => entry.classCode === classCode);
      if (existing) {
        if (!existing.courses.includes(courseCode)) {
          existing.courses.push(courseCode);
        }
      } else {
        map[tCode].push({
          classCode,
          className,
          courses: [courseCode],
        });
      }
    });
  });

  return map;
};

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

    if (!['school', 'teacher'].includes(decoded.userType)) {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیر مجاز' },
        { status: 403 }
      );
    }

    const dbConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];

    if (!domainConfig || domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'پیکربندی مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    const { client, db } = await getDbClient(domainConfig.connectionString);

    try {
      const teachersCollection = db.collection('teachers');
      const classesCollection = db.collection('classes');
      const coursesCollection = db.collection('courses');

      const [teachers, classes, courses] = await Promise.all([
        // Fetch teachers for both school and teacher users (teachers need avatars when viewing all events)
        ['school', 'teacher'].includes(decoded.userType)
          ? teachersCollection
              .find({ 'data.schoolCode': decoded.schoolCode })
              .project({
                _id: 1,
                username: 1,
                'data.teacherCode': 1,
                'data.teacherName': 1,
                'data.avatar': 1, // Include avatar field
                firstName: 1,
                lastName: 1,
              })
              .toArray()
          : [],
        classesCollection
          .find({ 'data.schoolCode': decoded.schoolCode })
          .project({
            _id: 1,
            'data.classCode': 1,
            'data.className': 1,
            'data.major': 1,
            'data.Grade': 1,
            'data.teachers': 1,
          })
          .toArray(),
        coursesCollection
          .find({ 'data.schoolCode': decoded.schoolCode })
          .project({
            _id: 1,
            'data.courseCode': 1,
            'data.courseName': 1,
            'data.major': 1,
            'data.Grade': 1,
          })
          .toArray(),
      ]);

      const teacherClassMap = buildTeacherClassMapping(classes);

      const normalisedTeachers =
        ['school', 'teacher'].includes(decoded.userType)
          ? teachers.map((teacher) => ({
              id: teacher._id.toString(),
              teacherCode: ensureString(
                teacher.username ||
                  extractDataProperty(teacher, 'teacherCode', '') ||
                  extractDataProperty(teacher, 'teacherCode', '')
              ),
              teacherName:
                ensureString(extractDataProperty(teacher, 'teacherName', '')).trim() ||
                `${ensureString(teacher.firstName)} ${ensureString(teacher.lastName)}`.trim() ||
                ensureString(
                  extractDataProperty(teacher, 'teacherCode', ''),
                  'استاد بدون نام'
                ),
              avatar: extractDataProperty(teacher, 'avatar', null), // Include avatar in response
            }))
          : [];

      const normalisedClasses = classes.map((cls) => ({
        id: cls._id.toString(),
        classCode: extractDataProperty(cls, 'classCode', ''),
        className: extractDataProperty(cls, 'className', ''),
        major: extractDataProperty(cls, 'major', ''),
        grade: extractDataProperty(cls, 'Grade', ''),
        teachers: (extractDataProperty(cls, 'teachers', []) as any[]).map((teacher) => ({
          teacherCode: ensureString(teacher.teacherCode),
          courseCode: ensureString(teacher.courseCode),
          weeklySchedule: Array.isArray(teacher.weeklySchedule)
            ? teacher.weeklySchedule.map((slot: any) => ({
                day: ensureString(slot?.day),
                timeSlot: ensureString(slot?.timeSlot),
              }))
            : [],
        })),
      }));

      const normalisedCourses = courses.map((course) => ({
        id: course._id.toString(),
        courseCode: extractDataProperty(course, 'courseCode', ''),
        courseName: extractDataProperty(course, 'courseName', ''),
        major: extractDataProperty(course, 'major', ''),
        grade: extractDataProperty(course, 'Grade', ''),
      }));

      return NextResponse.json({
        success: true,
        data: {
          teachers: normalisedTeachers,
          classes: normalisedClasses,
          courses: normalisedCourses,
          teacherClasses: teacherClassMap,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error fetching agenda reference data:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات مرجع' },
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

