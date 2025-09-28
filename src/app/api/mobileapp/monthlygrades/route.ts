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

interface CellData {
  classCode: string;
  studentCode: number;
  teacherCode: string;
  courseCode: string;
  schoolCode: string;
  date: string;
  timeSlot: string;
  note: string;
  grades: GradeEntry[];
  presenceStatus: "present" | "absent" | "late" | null;
  descriptiveStatus?: string;
  assessments?: AssessmentEntry[];
}

interface MonthlyGrade {
  month: number;
  monthName: string;
  grades: GradeEntry[];
  assessments: AssessmentEntry[];
  averageGrade: number | null;
  finalScore: number | null;
  gradeCount: number;
  assessmentCount: number;
}

interface CourseGrade {
  courseCode: string;
  courseName: string;
  teacherCode: string;
  teacherName: string;
  monthlyGrades: MonthlyGrade[];
  yearAverage: number | null;
  totalGrades: number;
  totalAssessments: number;
}

interface StudentGradeData {
  studentCode: number;
  studentName: string;
  schoolYear: string;
  courseGrades: CourseGrade[];
  overallAverage: number | null;
}

// Assessment values with weights (matching MonthlyGradeReport)
const ASSESSMENT_VALUES_MAP: Record<string, number> = {
  عالی: 2,
  خوب: 1,
  متوسط: 0,
  ضعیف: -1,
  "بسیار ضعیف": -2,
};

// Persian month names
const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
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

  // Calculate average grade
  const gradeAverage = grades.reduce((sum, grade) => sum + grade.value, 0) / grades.length;

  // If no assessments, return the average grade
  if (!assessments || assessments.length === 0) return gradeAverage;

  // Calculate direct assessment adjustment
  const assessmentAdjustment = assessments.reduce((total, assessment) => {
    const adjustment = ASSESSMENT_VALUES_MAP[assessment.value] || 0;
    return total + adjustment;
  }, 0);

  // Calculate final score with direct addition of assessment adjustment
  let finalScore = gradeAverage + assessmentAdjustment;

  // Cap at 20
  finalScore = Math.min(finalScore, 20);

  // Ensure not negative
  finalScore = Math.max(finalScore, 0);

  return finalScore;
}

// Extract user info from JWT token
const getUserFromToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

export async function GET(request: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت یافت نشد' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // Only students can access this endpoint
    if (user.userType !== 'student') {
      return NextResponse.json(
        { success: false, message: 'این بخش فقط برای دانش‌آموزان در دسترس است' },
        { status: 403 }
      );
    }

    console.log("User from token:", user);

    // Load database configuration
    const dbConfig: DatabaseConfig = getDatabaseConfig();
    
    // Find database configuration for the domain
    const domainConfig = dbConfig[user.domain];
    if (!domainConfig) {
      return NextResponse.json(
        { success: false, message: 'دامنه مدرسه یافت نشد' },
        { status: 404 }
      );
    }

    console.log("Using connection string for domain:", user.domain);

    // Connect to MongoDB using domain-specific connection string
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      // Get current Persian year
      const currentDate = new Date();
      const [currentJYear] = gregorian_to_jalali(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate()
      );

      // Get student data to find their class codes
      const student = await db.collection('students').findOne({
        'data.studentCode': user.username,
        'data.schoolCode': user.schoolCode
      });

      if (!student || !student.data || !student.data.classCode || !Array.isArray(student.data.classCode) || student.data.classCode.length === 0) {
        await client.close();
        return NextResponse.json({
          success: true,
          data: {
            studentCode: parseInt(user.username),
            studentName: student?.data?.studentName + ' ' + student?.data?.studentFamily || 'دانش‌آموز',
            schoolYear: currentJYear.toString(),
            courseGrades: [],
            overallAverage: null
          }
        });
      }

      // Extract class codes from student data
      const studentClassCodes = student.data.classCode
        .filter((classObj: any) => classObj && typeof classObj === 'object' && classObj.value)
        .map((classObj: any) => classObj.value);

      console.log("Student class codes:", studentClassCodes);
      console.log("Looking for studentCode:", user.username);
      console.log("Looking for schoolCode:", user.schoolCode);

      // First, let's check if there are ANY records for this student
      const allStudentData = await db.collection('classsheet').find({
        studentCode: user.username,
        schoolCode: user.schoolCode
      }).toArray() as any[];
      console.log("All data for student:", allStudentData.length);

      // Fetch all grade data for this student
      let cellData = await db.collection('classsheet').find({
        studentCode: user.username, // Keep as string to match database format
        classCode: { $in: studentClassCodes },
        schoolCode: user.schoolCode,
        $or: [
          { 'grades.0': { $exists: true } },
          { 'assessments.0': { $exists: true } }
        ]
      }).sort({ date: -1 }).toArray() as any[];

      console.log("Found cell data with grades/assessments:", cellData.length);

      // If no data with grades/assessments, try to get any data for this student
      if (cellData.length === 0) {
        cellData = await db.collection('classsheet').find({
          studentCode: user.username,
          classCode: { $in: studentClassCodes },
          schoolCode: user.schoolCode
        }).sort({ date: -1 }).toArray() as any[];
        console.log("Found any cell data for student:", cellData.length);
      }

      // Get course and teacher information
      const courseCodes = [...new Set(cellData.map((cell: any) => cell.courseCode))];
      const teacherCodes = [...new Set(cellData.map((cell: any) => cell.teacherCode))];

      const [courses, teachers] = await Promise.all([
        db.collection('courses').find({
          'data.courseCode': { $in: courseCodes },
          'data.schoolCode': user.schoolCode
        }).toArray(),
        db.collection('teachers').find({
          'data.teacherCode': { $in: teacherCodes },
          'data.schoolCode': user.schoolCode
        }).toArray()
      ]);

      // Create maps for course and teacher names
      const courseMap = new Map();
      courses.forEach((course: any) => {
        courseMap.set(course.data.courseCode, course.data.courseName);
      });

      const teacherMap = new Map();
      teachers.forEach((teacher: any) => {
        const fullName = `${teacher.data.teacherName || teacher.data.teacherCode}`;
        teacherMap.set(teacher.data.teacherCode, fullName);
      });

      // Filter data for current school year (7-12 in previous year, 1-6 in current year)
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
            // First half of school year (Fall/Winter)
            return cellYear.toString() === currentJYear.toString();
          } else {
            // Second half of school year (Spring/Summer)
            return cellYear.toString() === (currentJYear + 1).toString();
          }
        } catch (err) {
          console.error("Error processing date:", cell.date, err);
          return false;
        }
      });

      // Group data by course
      const courseGroups = new Map<string, any[]>();
      filteredCellData.forEach((cell: any) => {
        const key = `${cell.courseCode}-${cell.teacherCode}`;
        if (!courseGroups.has(key)) {
          courseGroups.set(key, []);
        }
        courseGroups.get(key)!.push(cell);
      });

      // Process each course
      const courseGrades: CourseGrade[] = [];
      let totalFinalScore = 0;
      let coursesWithScores = 0;

      for (const [courseKey, courseCells] of courseGroups) {
        const [courseCode, teacherCode] = courseKey.split('-');
        const courseName = courseMap.get(courseCode) || courseCode;
        const teacherName = teacherMap.get(teacherCode) || teacherCode;

        // Initialize monthly grades structure
        const monthlyGrades: MonthlyGrade[] = [];
        for (let i = 1; i <= 12; i++) {
          monthlyGrades.push({
            month: i,
            monthName: PERSIAN_MONTHS[i - 1],
            grades: [],
            assessments: [],
            averageGrade: null,
            finalScore: null,
            gradeCount: 0,
            assessmentCount: 0
          });
        }

        // Populate with actual data
        courseCells.forEach((cell: any) => {
          if (!cell.date) return;

          try {
            const cellDate = new Date(cell.date);
            const [, cellMonth] = gregorian_to_jalali(
              cellDate.getFullYear(),
              cellDate.getMonth() + 1,
              cellDate.getDate()
            );

            const monthIndex = cellMonth - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
              const monthData = monthlyGrades[monthIndex];

              // Add grades
              if (cell.grades && cell.grades.length > 0) {
                monthData.grades.push(...cell.grades);
                monthData.gradeCount += cell.grades.length;
              }

              // Add assessments
              if (cell.assessments && cell.assessments.length > 0) {
                monthData.assessments.push(...cell.assessments);
                monthData.assessmentCount += cell.assessments.length;
              }
            }
          } catch (err) {
            console.error("Error processing cell date:", cell.date, err);
          }
        });

        // Calculate averages and final scores for each month
        let courseTotalFinalScore = 0;
        let monthsWithScores = 0;
        let totalGrades = 0;
        let totalAssessments = 0;

        monthlyGrades.forEach((monthData) => {
          totalGrades += monthData.gradeCount;
          totalAssessments += monthData.assessmentCount;

          // Calculate average grade if there are grades
          if (monthData.grades.length > 0) {
            monthData.averageGrade = monthData.grades.reduce((sum, grade) => sum + grade.value, 0) / monthData.grades.length;
          }

          // Calculate final score (grades adjusted by assessments)
          monthData.finalScore = calculateFinalScore(monthData.grades, monthData.assessments);

          if (monthData.finalScore !== null) {
            courseTotalFinalScore += monthData.finalScore;
            monthsWithScores++;
          }
        });

        // Calculate course year average
        const yearAverage = monthsWithScores > 0 ? courseTotalFinalScore / monthsWithScores : null;

        if (yearAverage !== null) {
          totalFinalScore += yearAverage;
          coursesWithScores++;
        }

        courseGrades.push({
          courseCode,
          courseName,
          teacherCode,
          teacherName,
          monthlyGrades,
          yearAverage,
          totalGrades,
          totalAssessments
        });
      }

      // Calculate overall average
      const overallAverage = coursesWithScores > 0 ? totalFinalScore / coursesWithScores : null;

      await client.close();

      const studentGradeData: StudentGradeData = {
        studentCode: parseInt(user.username),
        studentName: `${student.data.studentName} ${student.data.studentFamily}`,
        schoolYear: currentJYear.toString(),
        courseGrades,
        overallAverage
      };

      return NextResponse.json({
        success: true,
        data: studentGradeData
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
    console.error('Monthly grades API error:', error);
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
