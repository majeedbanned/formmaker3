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

interface GradeEntry {
  value: number;
  description: string;
  date: string;
  totalPoints?: number;
}

interface AssessmentEntry {
  title: string;
  value: string;
  date: string;
  weight?: number;
}

// Assessment values with weights
const ASSESSMENT_VALUES_MAP: Record<string, number> = {
  عالی: 2,
  خوب: 1,
  متوسط: 0,
  ضعیف: -1,
  "بسیار ضعیف": -2,
};

// Persian month names
const PERSIAN_MONTHS = [
  '', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Helper function: Convert Gregorian to Jalali (Persian) date
function gregorian_to_jalali(gy: number, gm: number, gd: number) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy = gy <= 1600 ? gy - 621 : gy - 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  const jm =
    days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = days < 186 ? (days % 31) + 1 : ((days - 186) % 30) + 1;
  return [jy, jm, jd];
}

// Calculate final score (matching MonthlyGradeReport logic)
function calculateFinalScore(grades: GradeEntry[], assessments: AssessmentEntry[]): number | null {
  if (grades.length === 0) return null;

  // Calculate base grade normalized to 20
  const totalValue = grades.reduce((sum, grade) => sum + grade.value, 0);
  const totalPoints = grades.reduce((sum, grade) => sum + (grade.totalPoints || 20), 0);
  
  // Normalize to base 20: (achieved/possible) × 20
  const baseGrade = totalPoints > 0 ? (totalValue / totalPoints) * 20 : 0;

  // If no assessments, return the base grade
  if (!assessments || assessments.length === 0) return baseGrade;

  // Calculate direct assessment adjustment
  const assessmentAdjustment = assessments.reduce((total, assessment) => {
    const adjustment = ASSESSMENT_VALUES_MAP[assessment.value] || 0;
    return total + adjustment;
  }, 0);

  // Calculate final score with direct addition of assessment adjustment
  let finalScore = baseGrade + assessmentAdjustment;

  // Cap at 20
  finalScore = Math.min(finalScore, 20);

  // Ensure not negative
  finalScore = Math.max(finalScore, 0);

  return finalScore;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Teacher monthly grades request received");
    
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

    // Check if user is teacher
    if (decoded.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'فقط معلمان می‌توانند این بخش را مشاهده کنند' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const classCode = searchParams.get('classCode');
    const courseCode = searchParams.get('courseCode');

    if (!classCode || !courseCode) {
      return NextResponse.json(
        { success: false, message: 'پارامترهای الزامی ارسال نشده است' },
        { status: 400 }
      );
    }

    console.log("Teacher monthly grades request for:", { classCode, courseCode, teacherCode: decoded.username });

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

    try {
      // Verify teacher teaches this course in this class
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

      // Get course name
      const courseDoc = await db.collection('courses').findOne({
        'data.courseCode': courseCode,
        'data.schoolCode': decoded.schoolCode
      });

      const courseName = courseDoc?.data?.courseName || courseCode;

      // Get current Persian year
      const currentDate = new Date();
      const [currentJYear] = gregorian_to_jalali(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate()
      );

      // First, get ALL students from the class (not just those with grades)
      const classStudents = classDoc.data.students || [];
      const allStudentCodes = classStudents.map((s: any) => s.studentCode);

      console.log("All students in class:", allStudentCodes.length);

      // Get student information for ALL students in class
      const students = await db.collection('students').find({
        'data.studentCode': { $in: allStudentCodes },
        'data.schoolCode': decoded.schoolCode
      }).toArray();

      // Create student map
      const studentMap = new Map();
      students.forEach((student: any) => {
        studentMap.set(student.data.studentCode, {
          studentCode: student.data.studentCode,
          studentName: `${student.data.studentName || ''} ${student.data.studentFamily || ''}`.trim() || student.data.studentCode,
          studentFamily: student.data.studentFamily || student.data.studentCode
        });
      });

      // Also add students from class document if not found in students collection
      classStudents.forEach((student: any) => {
        if (!studentMap.has(student.studentCode)) {
          studentMap.set(student.studentCode, {
            studentCode: student.studentCode,
            studentName: `${student.studentName || ''} ${student.studentFamily || ''}`.trim() || student.studentCode,
            studentFamily: student.studentFamily || student.studentCode
          });
        }
      });

      // Fetch all grade data for this class and course (including records without grades)
      const cellData = await db.collection('classsheet').find({
        classCode: classCode,
        courseCode: courseCode,
        teacherCode: decoded.username,
        schoolCode: decoded.schoolCode
      }).sort({ date: -1 }).toArray() as any[];

      console.log("Found cell data records:", cellData.length);

      // Filter data for current school year
      const filteredCellData = cellData.filter((cell: any) => {
        if (!cell.date) return false;

        try {
          const cellDate = new Date(cell.date);
          if (isNaN(cellDate.getTime())) return false;

          const [cellYear, cellMonth] = gregorian_to_jalali(
            cellDate.getFullYear(),
            cellDate.getMonth() + 1,
            cellDate.getDate()
          );

          // School year logic: months 7-12 from previous year, months 1-6 from current year
          if (cellMonth >= 7) {
            return cellYear.toString() === currentJYear.toString();
          } else {
            return cellYear.toString() === (currentJYear + 1).toString();
          }
        } catch (err) {
          console.error("Error processing date:", cell.date, err);
          return false;
        }
      });

      // Group data by student
      const studentGroups = new Map<string, any[]>();
      filteredCellData.forEach((cell: any) => {
        if (!studentGroups.has(cell.studentCode)) {
          studentGroups.set(cell.studentCode, []);
        }
        studentGroups.get(cell.studentCode)!.push(cell);
      });

      // Process each student (including those without any grades)
      const studentGrades: any[] = [];

      // Iterate through ALL students in the class
      for (const studentCode of allStudentCodes) {
        const studentInfo = studentMap.get(studentCode) || {
          studentCode: studentCode,
          studentName: studentCode
        };

        const studentCells = studentGroups.get(studentCode) || [];

        // Initialize monthly grades structure
        const monthlyGrades: Record<string, number | null> = {};
        const monthlyData: Record<string, { grades: GradeEntry[], assessments: AssessmentEntry[] }> = {};

        // Initialize all months
        for (let i = 1; i <= 12; i++) {
          monthlyGrades[i.toString()] = null;
          monthlyData[i.toString()] = { grades: [], assessments: [] };
        }

        // Populate with actual data
        studentCells.forEach((cell: any) => {
          if (!cell.date) return;

          try {
            const cellDate = new Date(cell.date);
            const [, cellMonth] = gregorian_to_jalali(
              cellDate.getFullYear(),
              cellDate.getMonth() + 1,
              cellDate.getDate()
            );

            const monthKey = cellMonth.toString();
            
            // Add grades
            if (cell.grades && cell.grades.length > 0) {
              monthlyData[monthKey].grades.push(...cell.grades);
            }

            // Add assessments
            if (cell.assessments && cell.assessments.length > 0) {
              monthlyData[monthKey].assessments.push(...cell.assessments);
            }
          } catch (err) {
            console.error("Error processing cell date:", cell.date, err);
          }
        });

        // Calculate final scores for each month
        let yearTotal = 0;
        let monthsWithScores = 0;

        for (let i = 1; i <= 12; i++) {
          const monthKey = i.toString();
          const { grades, assessments } = monthlyData[monthKey];
          
          if (grades.length > 0) {
            const finalScore = calculateFinalScore(grades, assessments);
            monthlyGrades[monthKey] = finalScore;
            
            if (finalScore !== null) {
              yearTotal += finalScore;
              monthsWithScores++;
            }
          }
        }

        // Calculate year average
        const yearAverage = monthsWithScores > 0 ? yearTotal / monthsWithScores : null;

        studentGrades.push({
          studentCode: studentInfo.studentCode,
          studentName: studentInfo.studentName,
          studentFamily: studentInfo.studentFamily || studentInfo.studentName,
          monthlyGrades,
          yearAverage
        });
      }

      // Sort by student family name
      studentGrades.sort((a, b) => a.studentFamily.localeCompare(b.studentFamily, 'fa'));

      console.log("Returning student grades for:", studentGrades.length, "students");

      await client.close();

      return NextResponse.json({
        success: true,
        data: {
          classCode,
          courseCode,
          courseName,
          schoolYear: currentJYear.toString(),
          students: studentGrades
        }
      });

    } catch (dbError) {
      await client.close();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Teacher monthly grades API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
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

