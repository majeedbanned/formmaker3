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

type AssessmentWeightSource = 'explicit' | 'custom' | 'default';

// Assessment values with weights
const ASSESSMENT_VALUES_MAP: Record<string, number> = {
  عالی: 2,
  خوب: 1,
  متوسط: 0,
  ضعیف: -1,
  "بسیار ضعیف": -2,
};

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

// Calculate final score (same as teacher monthly grades)
function calculateFinalScore(
  grades: GradeEntry[], 
  assessments: AssessmentEntry[], 
  customAssessmentValues: Record<string, number>
): { finalScore: number | null; baseGrade: number | null; assessmentAdjustment: number } {
  if (grades.length === 0) {
    const assessmentAdjustment = assessments.reduce((total, assessment) => {
      let appliedWeight = 0;
      if (assessment.weight !== undefined && assessment.weight !== null) {
        appliedWeight = Number(assessment.weight);
      } else if (customAssessmentValues[assessment.value] !== undefined) {
        appliedWeight = customAssessmentValues[assessment.value];
      } else {
        appliedWeight = ASSESSMENT_VALUES_MAP[assessment.value] || 0;
      }
      return total + appliedWeight;
    }, 0);

    return {
      finalScore: null,
      baseGrade: null,
      assessmentAdjustment,
    };
  }

  // Calculate base grade normalized to 20
  const totalValue = grades.reduce((sum, grade) => sum + grade.value, 0);
  const totalPoints = grades.reduce((sum, grade) => sum + (grade.totalPoints || 20), 0);
  
  // Normalize to base 20: (achieved/possible) × 20
  const baseGrade = totalPoints > 0 ? (totalValue / totalPoints) * 20 : 0;

  // If no assessments, return the base grade
  if (!assessments || assessments.length === 0) {
    return {
      finalScore: baseGrade,
      baseGrade,
      assessmentAdjustment: 0,
    };
  }

  // Calculate direct assessment adjustment
  const assessmentAdjustment = assessments.reduce((total, assessment) => {
    let appliedWeight = 0;
    if (assessment.weight !== undefined && assessment.weight !== null) {
      appliedWeight = Number(assessment.weight);
    } else if (customAssessmentValues[assessment.value] !== undefined) {
      appliedWeight = customAssessmentValues[assessment.value];
    } else {
      appliedWeight = ASSESSMENT_VALUES_MAP[assessment.value] || 0;
    }
    return total + appliedWeight;
  }, 0);

  // Calculate final score with direct addition of assessment adjustment
  let finalScore = baseGrade + assessmentAdjustment;

  // Cap at 20
  finalScore = Math.min(finalScore, 20);

  // Ensure not negative
  finalScore = Math.max(finalScore, 0);

  return {
    finalScore,
    baseGrade,
    assessmentAdjustment,
  };
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

    // Check if user is student or school
    if (decoded.userType !== 'student' && decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    // Get classCode, month, year, and pagination params from query params
    const { searchParams } = new URL(request.url);
    const classCode = searchParams.get('classCode');
    const monthParam = searchParams.get('month'); // 1-12 (Jalali month)
    const yearParam = searchParams.get('year'); // Jalali year
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Validate pagination parameters
    const validatedLimit = Math.min(Math.max(limit, 1), 100); // Between 1 and 100
    const validatedOffset = Math.max(offset, 0); // Non-negative

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
      let classCodes: string[] = [];

      // For school users, use the provided classCode
      if (decoded.userType === 'school') {
        if (!classCode) {
          await client.close();
          return NextResponse.json(
            { success: false, message: 'کد کلاس الزامی است' },
            { status: 400 }
          );
        }
        classCodes = [classCode];
      } else {
        // For students, get their class codes
        const currentStudentCode = decoded.username;

        // Get current student information
        const currentStudent = await db.collection('students').findOne({
          'data.studentCode': currentStudentCode,
          'data.schoolCode': decoded.schoolCode
        });

        if (!currentStudent) {
          await client.close();
          return NextResponse.json(
            { success: false, message: 'اطلاعات دانش‌آموز یافت نشد' },
            { status: 404 }
          );
        }

        // Get student's class codes
        classCodes = (currentStudent.data.classCode || [])
          .filter((c: any) => c && typeof c === 'object' && c.value)
          .map((c: any) => c.value);

        if (classCodes.length === 0) {
          await client.close();
          return NextResponse.json({
            success: true,
            data: {
              overallRanking: [],
              currentUserRank: 0,
              currentUser: null,
              courseRankings: {},
              classStats: {
                totalStudents: 0,
                classAverage: null,
                studentRank: 0,
                totalCourses: 0
              }
            }
          });
        }
      }

      // Get current Persian year and month
      const currentDate = new Date();
      const [currentJYear, currentJMonth] = gregorian_to_jalali(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate()
      );

      // Determine the school year to use (default to current year)
      const selectedYear = yearParam ? parseInt(yearParam) : currentJYear;
      const selectedMonth = monthParam ? parseInt(monthParam) : null;

      // Get all students in the specified class(es)
      const allStudents = await db.collection('students').find({
        'data.schoolCode': decoded.schoolCode,
        'data.classCode.value': { $in: classCodes }
      }).toArray();

      // Create student map
      const studentMap = new Map();
      allStudents.forEach((student: any) => {
        const studentClassCodes = (student.data.classCode || [])
          .filter((c: any) => c && typeof c === 'object' && c.value)
          .map((c: any) => c.value);
        
        // Only include students who share at least one class
        const hasCommonClass = studentClassCodes.some((code: string) => classCodes.includes(code));
        if (hasCommonClass) {
          studentMap.set(student.data.studentCode, {
            studentCode: student.data.studentCode,
            studentName: student.data.studentName || '',
            studentFamily: student.data.studentFamily || '',
            avatar: student.data?.avatar || null
          });
        }
      });

      const allStudentCodes = Array.from(studentMap.keys());

      // Fetch all grade data for these students
      const cellData = await db.collection('classsheet').find({
        studentCode: { $in: allStudentCodes },
        schoolCode: decoded.schoolCode
      }).sort({ date: -1 }).toArray() as any[];

      // Filter data for selected school year and month
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

          // School year logic: months 7-12 from selected year, months 1-6 from next year
          let matchesYear = false;
          if (cellMonth >= 7) {
            matchesYear = cellYear.toString() === selectedYear.toString();
          } else {
            matchesYear = cellYear.toString() === (selectedYear + 1).toString();
          }

          // If month is specified, also filter by month
          if (selectedMonth !== null) {
            return matchesYear && cellMonth === selectedMonth;
          }

          return matchesYear;
        } catch (err) {
          return false;
        }
      });

      // Fetch assessment values (matching ReportCards logic)
      // ReportCards fetches assessment values per teacher-course via /api/assessments
      // Since we group by courseCode only, we'll fetch all global assessment values
      // and teacher-specific ones that might apply
      const courseAssessmentValues: Record<string, Record<string, number>> = {};
      
      // Get unique teacher-course pairs from cellData for more accurate assessment values
      const teacherCoursePairs = new Set<string>();
      filteredCellData.forEach((cell: any) => {
        if (cell.courseCode && cell.teacherCode) {
          teacherCoursePairs.add(`${cell.teacherCode}_${cell.courseCode}`);
        }
      });

      // Get unique course codes
      const uniqueCourseCodes = new Set<string>();
      filteredCellData.forEach((cell: any) => {
        if (cell.courseCode) {
          uniqueCourseCodes.add(cell.courseCode);
        }
      });

      // Get unique teacher codes
      const uniqueTeacherCodes = new Set<string>();
      filteredCellData.forEach((cell: any) => {
        if (cell.teacherCode) {
          uniqueTeacherCodes.add(cell.teacherCode);
        }
      });

      // Fetch global assessment values
      const globalAssessments: Record<string, number> = {};
      try {
        const globalAssessmentsData = await db.collection('assessments').find({
          schoolCode: decoded.schoolCode,
          type: 'value',
          isGlobal: true
        }).toArray();

        globalAssessmentsData.forEach((assessment: any) => {
          const valueKey = assessment?.value ?? assessment?.data?.value;
          const valueWeight = assessment?.weight ?? assessment?.data?.weight;

          if (valueKey && valueWeight !== undefined) {
            globalAssessments[valueKey] = Number(valueWeight);
          }
        });
      } catch (err) {
        console.error('Error fetching global assessments:', err);
      }

      // For each course, fetch teacher-specific assessment values and merge with global
      // ReportCards stores per courseCode, with teacher-specific ones overriding
      for (const courseCode of uniqueCourseCodes) {
        const courseValues: Record<string, number> = { ...globalAssessments }; // Start with global

        // Fetch teacher-specific assessment values for teachers that teach this course
        try {
          const teacherAssessmentsData = await db.collection('assessments').find({
            schoolCode: decoded.schoolCode,
            type: 'value',
            teacherCode: { $in: Array.from(uniqueTeacherCodes) }
          }).toArray();

          // Add teacher-specific values (they override global)
          teacherAssessmentsData.forEach((assessment: any) => {
            // Only use if this teacher teaches this course (we can't easily check, so include all)
            const valueKey = assessment?.value ?? assessment?.data?.value;
            const valueWeight = assessment?.weight ?? assessment?.data?.weight;

            if (valueKey && valueWeight !== undefined) {
              courseValues[valueKey] = Number(valueWeight);
            }
          });
        } catch (err) {
          console.error(`Error fetching teacher assessments for course ${courseCode}:`, err);
        }

        if (Object.keys(courseValues).length > 0) {
          courseAssessmentValues[courseCode] = courseValues;
        }
      }

      // Get all courses
      const courseCodes = new Set<string>();
      filteredCellData.forEach((cell: any) => {
        if (cell.courseCode) {
          courseCodes.add(cell.courseCode);
        }
      });

      const courses = await db.collection('courses').find({
        'data.courseCode': { $in: Array.from(courseCodes) },
        'data.schoolCode': decoded.schoolCode
      }).toArray();

      const courseMap = new Map();
      const courseVahedMap = new Map<string, number>(); // Store vahed (credits) per course
      courses.forEach((course: any) => {
        const courseCode = course.data.courseCode;
        const courseName = course.data.courseName || courseCode;
        const vahed = Number(course.data.vahed ?? 1) || 1; // Default to 1 if not specified (matching ReportCards)
        courseMap.set(courseCode, courseName);
        courseVahedMap.set(courseCode, vahed);
      });

      // Calculate averages for each student and course
      const studentAverages: Record<string, { overall: number; courses: Record<string, number> }> = {};

      allStudentCodes.forEach(studentCode => {
        studentAverages[studentCode] = {
          overall: 0,
          courses: {}
        };
      });

      // Group data by student and course
      const studentCourseData = new Map<string, Map<string, any[]>>();
      
      filteredCellData.forEach((cell: any) => {
        if (!studentCourseData.has(cell.studentCode)) {
          studentCourseData.set(cell.studentCode, new Map());
        }
        const studentData = studentCourseData.get(cell.studentCode)!;
        
        if (!studentData.has(cell.courseCode)) {
          studentData.set(cell.courseCode, []);
        }
        studentData.get(cell.courseCode)!.push(cell);
      });

      // Calculate course averages and overall averages
      // Match ReportCards logic:
      // 1. Course average (yearAverage) = average of monthly finalScores for that course
      // 2. Overall average (weightedAverage) = weighted average of course averages based on vahed (credits)
      studentCourseData.forEach((coursesData, studentCode) => {
        const courseAverages: Array<{ average: number; vahed: number }> = [];

        coursesData.forEach((cells, courseCode) => {
          // Group by month
          const monthlyData: Record<string, { grades: GradeEntry[], assessments: AssessmentEntry[] }> = {};
          
          for (let i = 1; i <= 12; i++) {
            monthlyData[i.toString()] = { grades: [], assessments: [] };
          }

          cells.forEach((cell: any) => {
            if (!cell.date) return;

            try {
              const cellDate = new Date(cell.date);
              const [, cellMonth] = gregorian_to_jalali(
                cellDate.getFullYear(),
                cellDate.getMonth() + 1,
                cellDate.getDate()
              );

              const monthKey = cellMonth.toString();
              
              if (cell.grades && cell.grades.length > 0) {
                monthlyData[monthKey].grades.push(...cell.grades);
              }

              if (cell.assessments && cell.assessments.length > 0) {
                monthlyData[monthKey].assessments.push(...cell.assessments);
              }
            } catch (err) {
              // Skip invalid dates
            }
          });

          // Get course-specific assessment values (matching ReportCards logic)
          // ReportCards uses: courseValues = assessmentValues[courseKey] || {}
          const courseSpecificAssessments = courseAssessmentValues[courseCode] || {};

          // Calculate monthly finalScores for this course
          // Match ReportCards logic: collect all raw grades per month, then calculate
          const monthlyFinalScores: number[] = [];

          // If a specific month is selected, only calculate that month
          if (selectedMonth !== null) {
            const monthKey = selectedMonth.toString();
            const { grades, assessments } = monthlyData[monthKey];
            const calculation = calculateFinalScore(grades, assessments, courseSpecificAssessments);

            if (calculation.finalScore !== null) {
              monthlyFinalScores.push(calculation.finalScore);
            }
          } else {
            // Calculate for all months (year average)
            // Match ReportCards: loop through all months 1-12, calculate finalScore for each
            for (let i = 1; i <= 12; i++) {
              const monthKey = i.toString();
              const { grades, assessments } = monthlyData[monthKey];
              const calculation = calculateFinalScore(grades, assessments, courseSpecificAssessments);

              if (calculation.finalScore !== null) {
                monthlyFinalScores.push(calculation.finalScore);
              }
            }
          }

          // Calculate course average = average of monthly finalScores (matching ReportCards logic)
          // ReportCards: yearAverage = grades.reduce((sum, grade) => sum + grade, 0) / grades.length
          if (monthlyFinalScores.length > 0) {
            const courseAverage = monthlyFinalScores.reduce((sum, score) => sum + score, 0) / monthlyFinalScores.length;
            studentAverages[studentCode].courses[courseCode] = courseAverage;
            // Store course average with vahed for weighted average calculation
            const vahed = courseVahedMap.get(courseCode) || 1;
            courseAverages.push({
              average: courseAverage,
              vahed: vahed
            });
          }
        });

        // Calculate overall average = weighted average of all course averages (matching ReportCards weightedAverage logic)
        // ReportCards: weightedAverage = (sum of course.yearAverage * vahed) / (sum of vahed)
        // Math.round((weightedSum / totalWeight) * 100) / 100
        if (courseAverages.length > 0) {
          let weightedSum = 0;
          let totalWeight = 0;
          
          courseAverages.forEach(({ average, vahed }) => {
            const numericVahed = Number(vahed ?? 1) || 1;
            weightedSum += average * numericVahed;
            totalWeight += numericVahed;
          });

          if (totalWeight > 0) {
            // Match ReportCards rounding: Math.round((weightedSum / totalWeight) * 100) / 100
            studentAverages[studentCode].overall = Math.round((weightedSum / totalWeight) * 100) / 100;
          }
        }
      });

      // Build overall ranking
      const overallRankingData = allStudentCodes.map(studentCode => {
        const student = studentMap.get(studentCode);
        return {
          studentCode,
          studentName: student?.studentName || '',
          studentFamily: student?.studentFamily || '',
          avatar: student?.avatar || null,
          average: studentAverages[studentCode]?.overall || 0,
          rank: 0 // Will be set after sorting
        };
      });

      // Sort by average descending
      overallRankingData.sort((a, b) => {
        // Sort by average descending, then by student code ascending for consistent ordering
        if (b.average !== a.average) {
          return b.average - a.average;
        }
        return a.studentCode.localeCompare(b.studentCode);
      });

      // Assign ranks with tie handling (standard competition ranking)
      let currentRank = 1;
      for (let i = 0; i < overallRankingData.length; i++) {
        if (i === 0) {
          // First student always gets rank 1
          overallRankingData[i].rank = 1;
        } else {
          const prevAverage = overallRankingData[i - 1].average;
          const currentAverage = overallRankingData[i].average;
          // Use a small epsilon for floating point comparison
          if (Math.abs(prevAverage - currentAverage) > 0.001) {
            // Different grade - update rank to current position (1-based index)
            currentRank = i + 1;
          }
          // If same grade, keep currentRank (students share the same rank)
          overallRankingData[i].rank = currentRank;
        }
      }

      // Find current user in overall ranking (only for students) - before pagination
      const currentStudentCode = decoded.userType === 'student' ? decoded.username : null;
      const currentUserOverall = currentStudentCode ? overallRankingData.find(s => s.studentCode === currentStudentCode) : null;
      const currentUserRank = currentUserOverall?.rank || 0;

      // Apply pagination to overall ranking
      const totalCount = overallRankingData.length;
      const paginatedOverallRanking = overallRankingData.slice(validatedOffset, validatedOffset + validatedLimit);
      const hasMore = validatedOffset + validatedLimit < totalCount;

      // Build course-specific rankings with course names
      const courseRankings: Record<string, any> = {};

      Array.from(courseCodes).forEach((courseCode) => {
        const courseName = courseMap.get(courseCode) || courseCode;
        
        const courseRankingData = allStudentCodes
          .filter(studentCode => {
            const avg = studentAverages[studentCode]?.courses[courseCode];
            return avg !== undefined && avg !== null;
          })
          .map(studentCode => {
            const student = studentMap.get(studentCode);
            return {
              studentCode,
              studentName: student?.studentName || '',
              studentFamily: student?.studentFamily || '',
              avatar: student?.avatar || null,
              average: studentAverages[studentCode]?.courses[courseCode] || 0,
              rank: 0
            };
          });

        // Sort by average descending
        courseRankingData.sort((a, b) => {
          // Sort by average descending, then by student code ascending for consistent ordering
          if (b.average !== a.average) {
            return b.average - a.average;
          }
          return a.studentCode.localeCompare(b.studentCode);
        });

        // Assign ranks with tie handling (standard competition ranking)
        let currentRank = 1;
        for (let i = 0; i < courseRankingData.length; i++) {
          if (i === 0) {
            // First student always gets rank 1
            courseRankingData[i].rank = 1;
          } else {
            const prevAverage = courseRankingData[i - 1].average;
            const currentAverage = courseRankingData[i].average;
            // Use a small epsilon for floating point comparison
            if (Math.abs(prevAverage - currentAverage) > 0.001) {
              // Different grade - update rank to current position (1-based index)
              currentRank = i + 1;
            }
            // If same grade, keep currentRank (students share the same rank)
            courseRankingData[i].rank = currentRank;
          }
        }

        courseRankings[courseCode] = {
          courseCode,
          courseName,
          rankings: courseRankingData
        };
      });

      // Calculate class statistics
      const totalStudents = allStudentCodes.length;
      const overallAverages = overallRankingData.map(s => s.average).filter(avg => avg > 0);
      const classAverage = overallAverages.length > 0 
        ? overallAverages.reduce((sum, avg) => sum + avg, 0) / overallAverages.length 
        : null;
      const totalCourses = courseCodes.size;

      await client.close();

      return NextResponse.json({
        success: true,
        data: {
          overallRanking: paginatedOverallRanking,
          currentUserRank,
          currentUser: currentUserOverall || null,
          courseRankings,
          classStats: {
            totalStudents,
            classAverage,
            studentRank: currentUserRank,
            totalCourses
          },
          pagination: {
            total: totalCount,
            offset: validatedOffset,
            limit: validatedLimit,
            hasMore
          }
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
    console.error('Student ranking API error:', error);
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

