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

// Helper function for Persian date conversion (EXACT copy from ReportCards.tsx)
function gregorian_to_jalali(gy: number, gm: number, gd: number): [number, number, number] {
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

// Assessment values mapping (EXACT same as web version)
const ASSESSMENT_VALUES_MAP: Record<string, number> = {
  'عالی': 2,
  'خوب': 1,
  'متوسط': 0,
  'ضعیف': -1,
  'بسیار ضعیف': -2,
};

// Calculate final score with assessments (EXACT same as web version)
function calculateFinalScore(
  grades: number | null,
  assessments: Array<{ value: string; title?: string }>,
  courseKey: string,
  assessmentValues: Record<string, Record<string, number>>
): number | null {
  if (grades === null) return null;

  // If no assessments, return the average grade
  if (!assessments || assessments.length === 0) return grades;

  // Get course-specific assessment values if available
  const courseValues = assessmentValues[courseKey] || {};

  // Calculate direct assessment adjustment (add/subtract directly)
  const assessmentAdjustment = assessments.reduce((total, assessment) => {
    // Check if there's a custom value for this assessment
    const adjustment =
      courseValues[assessment.value] !== undefined
        ? courseValues[assessment.value]
        : ASSESSMENT_VALUES_MAP[assessment.value] || 0;

    return total + adjustment;
  }, 0);

  // Calculate final score with direct addition of assessment adjustment
  let finalScore = grades + assessmentAdjustment;

  // Cap at 20
  finalScore = Math.min(finalScore, 20);

  // Ensure not negative
  finalScore = Math.max(finalScore, 0);

  return finalScore;
}

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const studentCode = searchParams.get('studentCode');

    if (!studentCode) {
      return NextResponse.json(
        { success: false, message: 'کد دانش‌آموز الزامی است' },
        { status: 400 }
      );
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

    // Connect to MongoDB
    const client = new MongoClient(domainConfig.connectionString);
    await client.connect();

    const dbName = domainConfig.connectionString.split('/')[3].split('?')[0];
    const db = client.db(dbName);

    try {
      // Get student info
      const student = await db.collection('students').findOne({
        'data.studentCode': studentCode,
        'data.schoolCode': decoded.schoolCode,
      });

      if (!student) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'دانش‌آموز یافت نشد' },
          { status: 404 }
        );
      }

      const studentName = `${student.data.studentName || ''} ${student.data.studentFamily || ''}`.trim();
      const classCode = student.data.classCode?.[0]?.value || '';

      console.log(`Student: ${studentName}, Code: ${studentCode}, Class: ${classCode}`);

      if (!classCode) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'کلاس دانش‌آموز یافت نشد' },
          { status: 404 }
        );
      }

      // Get class info with courses
      const classDoc = await db.collection('classes').findOne({
        'data.classCode': classCode,
        'data.schoolCode': decoded.schoolCode,
      });

      if (!classDoc || !classDoc.data) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'کلاس یافت نشد' },
          { status: 404 }
        );
      }

      // Get courses info
      const courseCodes = classDoc.data.teachers?.map((t: any) => t.courseCode) || [];
      const courses = await db.collection('courses').find({
        'data.courseCode': { $in: courseCodes },
        'data.schoolCode': decoded.schoolCode,
      }).toArray();

      const courseMap = new Map(
        courses.map((c: any) => [c.data.courseCode, c.data])
      );

      // Get current Persian year for school year filtering
      const currentDate = new Date();
      const [currentJYear, currentJMonth] = gregorian_to_jalali(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate()
      );

      // Determine the selected school year (current year)
      const selectedYear = currentJYear;

      // Get classsheet data for this student
      const allClassheetCells = await db.collection('classsheet').find({
        studentCode: studentCode,
        schoolCode: decoded.schoolCode,
      }).toArray();

      // Filter for the selected school year
      // School year logic: months 7-12 from selectedYear, months 1-6 from selectedYear+1
      const classheetCells = allClassheetCells.filter((cell: any) => {
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
            return cellYear === selectedYear;
          } else {
            // Second half of school year (Spring/Summer)
            return cellYear === selectedYear + 1;
          }
        } catch (err) {
          console.error('Error filtering cell date:', cell.date, err);
          return false;
        }
      });

      console.log(`Filtered ${classheetCells.length} cells out of ${allClassheetCells.length} for school year ${selectedYear}`);
      
      if (classheetCells.length > 0) {
        console.log('Sample filtered cell:', {
          date: classheetCells[0].date,
          persianMonth: classheetCells[0].persianMonth,
          courseCode: classheetCells[0].courseCode,
          grades: classheetCells[0].grades
        });
      }

      // Build report card data
      const reportCardData: any = {
        studentCode: studentCode,
        studentName: studentName,
        className: classDoc.data.className,
        classCode: classCode,
        courses: {},
        weightedAverage: null,
      };

      // Fetch custom assessment values for all teacher-course pairs
      const assessmentValues: Record<string, Record<string, number>> = {};
      
      console.log(`Fetching custom assessment values for ${classDoc.data.teachers?.length || 0} courses...`);
      
      for (const tc of classDoc.data.teachers || []) {
        try {
          // Fetch custom assessment values for this teacher-course pair
          const assessmentResponse = await fetch(
            `http://localhost:3000/api/assessments?teacherCode=${tc.teacherCode}&courseCode=${tc.courseCode}&schoolCode=${decoded.schoolCode}`
          );

          if (assessmentResponse.ok) {
            const assessmentData = await assessmentResponse.json();
            if (assessmentData && assessmentData.data && Array.isArray(assessmentData.data)) {
              // Process assessment data to extract custom values
              const customValues: Record<string, number> = {};
              assessmentData.data.forEach((assessment: { value?: string; weight?: number }) => {
                if (assessment && assessment.value && assessment.weight !== undefined) {
                  customValues[assessment.value] = assessment.weight;
                }
              });

              if (Object.keys(customValues).length > 0) {
                assessmentValues[tc.courseCode] = customValues;
                console.log(`  Custom assessments for ${tc.courseCode}:`, customValues);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching assessment values for ${tc.courseCode}:`, error);
        }
      }

      // Process each course
      console.log(`Processing ${classDoc.data.teachers?.length || 0} courses for class ${classCode}`);
      
      classDoc.data.teachers?.forEach((tc: any) => {
        const courseData = courseMap.get(tc.courseCode);
        if (!courseData) {
          console.log(`  Skipping course ${tc.courseCode} - no course data found`);
          return;
        }

        const courseName = courseData.courseName || tc.courseCode;
        const vahed = parseInt(courseData.vahed) || 1;

        // Get teacher info
        const teacherName = tc.teacherName || '';

        const courseKey = tc.courseCode;
        reportCardData.courses[courseKey] = {
          courseCode: tc.courseCode,
          courseName: courseName,
          teacherName: teacherName,
          vahed: vahed,
          monthlyGrades: {},
          monthlyRawGrades: {},
          monthlyAssessments: {},
          yearAverage: null,
        };

        // Initialize monthly data
        for (let i = 1; i <= 12; i++) {
          const monthKey = i.toString();
          reportCardData.courses[courseKey].monthlyGrades[monthKey] = null;
          reportCardData.courses[courseKey].monthlyRawGrades[monthKey] = [];
          reportCardData.courses[courseKey].monthlyAssessments[monthKey] = [];
        }

        // Process classsheet cells for this course
        const studentCells = classheetCells.filter(
          (cell: any) => cell.courseCode === tc.courseCode && cell.teacherCode === tc.teacherCode
        );

        console.log(`Processing course ${courseKey} (${courseName}): found ${studentCells.length} cells`);

        studentCells.forEach((cell: any, cellIndex: number) => {
          const cellDate = new Date(cell.date);
          const [jYear, jMonth] = gregorian_to_jalali(
            cellDate.getFullYear(),
            cellDate.getMonth() + 1,
            cellDate.getDate()
          );

          const monthKey = jMonth.toString();
          
          console.log(`  Cell ${cellIndex}: date=${cell.date}, persianMonth=${cell.persianMonth}, jMonth=${jMonth}, monthKey=${monthKey}, grades=${cell.grades?.length || 0}`);

          // Ensure arrays exist before pushing
          if (!reportCardData.courses[courseKey].monthlyRawGrades[monthKey]) {
            reportCardData.courses[courseKey].monthlyRawGrades[monthKey] = [];
          }
          if (!reportCardData.courses[courseKey].monthlyAssessments[monthKey]) {
            reportCardData.courses[courseKey].monthlyAssessments[monthKey] = [];
          }

          // Collect raw grades
          if (cell.grades && cell.grades.length > 0) {
            console.log(`  Month ${monthKey}: Adding ${cell.grades.length} grades:`, cell.grades);
            reportCardData.courses[courseKey].monthlyRawGrades[monthKey].push(...cell.grades);
          }

          // Collect assessments
          if (cell.assessments && cell.assessments.length > 0) {
            console.log(`  Month ${monthKey}: Adding ${cell.assessments.length} assessments:`, cell.assessments);
            reportCardData.courses[courseKey].monthlyAssessments[monthKey].push(...cell.assessments);
          }
        });

        // Calculate monthly grades (same logic as web version)
        for (let month = 1; month <= 12; month++) {
          const monthKey = month.toString();
          const rawGrades = reportCardData.courses[courseKey].monthlyRawGrades?.[monthKey] || [];
          const assessments = reportCardData.courses[courseKey].monthlyAssessments?.[monthKey] || [];

          if (rawGrades && rawGrades.length > 0) {
            // Calculate base grade normalized to 20
            // This handles grades with different totalPoints (e.g., 5/10, 16/20)
            const totalValue = rawGrades.reduce((sum: number, grade: any) => sum + grade.value, 0);
            const totalPoints = rawGrades.reduce((sum: number, grade: any) => sum + (grade.totalPoints || 20), 0);
            
            // Normalize to base 20: (achieved/possible) × 20
            const baseGrade = totalPoints > 0 ? (totalValue / totalPoints) * 20 : 0;

            console.log(`Course ${courseKey}, Month ${monthKey}: rawGrades=${rawGrades.length}, totalValue=${totalValue}, totalPoints=${totalPoints}, baseGrade=${baseGrade}`);

            // Apply assessments with custom values
            reportCardData.courses[courseKey].monthlyGrades[monthKey] = calculateFinalScore(
              baseGrade,
              assessments,
              courseKey,
              assessmentValues
            );
            
            console.log(`Course ${courseKey}, Month ${monthKey}: finalGrade=${reportCardData.courses[courseKey].monthlyGrades[monthKey]}`);
          }
        }

        // Calculate year average
        const grades = Object.values(reportCardData.courses[courseKey].monthlyGrades).filter(
          (grade: any) => grade !== null
        ) as number[];

        if (grades.length > 0) {
          reportCardData.courses[courseKey].yearAverage =
            grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length;
        }
      });

      // Calculate weighted average
      let totalWeightedSum = 0;
      let totalWeight = 0;

      Object.values(reportCardData.courses).forEach((course: any) => {
        if (course.yearAverage !== null) {
          totalWeightedSum += course.yearAverage * course.vahed;
          totalWeight += course.vahed;
        }
      });

      if (totalWeight > 0) {
        reportCardData.weightedAverage = totalWeightedSum / totalWeight;
      }

      // Clean up raw data for mobile response and log final data
      Object.keys(reportCardData.courses).forEach((courseKey) => {
        const course = reportCardData.courses[courseKey];
        console.log(`Final course ${courseKey}: yearAverage=${course.yearAverage}`);
        console.log(`  Monthly grades:`, course.monthlyGrades);
        delete reportCardData.courses[courseKey].monthlyRawGrades;
        delete reportCardData.courses[courseKey].monthlyAssessments;
      });

      console.log(`Overall weighted average: ${reportCardData.weightedAverage}`);
      console.log(`Total courses: ${Object.keys(reportCardData.courses).length}`);

      await client.close();

      return NextResponse.json({
        success: true,
        data: reportCardData,
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
    console.error('Report card API error:', error);
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

