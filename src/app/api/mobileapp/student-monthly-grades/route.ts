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

interface GradeDetail extends GradeEntry {
  normalizedValue: number | null;
  recordId?: string;
}

type AssessmentWeightSource = 'explicit' | 'custom' | 'default';

interface AssessmentDetail extends AssessmentEntry {
  appliedWeight: number;
  weightSource: AssessmentWeightSource;
}

interface MonthlyNoteDetail {
  type: 'note' | 'descriptiveStatus' | 'presenceStatus';
  value: string;
  date?: string;
}

interface PresenceDetail {
  status: string | null;
  date?: string;
  timeSlot?: string;
  note?: string;
}

interface MonthlyGradeDetail {
  finalScore: number | null;
  baseGrade: number | null;
  assessmentAdjustment: number;
  grades: GradeDetail[];
  assessments: AssessmentDetail[];
  notes: MonthlyNoteDetail[];
  presence: PresenceDetail[];
}

interface MonthlyCalculationResult {
  finalScore: number | null;
  baseGrade: number | null;
  assessmentAdjustment: number;
  grades: GradeDetail[];
  assessments: AssessmentDetail[];
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

// Calculate final score (same as teacher monthly grades)
function calculateFinalScore(
  grades: GradeEntry[], 
  assessments: AssessmentEntry[], 
  customAssessmentValues: Record<string, number>
): MonthlyCalculationResult {
  if (grades.length === 0) {
    const assessmentsDetail: AssessmentDetail[] = assessments.map((assessment) => {
      let appliedWeight = 0;
      let weightSource: AssessmentWeightSource = 'default';

      if (assessment.weight !== undefined && assessment.weight !== null) {
        appliedWeight = Number(assessment.weight);
        weightSource = 'explicit';
      } else if (customAssessmentValues[assessment.value] !== undefined) {
        appliedWeight = customAssessmentValues[assessment.value];
        weightSource = 'custom';
      } else {
        appliedWeight = ASSESSMENT_VALUES_MAP[assessment.value] || 0;
        weightSource = 'default';
      }

      return {
        ...assessment,
        appliedWeight,
        weightSource,
      };
    });

    const assessmentAdjustment = assessmentsDetail.reduce(
      (total, assessment) => total + assessment.appliedWeight,
      0
    );

    return {
      finalScore: null,
      baseGrade: null,
      assessmentAdjustment,
      grades: [],
      assessments: assessmentsDetail,
    };
  }

  // Calculate base grade normalized to 20
  const totalValue = grades.reduce((sum, grade) => sum + grade.value, 0);
  const totalPoints = grades.reduce((sum, grade) => sum + (grade.totalPoints || 20), 0);
  
  // Normalize to base 20: (achieved/possible) × 20
  const baseGrade = totalPoints > 0 ? (totalValue / totalPoints) * 20 : 0;

  const gradeDetails: GradeDetail[] = grades.map((grade) => {
    if (grade.totalPoints && grade.totalPoints > 0) {
      const normalized = (grade.value / grade.totalPoints) * 20;
      return {
        ...grade,
        normalizedValue: normalized,
      };
    }

    return {
      ...grade,
      normalizedValue: grade.value,
    };
  });

  // If no assessments, return the base grade
  if (!assessments || assessments.length === 0) {
    return {
      finalScore: baseGrade,
      baseGrade,
      assessmentAdjustment: 0,
      grades: gradeDetails,
      assessments: [],
    };
  }

  // Calculate direct assessment adjustment using custom or default values
  const assessmentsDetail: AssessmentDetail[] = assessments.map((assessment) => {
    let appliedWeight = 0;
    let weightSource: AssessmentWeightSource = 'default';

    // If explicit weight stored on assessment, use it
    if (assessment.weight !== undefined && assessment.weight !== null) {
      appliedWeight = Number(assessment.weight);
      weightSource = 'explicit';
    }
    // Otherwise, check if there's a custom value for this assessment, otherwise use default
    else if (customAssessmentValues[assessment.value] !== undefined) {
      appliedWeight = customAssessmentValues[assessment.value];
      weightSource = 'custom';
    } else {
      appliedWeight = ASSESSMENT_VALUES_MAP[assessment.value] || 0;
      weightSource = 'default';
    }

    return {
      ...assessment,
      appliedWeight,
      weightSource,
    };
  });

  const assessmentAdjustment = assessmentsDetail.reduce(
    (total, assessment) => total + assessment.appliedWeight,
    0
  );

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
    grades: gradeDetails,
    assessments: assessmentsDetail,
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

      // Get student information
      const student = await db.collection('students').findOne({
        'data.studentCode': currentStudentCode,
        'data.schoolCode': decoded.schoolCode
      });

      if (!student) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'اطلاعات دانش‌آموز یافت نشد' },
          { status: 404 }
        );
      }

      // Get student's class codes
      const classCodes = (student.data.classCode || [])
        .filter((c: any) => c && typeof c === 'object' && c.value)
        .map((c: any) => c.value);

      if (classCodes.length === 0) {
        await client.close();
        return NextResponse.json({
          success: true,
          data: {
            studentCode: currentStudentCode,
            studentName: `${student.data.studentName || ''} ${student.data.studentFamily || ''}`.trim(),
            schoolYear: null,
            courseGrades: [],
            overallAverage: null
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

      // Fetch all grade data for this student
      const cellData = await db.collection('classsheet').find({
        studentCode: currentStudentCode,
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
          console.error("Error processing date:", cell.date, err);
          return false;
        }
      });

      // Group data by course
      const courseGroups = new Map<string, any[]>();
      filteredCellData.forEach((cell: any) => {
        const key = `${cell.classCode}|${cell.courseCode}`;
        if (!courseGroups.has(key)) {
          courseGroups.set(key, []);
        }
        courseGroups.get(key)!.push(cell);
      });

      // Fetch custom assessment values (from teachers or global)
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

      // Get course information
      const courseCodes = new Set<string>();
      courseGroups.forEach((_, key) => {
        const [, courseCode] = key.split('|');
        courseCodes.add(courseCode);
      });

      const courses = await db.collection('courses').find({
        'data.courseCode': { $in: Array.from(courseCodes) },
        'data.schoolCode': decoded.schoolCode
      }).toArray();

      const courseMap = new Map();
      courses.forEach((course: any) => {
        courseMap.set(course.data.courseCode, course.data.courseName || course.data.courseCode);
      });

      // Process each course
      const courseGrades: any[] = [];
      let overallTotal = 0;
      let overallCount = 0;

      courseGroups.forEach((cells, key) => {
        const [classCode, courseCode] = key.split('|');
        const courseName = courseMap.get(courseCode) || courseCode;

        // Initialize monthly grades structure
        const monthlyGrades: Record<string, MonthlyGradeDetail> = {};
        const monthlyData: Record<string, { grades: GradeEntry[], assessments: AssessmentEntry[], notes: MonthlyNoteDetail[], presence: PresenceDetail[] }> = {};

        // Initialize all months
        for (let i = 1; i <= 12; i++) {
          monthlyGrades[i.toString()] = {
            finalScore: null,
            baseGrade: null,
            assessmentAdjustment: 0,
            grades: [],
            assessments: [],
            notes: [],
            presence: []
          };
          monthlyData[i.toString()] = { grades: [], assessments: [], notes: [], presence: [] };
        }

        // Populate with actual data
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
            
            // Add grades
            if (cell.grades && cell.grades.length > 0) {
              monthlyData[monthKey].grades.push(...cell.grades);
            }

            // Add assessments
            if (cell.assessments && cell.assessments.length > 0) {
              monthlyData[monthKey].assessments.push(...cell.assessments);
            }

            if (cell.note) {
              monthlyData[monthKey].notes.push({
                type: 'note',
                value: cell.note,
                date: cell.date || cell.persianDate,
              });
            }

            if (cell.descriptiveStatus) {
              monthlyData[monthKey].notes.push({
                type: 'descriptiveStatus',
                value: cell.descriptiveStatus,
                date: cell.date || cell.persianDate,
              });
            }

            if (cell.presenceStatus) {
              monthlyData[monthKey].presence.push({
                status: cell.presenceStatus,
                date: cell.date || cell.persianDate,
                timeSlot: cell.timeSlot,
                note: cell.note || undefined,
              });
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
          const { grades, assessments, notes, presence } = monthlyData[monthKey];

          const calculation = calculateFinalScore(grades, assessments, customAssessmentValues);

          const dedupedNotes = notes.length > 0
            ? Array.from(new Map(notes.map((note) => [`${note.type}-${note.value}-${note.date || ''}`, note])).values())
            : [];
          const dedupedPresence = presence.length > 0
            ? Array.from(
                new Map(
                  presence.map((record) => [
                    `${record.status || ''}-${record.date || ''}-${record.timeSlot || ''}`,
                    record,
                  ])
                ).values()
              )
            : [];

          monthlyGrades[monthKey] = {
            finalScore: calculation.finalScore,
            baseGrade: calculation.baseGrade,
            assessmentAdjustment: calculation.assessmentAdjustment,
            grades: calculation.grades,
            assessments: calculation.assessments,
            notes: dedupedNotes,
            presence: dedupedPresence,
          };

          if (calculation.finalScore !== null) {
            yearTotal += calculation.finalScore;
            monthsWithScores++;
          }
        }

        // Calculate year average for this course
        const yearAverage = monthsWithScores > 0 ? yearTotal / monthsWithScores : null;

        if (yearAverage !== null) {
          overallTotal += yearAverage;
          overallCount++;
        }

        courseGrades.push({
          classCode,
          courseCode,
          courseName,
          monthlyGrades,
          yearAverage
        });
      });

      // Calculate overall average across all courses
      const overallAverage = overallCount > 0 ? overallTotal / overallCount : null;

      await client.close();

      return NextResponse.json({
        success: true,
        data: {
          studentCode: currentStudentCode,
          studentName: `${student.data.studentName || ''} ${student.data.studentFamily || ''}`.trim(),
          schoolYear: currentJYear.toString(),
          courseGrades,
          overallAverage
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
    console.error('Student monthly grades API error:', error);
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


