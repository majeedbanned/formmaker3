import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Load database configuration
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

// JWT Configuration
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

// GET - Fetch complete student report for a specific course
export async function GET(request: NextRequest) {
  try {
    console.log("Mobile student report request received");
    
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
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند گزارش دانش‌آموزان را مشاهده کنند' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentCode = searchParams.get('studentCode');
    const classCode = searchParams.get('classCode');
    const courseCode = searchParams.get('courseCode');

    if (!studentCode || !classCode || !courseCode) {
      return NextResponse.json(
        { success: false, message: 'پارامترهای الزامی ارسال نشده است' },
        { status: 400 }
      );
    }

    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    if (domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400 }
      );
    }

    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);
    
    console.log("Connected to database:", dbName);

    try {
      console.log("Fetching student report for:", { studentCode, classCode, courseCode, teacherCode: decoded.username, schoolCode: decoded.schoolCode });
      
      // Verify teacher teaches this class
      const classDoc = await db.collection('classes').findOne({
        'data.classCode': classCode,
        'data.schoolCode': decoded.schoolCode
      });

      console.log("Class found:", !!classDoc);

      if (!classDoc) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'کلاس یافت نشد' },
          { status: 404 }
        );
      }

      const teacherTeachesClass = classDoc.data.teachers.some(
        (t: any) => t.teacherCode === decoded.username && t.courseCode === courseCode
      );

      console.log("Teacher teaches class:", teacherTeachesClass);

      if (!teacherTeachesClass) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'شما معلم این درس در این کلاس نیستید' },
          { status: 403 }
        );
      }

      // Get student info from the class document
      const student = classDoc.data.students?.find(
        (s: any) => s.studentCode === studentCode
      );

      console.log("Student found in class:", !!student);

      if (!student) {
        console.log("Student not found in class with studentCode:", studentCode);
        await client.close();
        return NextResponse.json(
          { success: false, message: 'دانش‌آموز در این کلاس یافت نشد' },
          { status: 404 }
        );
      }

      // Fetch all classsheet records for this student in this course
      const records = await db.collection('classsheet').find({
        studentCode: studentCode,
        classCode: classCode,
        courseCode: courseCode,
        teacherCode: decoded.username,
        schoolCode: decoded.schoolCode
      }).sort({ date: -1 }).toArray();

      // Calculate statistics
      const stats = {
        totalSessions: records.length,
        present: 0,
        absent: 0,
        delayed: 0,
        unset: 0,
        totalGrades: 0,
        totalAssessments: 0,
        notesCount: 0
      };

      const allGrades: any[] = [];
      const allAssessments: any[] = [];
      const recentRecords: any[] = [];

      records.forEach((record: any) => {
        // Count presence status
        if (record.presenceStatus === 'present') stats.present++;
        else if (record.presenceStatus === 'absent') stats.absent++;
        else if (record.presenceStatus === 'delayed') stats.delayed++;
        else stats.unset++;

        // Collect grades
        if (record.grades && Array.isArray(record.grades)) {
          stats.totalGrades += record.grades.length;
          record.grades.forEach((grade: any) => {
            allGrades.push({
              ...grade,
              date: record.date,
              persianDate: record.persianDate
            });
          });
        }

        // Collect assessments
        if (record.assessments && Array.isArray(record.assessments)) {
          stats.totalAssessments += record.assessments.length;
          record.assessments.forEach((assessment: any) => {
            allAssessments.push({
              ...assessment,
              date: record.date,
              persianDate: record.persianDate
            });
          });
        }

        // Count notes
        if (record.note && record.note.trim().length > 0) {
          stats.notesCount++;
        }

        // Include recent records (last 10) with all details
        if (recentRecords.length < 10) {
          recentRecords.push({
            date: record.date,
            persianDate: record.persianDate,
            timeSlot: record.timeSlot,
            presenceStatus: record.presenceStatus,
            note: record.note,
            grades: record.grades || [],
            assessments: record.assessments || [],
            descriptiveStatus: record.descriptiveStatus
          });
        }
      });

      await client.close();

      return NextResponse.json({
        success: true,
        student: {
          studentCode: student.studentCode,
          studentName: student.studentName,
          studentlname: student.studentlname,
          phone: student.phone
        },
        stats: stats,
        allGrades: allGrades,
        allAssessments: allAssessments,
        recentRecords: recentRecords
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      await client.close();
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error fetching student report:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت گزارش دانش‌آموز' },
      { status: 500 }
    );
  }
}

