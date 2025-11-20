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

    // Check if user is student
    if (decoded.userType !== 'student') {
      return NextResponse.json(
        { success: false, message: 'فقط دانش‌آموزان می‌توانند این بخش را مشاهده کنند' },
        { status: 403 }
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
      const classCodes = (currentStudent.data.classCode || [])
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

      // Get current Persian year
      const currentDate = new Date();
      const [currentJYear] = gregorian_to_jalali(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate()
      );

      // Get all students in the same class(es)
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
        const hasCommonClass = studentClassCodes.some(code => classCodes.includes(code));
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

      // Fetch all grade data for these students in current school year
      const cellData = await db.collection('classsheet').find({
        studentCode: { $in: allStudentCodes },
        schoolCode: decoded.schoolCode
      }).sort({ date: -1 }).toArray() as any[];

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

          // School year logic: months 7-12 from current year, months 1-6 from next year
          if (cellMonth >= 7) {
            return cellYear.toString() === currentJYear.toString();
          } else {
            return cellYear.toString() === (currentJYear + 1).toString();
          }
        } catch (err) {
          return false;
        }
      });

      // Fetch custom assessment values
      const customAssessmentValues: Record<string, number> = {};
      try {
        const assessmentsData = await db.collection('assessments').find({
          schoolCode: decoded.schoolCode,
          type: 'value',
          $or: [
            { isGlobal: true },
            { teacherCode: { $exists: false } }
          ]
        }).toArray();

        assessmentsData.forEach((assessment: any) => {
          const valueKey = assessment?.value ?? assessment?.data?.value;
          const valueWeight = assessment?.weight ?? assessment?.data?.weight;

          if (valueKey && valueWeight !== undefined) {
            customAssessmentValues[valueKey] = Number(valueWeight);
          }
        });
      } catch (assessmentError) {
        console.error('Error fetching custom assessments:', assessmentError);
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
      courses.forEach((course: any) => {
        courseMap.set(course.data.courseCode, course.data.courseName || course.data.courseCode);
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
      studentCourseData.forEach((coursesData, studentCode) => {
        const courseAverages: number[] = [];

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

          // Calculate monthly scores and average
          let yearTotal = 0;
          let monthsWithScores = 0;

          for (let i = 1; i <= 12; i++) {
            const monthKey = i.toString();
            const { grades, assessments } = monthlyData[monthKey];
            const calculation = calculateFinalScore(grades, assessments, customAssessmentValues);

            if (calculation.finalScore !== null) {
              yearTotal += calculation.finalScore;
              monthsWithScores++;
            }
          }

          const courseAverage = monthsWithScores > 0 ? yearTotal / monthsWithScores : null;
          if (courseAverage !== null) {
            studentAverages[studentCode].courses[courseCode] = courseAverage;
            courseAverages.push(courseAverage);
          }
        });

        // Calculate overall average (average of all course averages)
        if (courseAverages.length > 0) {
          studentAverages[studentCode].overall = courseAverages.reduce((sum, avg) => sum + avg, 0) / courseAverages.length;
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

      // Find current user in overall ranking
      const currentUserOverall = overallRankingData.find(s => s.studentCode === currentStudentCode);
      const currentUserRank = currentUserOverall?.rank || 0;

      // Build course-specific rankings with course names
      const courseRankings: Record<string, any> = {};

      Array.from(courseCodes).forEach(courseCode => {
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
          overallRanking: overallRankingData,
          currentUserRank,
          currentUser: currentUserOverall || null,
          courseRankings,
          classStats: {
            totalStudents,
            classAverage,
            studentRank: currentUserRank,
            totalCourses
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

