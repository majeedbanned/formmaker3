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

export async function GET(request: NextRequest) {
  try {
    console.log("Mobile classsheet students request received");
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    console.log("Mobile classsheet students request for user:", decoded.userType, decoded.username);

    // Check if user is teacher
    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند لیست دانش‌آموزان را مشاهده کنند' },
        { status: 403 }
      );
    }

    // Get classCode, courseCode, and timeSlot from query parameters
    const { searchParams } = new URL(request.url);
    const classCode = searchParams.get('classCode');
    const courseCode = searchParams.get('courseCode');
    const timeSlot = searchParams.get('timeSlot');
    const requestedDate = searchParams.get('date'); // Optional: specific date (YYYY-MM-DD)

    if (!classCode || !courseCode || !timeSlot) {
      return NextResponse.json(
        { success: false, message: 'کد کلاس، کد درس و زمان الزامی است' },
        { status: 400 }
      );
    }

      // Use requested date or calculate today's date
      let date: string;
      if (requestedDate) {
        date = requestedDate;
        console.log("Using requested date:", date);
      } else {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        date = `${year}-${month}-${day}`;
        console.log("Using today's date:", date);
      }

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    const domainConfig = dbConfig[decoded.domain];
    
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    // Verify school code matches
    if (domainConfig.schoolCode !== decoded.schoolCode) {
      return NextResponse.json(
        { success: false, message: 'کد مدرسه با دامنه مطابقت ندارد' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);
    
    console.log("Connected to database:", dbName);

    try {
      // Find the class
      const classDoc = await db.collection('classes').findOne({
        'data.classCode': classCode,
        'data.schoolCode': decoded.schoolCode
      });

      if (!classDoc) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'کلاس یافت نشد' },
          { status: 404 }
        );
      }

      // Verify teacher teaches this class with this course
      const teacherTeachesClass = classDoc.data.teachers.some(
        (t: any) => t.teacherCode === decoded.username && t.courseCode === courseCode
      );

      if (!teacherTeachesClass) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'شما معلم این درس در این کلاس نیستید' },
          { status: 403 }
        );
      }

      // Get students from the class data
      const students = classDoc.data.students || [];

      // Sort by studentlname (family name) then by studentName
      const sortedStudents = students.sort((a: any, b: any) => {
        const lnameCompare = (a.studentlname || '').localeCompare(b.studentlname || '', 'fa');
        if (lnameCompare !== 0) return lnameCompare;
        return (a.studentName || '').localeCompare(b.studentName || '', 'fa');
      });

      // Get all classsheet data for each student
      const studentsWithData = await Promise.all(
        sortedStudents.map(async (student: any) => {
          const classsheetRecord = await db.collection('classsheet').findOne({
            classCode: classCode,
            studentCode: student.studentCode,
            teacherCode: decoded.username,
            courseCode: courseCode,
            schoolCode: decoded.schoolCode,
            date: date,
            timeSlot: timeSlot
          });

          return {
            studentCode: student.studentCode || '',
            studentName: student.studentName || '',
            studentlname: student.studentlname || '',
            phone: student.phone || '',
            presenceStatus: classsheetRecord?.presenceStatus || null,
            note: classsheetRecord?.note || '',
            grades: classsheetRecord?.grades || [],
            descriptiveStatus: classsheetRecord?.descriptiveStatus || '',
            assessments: classsheetRecord?.assessments || []
          };
        })
      );

      console.log("Found students:", studentsWithData.length);

      return NextResponse.json({
        success: true,
        students: studentsWithData
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500 }
      );
    } finally {
      await client.close();
    }

  } catch (error) {
    console.error('Error fetching class students:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست دانش‌آموزان' },
      { status: 500 }
    );
  }
}

