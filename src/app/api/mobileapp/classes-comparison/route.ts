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

// Calculate final score (matching ReportCards logic)
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

    // Only allow school users
    if (decoded.userType !== 'school') {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // 1-12 (Jalali month), null means all months (year average)
    const gradeParam = searchParams.get('grade'); // Grade level (required)
    const majorParam = searchParams.get('major'); // Major code (required)
    const courseCodeParam = searchParams.get('courseCode'); // Course code (optional)

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
      // Get current Persian year and month
      const currentDate = new Date();
      const [currentJYear, currentJMonth] = gregorian_to_jalali(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate()
      );

      // Use current year (year selection removed per requirements)
      const selectedYear = currentJYear;
      const selectedMonth = monthParam ? parseInt(monthParam) : null;

      // Optimized: Use aggregation to extract grade-major combinations and courses efficiently
      // This avoids loading all class documents into memory
      const gradeMajorAggregation = await db.collection('classes').aggregate([
        {
          $match: {
            'data.schoolCode': decoded.schoolCode
          }
        },
        {
          $project: {
            grade: '$data.Grade',
            major: '$data.major',
            teachers: {
              $ifNull: ['$data.teachers', []]
            }
          }
        },
        {
          $unwind: {
            path: '$teachers',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: {
              grade: '$grade',
              major: '$major'
            },
            courses: {
              $addToSet: '$teachers.courseCode'
            }
          }
        },
        {
          $project: {
            _id: 0,
            grade: '$_id.grade',
            major: '$_id.major',
            courses: {
              $filter: {
                input: '$courses',
                as: 'course',
                cond: { $ne: ['$$course', null] }
              }
            }
          }
        }
      ]).toArray();

      // Build grade-major map and collect all unique course codes
      const gradeMajorCoursesMap = new Map<string, Set<string>>();
      const gradeMajorMap = new Map<string, { grade: string; major: string; displayName: string }>();
      const allCourseCodes = new Set<string>();

      gradeMajorAggregation.forEach((item: any) => {
        const grade = item.grade || '';
        const major = item.major || '';
        const key = `${grade}_${major}`;
        
        // Track grade-major combinations
        if (!gradeMajorMap.has(key)) {
          gradeMajorMap.set(key, {
            grade,
            major,
            displayName: `${grade ? `پایه ${grade}` : 'بدون پایه'}${major ? ` - ${major}` : ''}`
          });
        }
        
        // Track courses for this grade-major
        if (item.courses && Array.isArray(item.courses)) {
          if (!gradeMajorCoursesMap.has(key)) {
            gradeMajorCoursesMap.set(key, new Set());
          }
          item.courses.forEach((courseCode: string) => {
            if (courseCode) {
              gradeMajorCoursesMap.get(key)!.add(courseCode);
              allCourseCodes.add(courseCode);
            }
          });
        }
      });

      // Only fetch course names for courses that exist in classes (not all courses)
      const courseMap = new Map<string, string>();
      if (allCourseCodes.size > 0) {
        const courses = await db.collection('courses').find(
          {
            'data.schoolCode': decoded.schoolCode,
            'data.courseCode': { $in: Array.from(allCourseCodes) }
          },
          {
            projection: {
              'data.courseCode': 1,
              'data.courseName': 1
            }
          }
        ).toArray();
        
        courses.forEach((course: any) => {
          const courseData = course.data || course;
          if (courseData.courseCode && courseData.courseName) {
            courseMap.set(courseData.courseCode, courseData.courseName);
          }
        });
      }

      // If no grade/major filters, return early with just combinations (lightweight response)
      if (!gradeParam && !majorParam) {
        // Prepare available grade-major combinations with their courses
        const gradeMajorCombinations = Array.from(gradeMajorMap.entries()).map(([key, info]) => {
          const courseCodes = Array.from(gradeMajorCoursesMap.get(key) || []);
          const courses = courseCodes.map(courseCode => ({
            courseCode,
            courseName: courseMap.get(courseCode) || courseCode,
          })).sort((a, b) => a.courseName.localeCompare(b.courseName));
          
          return {
            grade: info.grade,
            major: info.major,
            displayName: info.displayName,
            courses,
          };
        }).sort((a, b) => {
          // Sort by grade first, then major
          if (a.grade !== b.grade) {
            return a.grade.localeCompare(b.grade);
          }
          return a.major.localeCompare(b.major);
        });

        await client.close();

        return NextResponse.json({
          success: true,
          data: {
            gradeMajorCombinations,
          }
        });
      }

      // Only load full class data if we need to calculate statistics (filters provided)
      const queryFilter: any = {
        'data.schoolCode': decoded.schoolCode
      };
      
      if (gradeParam) {
        queryFilter['data.Grade'] = gradeParam;
      }
      
      if (majorParam) {
        queryFilter['data.major'] = majorParam;
      }
      
      const classes = await db.collection('classes').find(queryFilter).toArray();

      // If no classes found, return empty comparison groups but still return combinations
      if (!classes || classes.length === 0) {
        await client.close();
        
        return NextResponse.json({
          success: true,
          data: {
            comparisonGroups: [],
            selectedYear,
            selectedMonth,
            gradeMajorCombinations: Array.from(gradeMajorMap.entries()).map(([key, info]) => {
              const courseCodes = Array.from(gradeMajorCoursesMap.get(key) || []);
              const courses = courseCodes.map(courseCode => ({
                courseCode,
                courseName: courseMap.get(courseCode) || courseCode,
              })).sort((a, b) => a.courseName.localeCompare(b.courseName));
              
              return {
                grade: info.grade,
                major: info.major,
                displayName: info.displayName,
                courses,
              };
            }).sort((a, b) => {
              if (a.grade !== b.grade) {
                return a.grade.localeCompare(b.grade);
              }
              return a.major.localeCompare(b.major);
            }),
          }
        });
      }

      // Group classes by major and Grade
      const classesByMajorGrade = new Map<string, any[]>();
      classes.forEach((cls: any) => {
        const classData = cls.data || cls;
        const major = classData.major || '';
        const grade = classData.Grade || '';
        const key = `${major}_${grade}`; // Group key: major_Grade
        
        if (!classesByMajorGrade.has(key)) {
          classesByMajorGrade.set(key, []);
        }
        classesByMajorGrade.get(key)!.push({
          classCode: classData.classCode,
          className: classData.className || classData.classCode,
          major: major,
          grade: grade,
        });
      });

      // Get all students for filtered classes only
      const allClassCodes = classes.map((cls: any) => (cls.data || cls).classCode);
      
      const allStudents = await db.collection('students').find({
        'data.schoolCode': decoded.schoolCode,
        'data.classCode.value': { $in: allClassCodes }
      }).toArray();

      // Create student to class mapping
      const studentClassMap = new Map<string, string[]>();
      allStudents.forEach((student: any) => {
        const studentCode = student.data.studentCode;
        const studentClassCodes = (student.data.classCode || [])
          .filter((c: any) => c && typeof c === 'object' && c.value)
          .map((c: any) => c.value);
        
        studentClassCodes.forEach((classCode: string) => {
          if (!studentClassMap.has(studentCode)) {
            studentClassMap.set(studentCode, []);
          }
          if (!studentClassMap.get(studentCode)!.includes(classCode)) {
            studentClassMap.get(studentCode)!.push(classCode);
          }
        });
      });

      const allStudentCodes = Array.from(studentClassMap.keys());

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

      // Fetch assessment values (global + teacher-specific)
      const courseAssessmentValues: Record<string, Record<string, number>> = {};
      
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
      for (const courseCode of uniqueCourseCodes) {
        const courseValues: Record<string, number> = { ...globalAssessments };

        try {
          const teacherAssessmentsData = await db.collection('assessments').find({
            schoolCode: decoded.schoolCode,
            type: 'value',
            teacherCode: { $in: Array.from(uniqueTeacherCodes) }
          }).toArray();

          teacherAssessmentsData.forEach((assessment: any) => {
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

      // Get courses with vahed information
      const courses = await db.collection('courses').find({
        'data.courseCode': { $in: Array.from(uniqueCourseCodes) },
        'data.schoolCode': decoded.schoolCode
      }).toArray();

      const courseVahedMap = new Map<string, number>();
      courses.forEach((course: any) => {
        const courseCode = course.data.courseCode;
        const vahed = Number(course.data.vahed ?? 1) || 1;
        courseVahedMap.set(courseCode, vahed);
      });

      // Calculate statistics for each class group (major + Grade)
      const comparisonGroups: Array<{
        major: string;
        grade: string;
        classes: Array<{
          classCode: string;
          className: string;
          totalStudents: number;
          classAverage: number | null;
          studentsWithGrades: number;
          monthlyAverages?: Array<{ month: number; average: number | null }>; // Monthly breakdown when selectedMonth is null
        }>;
      }> = [];

      classesByMajorGrade.forEach((classList, key) => {
        const [major, grade] = key.split('_');
        const classStats: Array<{
          classCode: string;
          className: string;
          totalStudents: number;
          classAverage: number | null;
          studentsWithGrades: number;
          monthlyAverages?: Array<{ month: number; average: number | null }>;
        }> = [];

        classList.forEach((classInfo) => {
          const classCode = classInfo.classCode;
          
          // Get students in this class
          const classStudentCodes = Array.from(studentClassMap.entries())
            .filter(([studentCode, classCodes]) => classCodes.includes(classCode))
            .map(([studentCode]) => studentCode);

          const totalStudents = classStudentCodes.length;

          // Group cells by student and course
          const studentCourseData = new Map<string, Map<string, any[]>>();
          
          filteredCellData.forEach((cell: any) => {
            if (!classStudentCodes.includes(cell.studentCode)) return;
            
            if (!studentCourseData.has(cell.studentCode)) {
              studentCourseData.set(cell.studentCode, new Map());
            }
            const studentData = studentCourseData.get(cell.studentCode)!;
            
            if (!studentData.has(cell.courseCode)) {
              studentData.set(cell.courseCode, []);
            }
            studentData.get(cell.courseCode)!.push(cell);
          });

          // Calculate averages for each student in this class
          const studentAverages: number[] = [];
          
          // For monthly progress chart: store monthly averages per student
          const studentMonthlyAverages: Map<string, Array<{ month: number; average: number | null }>> = new Map();

          studentCourseData.forEach((coursesData, studentCode) => {
            const courseAverages: Array<{ average: number; vahed: number }> = [];
            
            // For monthly breakdown: store course monthly scores
            const courseMonthlyScores: Map<string, Map<number, number | null>> = new Map(); // courseCode -> month -> score

            coursesData.forEach((cells, courseCode) => {
              // Filter by courseCode if provided
              if (courseCodeParam && courseCode !== courseCodeParam) return;
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

              // Get course-specific assessment values
              const courseSpecificAssessments = courseAssessmentValues[courseCode] || {};

              // Calculate monthly finalScores
              const monthlyFinalScores: number[] = [];
              const monthlyScoresMap: Map<number, number | null> = new Map(); // month -> score

              if (selectedMonth !== null) {
                const monthKey = selectedMonth.toString();
                const { grades, assessments } = monthlyData[monthKey];
                const calculation = calculateFinalScore(grades, assessments, courseSpecificAssessments);

                if (calculation.finalScore !== null) {
                  monthlyFinalScores.push(calculation.finalScore);
                  monthlyScoresMap.set(selectedMonth, calculation.finalScore);
                }
              } else {
                // Calculate for all months (year average)
                for (let i = 1; i <= 12; i++) {
                  const monthKey = i.toString();
                  const { grades, assessments } = monthlyData[monthKey];
                  const calculation = calculateFinalScore(grades, assessments, courseSpecificAssessments);

                  if (calculation.finalScore !== null) {
                    monthlyFinalScores.push(calculation.finalScore);
                    monthlyScoresMap.set(i, calculation.finalScore);
                  } else {
                    monthlyScoresMap.set(i, null);
                  }
                }
              }
              
              // Store monthly scores for this course
              courseMonthlyScores.set(courseCode, monthlyScoresMap);

              // Calculate course average = average of monthly finalScores (matching ReportCards)
              if (monthlyFinalScores.length > 0) {
                const courseAverage = monthlyFinalScores.reduce((sum, score) => sum + score, 0) / monthlyFinalScores.length;
                const vahed = courseVahedMap.get(courseCode) || 1;
                courseAverages.push({
                  average: courseAverage,
                  vahed: vahed
                });
              }
            });

            // Calculate overall average
            if (courseAverages.length > 0) {
              let overallAverage: number;
              
              // If a specific course is selected, use only that course's average
              if (courseCodeParam) {
                // Just use the single course average (should be only one in courseAverages)
                overallAverage = courseAverages[0].average;
              } else {
                // Calculate weighted average (matching ReportCards)
                let weightedSum = 0;
                let totalWeight = 0;
                
                courseAverages.forEach(({ average, vahed }) => {
                  const numericVahed = Number(vahed ?? 1) || 1;
                  weightedSum += average * numericVahed;
                  totalWeight += numericVahed;
                });

                if (totalWeight > 0) {
                  overallAverage = Math.round((weightedSum / totalWeight) * 100) / 100;
                } else {
                  return; // Skip if no valid average
                }
              }
              
              studentAverages.push(overallAverage);
              
              // Calculate monthly averages for this student (when all year is selected)
              if (selectedMonth === null) {
                const monthlyAverages: Array<{ month: number; average: number | null }> = [];
                
                for (let month = 1; month <= 12; month++) {
                  const monthlyCourseAverages: Array<{ average: number; vahed: number }> = [];
                  
                  courseMonthlyScores.forEach((monthlyScores, courseCode) => {
                    const monthScore = monthlyScores.get(month);
                    if (monthScore !== null && monthScore !== undefined) {
                      const vahed = courseVahedMap.get(courseCode) || 1;
                      monthlyCourseAverages.push({
                        average: monthScore,
                        vahed: vahed
                      });
                    }
                  });
                  
                  if (monthlyCourseAverages.length > 0) {
                    // Calculate weighted average for this month
                    let weightedSum = 0;
                    let totalWeight = 0;
                    
                    monthlyCourseAverages.forEach(({ average, vahed }) => {
                      const numericVahed = Number(vahed ?? 1) || 1;
                      weightedSum += average * numericVahed;
                      totalWeight += numericVahed;
                    });
                    
                    if (totalWeight > 0) {
                      monthlyAverages.push({
                        month,
                        average: Math.round((weightedSum / totalWeight) * 100) / 100
                      });
                    } else {
                      monthlyAverages.push({ month, average: null });
                    }
                  } else {
                    monthlyAverages.push({ month, average: null });
                  }
                }
                
                studentMonthlyAverages.set(studentCode, monthlyAverages);
              }
            }
          });

          // Calculate class average (average of all student averages)
          const classAverage = studentAverages.length > 0
            ? studentAverages.reduce((sum, avg) => sum + avg, 0) / studentAverages.length
            : null;

          // Calculate monthly class averages (when all year is selected)
          const monthlyClassAverages: Array<{ month: number; average: number | null }> | undefined = 
            selectedMonth === null && studentMonthlyAverages.size > 0
              ? (() => {
                  const monthlyClassStats: Map<number, number[]> = new Map(); // month -> array of student averages
                  
                  // Collect all student monthly averages
                  studentMonthlyAverages.forEach((monthlyAvgs) => {
                    monthlyAvgs.forEach(({ month, average }) => {
                      if (average !== null) {
                        if (!monthlyClassStats.has(month)) {
                          monthlyClassStats.set(month, []);
                        }
                        monthlyClassStats.get(month)!.push(average);
                      }
                    });
                  });
                  
                  // Calculate class average for each month
                  const result: Array<{ month: number; average: number | null }> = [];
                  for (let month = 1; month <= 12; month++) {
                    const monthStudentAverages = monthlyClassStats.get(month) || [];
                    if (monthStudentAverages.length > 0) {
                      const monthClassAverage = monthStudentAverages.reduce((sum, avg) => sum + avg, 0) / monthStudentAverages.length;
                      result.push({ month, average: Math.round(monthClassAverage * 100) / 100 });
                    } else {
                      result.push({ month, average: null });
                    }
                  }
                  
                  return result;
                })()
              : undefined;

          classStats.push({
            classCode,
            className: classInfo.className,
            totalStudents,
            classAverage,
            studentsWithGrades: studentAverages.length,
            monthlyAverages: monthlyClassAverages,
          });
        });

        // Sort classes by average (descending)
        classStats.sort((a, b) => {
          if (a.classAverage === null && b.classAverage === null) return 0;
          if (a.classAverage === null) return 1;
          if (b.classAverage === null) return -1;
          return b.classAverage - a.classAverage;
        });

        // Always push the group, even if stats are empty (shows 0 students)
        comparisonGroups.push({
          major,
          grade,
          classes: classStats,
        });
      });

      // Sort groups by major and grade
      comparisonGroups.sort((a, b) => {
        if (a.major !== b.major) {
          return a.major.localeCompare(b.major);
        }
        return a.grade.localeCompare(b.grade);
      });

      // Prepare available grade-major combinations with their courses
      const gradeMajorCombinations = Array.from(gradeMajorMap.entries()).map(([key, info]) => {
        const courseCodes = Array.from(gradeMajorCoursesMap.get(key) || []);
        const courses = courseCodes.map(courseCode => ({
          courseCode,
          courseName: courseMap.get(courseCode) || courseCode,
        })).sort((a, b) => a.courseName.localeCompare(b.courseName));
        
        return {
          grade: info.grade,
          major: info.major,
          displayName: info.displayName,
          courses,
        };
      }).sort((a, b) => {
        // Sort by grade first, then major
        if (a.grade !== b.grade) {
          return a.grade.localeCompare(b.grade);
        }
        return a.major.localeCompare(b.major);
      });

      await client.close();

      // If no grade/major filter, only return combinations (lightweight response)
      if (!gradeParam && !majorParam) {
        return NextResponse.json({
          success: true,
          data: {
            gradeMajorCombinations, // Available combinations with courses
          }
        });
      }

      // Otherwise, return full comparison data
      console.log('Returning comparison data:', {
        comparisonGroupsCount: comparisonGroups.length,
        selectedYear,
        selectedMonth,
        gradeParam,
        majorParam,
        courseCodeParam
      });
      
      return NextResponse.json({
        success: true,
        data: {
          comparisonGroups,
          selectedYear,
          selectedMonth,
          gradeMajorCombinations, // Available combinations with courses
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
    console.error('Classes comparison API error:', error);
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

