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

    // Only school users can view liked users list
    if (decoded.userType !== 'school' && decoded.role !== 'school') {
      return NextResponse.json(
        { success: false, message: 'فقط مدیر مدرسه می‌تواند لیست لایک‌کنندگان را مشاهده کند' },
        { status: 403 }
      );
    }

    const announcementId = params.id;
    if (!announcementId || !ObjectId.isValid(announcementId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه اطلاعیه نامعتبر است' },
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

      // Find the announcement
      const announcement = await db.collection('announcements').findOne({
        _id: new ObjectId(announcementId),
        schoolCode: decoded.schoolCode,
      });

      if (!announcement) {
        return NextResponse.json(
          { success: false, message: 'اطلاعیه مورد نظر یافت نشد' },
          { status: 404 }
        );
      }

      const likes = Array.isArray(announcement.likes) ? announcement.likes : [];
      
      if (likes.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            users: [],
          },
        });
      }

      // Fetch user details from students and teachers collections
      // Note: likes array contains userIds (MongoDB _id as strings)
      const users: Array<{
        id: string;
        name: string;
        username: string;
        role: string;
        userType: string;
        avatar?: {
          path?: string;
          filename?: string;
        } | null;
      }> = [];

      // Convert like IDs to ObjectIds for querying
      const validObjectIds = likes.filter((id: string) => ObjectId.isValid(id));
      const objectIds = validObjectIds.map((id: string) => new ObjectId(id));

      if (objectIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            users: [],
          },
        });
      }

      // Fetch students by _id
      const students = await db.collection('students').find({
        _id: { $in: objectIds },
        'data.schoolCode': decoded.schoolCode,
      }).toArray();

      students.forEach((student) => {
        const studentId = student._id instanceof ObjectId ? student._id.toHexString() : String(student._id);
        if (likes.includes(studentId)) {
          const studentName = student.data?.studentName || '';
          const studentFamily = student.data?.studentFamily || '';
          const fullName = `${studentName} ${studentFamily}`.trim() || student.data?.studentCode || 'دانش‌آموز';
          
          users.push({
            id: studentId,
            name: fullName,
            username: student.data?.studentCode || studentId,
            role: 'student',
            userType: 'student',
            avatar: student.data?.avatar || null,
          });
        }
      });

      // Fetch teachers by _id
      const teachers = await db.collection('teachers').find({
        _id: { $in: objectIds },
        'data.schoolCode': decoded.schoolCode,
      }).toArray();

      teachers.forEach((teacher) => {
        const teacherId = teacher._id instanceof ObjectId ? teacher._id.toHexString() : String(teacher._id);
        if (likes.includes(teacherId)) {
          const teacherName = teacher.data?.teacherName || '';
          const teacherFamily = teacher.data?.teacherFamily || '';
          const fullName = `${teacherName} ${teacherFamily}`.trim() || teacher.data?.teacherCode || 'معلم';
          
          users.push({
            id: teacherId,
            name: fullName,
            username: teacher.data?.teacherCode || teacherId,
            role: 'teacher',
            userType: 'teacher',
            avatar: teacher.data?.avatar || null,
          });
        }
      });

      // Check for school users (they might be stored as userId in likes)
      // Try to find school users from announcements createdBy.id
      const remainingLikes = likes.filter((likeId: string) => !users.some(u => u.id === likeId));
      
      if (remainingLikes.length > 0) {
        // Find announcements created by these users
        const announcementsWithUsers = await db.collection('announcements').find({
          schoolCode: decoded.schoolCode,
          'createdBy.id': { $in: remainingLikes },
        }).toArray();

        const foundSchoolUserIds = new Set<string>();
        announcementsWithUsers.forEach((ann) => {
          const userId = ann.createdBy?.id;
          if (userId && remainingLikes.includes(userId) && !foundSchoolUserIds.has(userId)) {
            foundSchoolUserIds.add(userId);
            users.push({
              id: userId,
              name: ann.createdBy?.name || 'مدرسه',
              username: ann.createdBy?.username || userId,
              role: 'school',
              userType: 'school',
            });
          }
        });
      }

      // Sort users: students first, then teachers, then school users
      users.sort((a, b) => {
        const order = { student: 0, teacher: 1, school: 2 };
        return (order[a.userType as keyof typeof order] || 3) - (order[b.userType as keyof typeof order] || 3);
      });

      return NextResponse.json({
        success: true,
        data: {
          users,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error('Error fetching liked users:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در دریافت لیست لایک‌کنندگان' },
      { status: 500 }
    );
  }
}

