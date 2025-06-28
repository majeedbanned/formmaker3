import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Types from the reportcards component
interface AssessmentEntry {
  title: string;
  value: string;
  date: string;
  weight?: number;
}

// Define types for custom assessments
type CustomAssessment = {
  _id: string;
  schoolCode: string;
  teacherCode?: string;
  type: 'title' | 'value';
  value: string;
  weight?: number;
  isGlobal: boolean;
  createdAt: Date;
};

interface WeightedGradeInfo {
  courseName: string;
  grade: number;
  vahed: number;
  weightedValue: number;
}

interface StudentReportCard {
  studentCode: string;
  studentName: string;
  courses: Record<string, {
    courseName: string;
    teacherName: string;
    vahed: number;
    monthlyGrades: Record<string, number | null>;
    monthlyAssessments: Record<string, AssessmentEntry[]>;
    monthlyPresence: Record<string, {
      present: number;
      absent: number;
      late: number;
      total: number;
    }>;
    yearAverage: number | null;
  }>;
  weightedAverage?: number | null;
  weightedGradesInfo?: WeightedGradeInfo[];
}

// Assessment values with weights (same as reportcards)
const ASSESSMENT_VALUES_MAP: Record<string, number> = {
  عالی: 2,
  خوب: 1,
  متوسط: 0,
  ضعیف: -1,
  "بسیار ضعیف": -2,
};

// Helper function for Persian date conversion (same as reportcards)
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

// Calculate final score with assessments (same logic as reportcards)
function calculateFinalScore(
  grades: number | null,
  assessments: AssessmentEntry[],
  courseKey: string,
  assessmentValues: Record<string, Record<string, number>>
): number | null {
  if (grades === null) return null;

  if (!assessments || assessments.length === 0) return grades;

  const courseValues = assessmentValues[courseKey] || {};

  const assessmentAdjustment = assessments.reduce((total, assessment) => {
    const adjustment =
      courseValues[assessment.value] !== undefined
        ? courseValues[assessment.value]
        : ASSESSMENT_VALUES_MAP[assessment.value] || 0;

    return total + adjustment;
  }, 0);

  let finalScore = grades + assessmentAdjustment;
  finalScore = Math.min(finalScore, 20);
  finalScore = Math.max(finalScore, 0);

  return finalScore;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "احراز هویت مورد نیاز است" }, { status: 401 });
    }

    if (user.userType !== "school" && user.userType !== "teacher") {
      return NextResponse.json({ error: "دسترسی محدود شده است" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const selectedYear = searchParams.get("year");

    if (!studentId) {
      return NextResponse.json({ error: "شناسه دانش‌آموز مورد نیاز است" }, { status: 400 });
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const dbConnection = await connectToDatabase(domain);
    
    if (!dbConnection?.db) {
      return NextResponse.json({ error: "خطا در اتصال به پایگاه داده" }, { status: 500 });
    }

    const { db } = dbConnection;

    // Get student data
    const studentData = await db.collection("students").findOne({ _id: new ObjectId(studentId) });

    if (!studentData) {
      return NextResponse.json({ error: "دانش‌آموز یافت نشد" }, { status: 404 });
    }

    const studentCode = studentData.data.studentCode;
    const schoolCode = studentData.data.schoolCode;

    // Check teacher access
    if (user.userType === "teacher") {
      const studentClassCodes = studentData.data.classCode?.map((c: { value: string }) => c.value) || [];
      const teacherClassCodes = user.classCode?.map((c: { value: string }) => c.value) || [];
      
      const hasAccess = studentClassCodes.some((classCode: string) => 
        teacherClassCodes.includes(classCode)
      );

      if (!hasAccess) {
        return NextResponse.json({ error: "دسترسی به این دانش‌آموز محدود شده است" }, { status: 403 });
      }
    }

    // Get student's class data
    const studentClassCode = studentData.data.classCode?.[0]?.value;
    if (!studentClassCode) {
      return NextResponse.json({ error: "کلاس دانش‌آموز یافت نشد" }, { status: 404 });
    }

    const classData = await db.collection("classes").findOne({ "data.classCode": studentClassCode });
    if (!classData) {
      return NextResponse.json({ error: "اطلاعات کلاس یافت نشد" }, { status: 404 });
    }

    // Get current year if not provided
    const currentDate = new Date();
    const [currentJYear] = gregorian_to_jalali(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      currentDate.getDate()
    );
    const yearToUse = selectedYear || currentJYear.toString();

    // Get teacher-course pairs for this class
    let teacherCourses = classData.data.teachers;

    // If user is a teacher, filter to only their courses
    if (user.userType === "teacher") {
      teacherCourses = teacherCourses.filter(
        (tc: { teacherCode: string }) => tc.teacherCode === user.username
      );
    }

    // Fetch teachers info
    const teacherCodes = [...new Set(teacherCourses.map((tc: { teacherCode: string }) => tc.teacherCode))];
    const teachers = await db
      .collection("teachers")
      .find({ "data.teacherCode": { $in: teacherCodes } })
      .toArray();

    const teachersInfo: Record<string, string> = {};
    teachers.forEach(teacher => {
      const fullName = `${teacher.data.teacherName || ''} ${teacher.data.teacherFamily || ''}`.trim();
      teachersInfo[teacher.data.teacherCode] = fullName || teacher.data.teacherCode;
    });

    // Fetch courses info
    const courseCodes = [...new Set(teacherCourses.map((tc: { courseCode: string }) => tc.courseCode))];
    const courses = await db
      .collection("courses")
      .find({ "data.courseCode": { $in: courseCodes } })
      .toArray();

    const coursesInfo: Record<string, { courseCode: string; courseName: string; vahed: number }> = {};
    courses.forEach(course => {
      coursesInfo[course.data.courseCode] = {
        courseCode: course.data.courseCode,
        courseName: course.data.courseName,
        vahed: course.data.vahed || 1,
      };
    });

    // Fetch custom assessments from assessments collection
    // Get all teachers who teach this student
    const allTeacherCodes = [...new Set(teacherCourses.map((tc: { teacherCode: string }) => tc.teacherCode))];
    
    const customAssessmentsResults = await db
      .collection("assessments")
      .find({
        schoolCode: schoolCode,
        $or: [
          { isGlobal: true },
          { teacherCode: { $in: allTeacherCodes } }
        ]
      })
      .toArray();

    // Convert to proper type
    const customAssessments = customAssessmentsResults.map(doc => ({
      _id: doc._id.toString(),
      schoolCode: doc.schoolCode,
      teacherCode: doc.teacherCode,
      type: doc.type,
      value: doc.value,
      weight: doc.weight,
      isGlobal: doc.isGlobal,
      createdAt: doc.createdAt,
    })) as CustomAssessment[];

    // Create assessment values map that includes custom assessments
    const assessmentValues: Record<string, Record<string, number>> = {};
    
    // Build assessment values for each teacher-course combination
    teacherCourses.forEach((tc: { teacherCode: string; courseCode: string }) => {
      const teacherCourseKey = `${tc.teacherCode}_${tc.courseCode}`;
      assessmentValues[teacherCourseKey] = { ...ASSESSMENT_VALUES_MAP };
      
      // Add custom assessments for this teacher
      customAssessments.forEach(assessment => {
        if (assessment.type === 'value' && 
            (assessment.isGlobal || assessment.teacherCode === tc.teacherCode)) {
          assessmentValues[teacherCourseKey][assessment.value] = assessment.weight || 0;
        }
      });
    });

    // Initialize student report card
    const studentReport: StudentReportCard = {
      studentCode: studentCode,
      studentName: `${studentData.data.studentName} ${studentData.data.studentFamily}`,
      courses: {},
    };

    // Process each teacher-course combination
    for (const tc of teacherCourses) {
      const teacherName = teachersInfo[tc.teacherCode] || tc.teacherCode;
      const courseData = coursesInfo[tc.courseCode] || {
        courseCode: tc.courseCode,
        courseName: `درس ${tc.courseCode}`,
        vahed: 1,
      };
      const courseName = courseData.courseName || `درس ${tc.courseCode}`;
      const vahed = courseData.vahed || 1;

      // Fetch all grade data for this teacher-course
      const cellData = await db
        .collection("classsheet")
        .find({
          classCode: studentClassCode,
          teacherCode: tc.teacherCode,
          courseCode: tc.courseCode,
          studentCode: studentCode,
          schoolCode: schoolCode,
        })
        .toArray();

      // Filter for the selected school year
      const filteredCellData = cellData.filter((cell) => {
        const cellRecord = cell as { date?: string };
        if (!cellRecord.date) return false;

        try {
          const cellDate = new Date(cellRecord.date);
          if (isNaN(cellDate.getTime())) return false;

          const [cellYear, cellMonth] = gregorian_to_jalali(
            cellDate.getFullYear(),
            cellDate.getMonth() + 1,
            cellDate.getDate()
          );

          if (cellMonth >= 7) {
            return cellYear.toString() === yearToUse;
          } else {
            return cellYear.toString() === (parseInt(yearToUse) + 1).toString();
          }
        } catch {
          return false;
        }
      });

      // Initialize course structure
      studentReport.courses[tc.courseCode] = {
        courseName,
        teacherName,
        vahed,
        monthlyGrades: {},
        monthlyAssessments: {},
        monthlyPresence: {},
        yearAverage: null,
      };

      // Initialize monthly data
      for (let i = 1; i <= 12; i++) {
        const monthKey = i.toString();
        studentReport.courses[tc.courseCode].monthlyGrades[monthKey] = null;
        studentReport.courses[tc.courseCode].monthlyAssessments[monthKey] = [];
        studentReport.courses[tc.courseCode].monthlyPresence[monthKey] = {
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }

      // Process cells for each month
      filteredCellData.forEach((cell) => {
        const cellRecord = cell as { 
          date?: string; 
          grades?: { value: number }[]; 
          assessments?: AssessmentEntry[]; 
          presenceStatus?: "present" | "absent" | "late" | null;
        };
        if (!cellRecord.date) return;

        try {
          const cellDate = new Date(cellRecord.date);
          const [, cellMonth] = gregorian_to_jalali(
            cellDate.getFullYear(),
            cellDate.getMonth() + 1,
            cellDate.getDate()
          );

          const monthKey = cellMonth.toString();

          // Process grades
          if (cellRecord.grades && cellRecord.grades.length > 0) {
            const gradeAverage =
              cellRecord.grades.reduce((sum: number, grade: { value: number }) => sum + grade.value, 0) /
              cellRecord.grades.length;

            const currentGrade = studentReport.courses[tc.courseCode].monthlyGrades[monthKey];

            if (currentGrade === null) {
              studentReport.courses[tc.courseCode].monthlyGrades[monthKey] = gradeAverage;
            } else {
              studentReport.courses[tc.courseCode].monthlyGrades[monthKey] =
                (currentGrade + gradeAverage) / 2;
            }
          }

          // Store assessments
          if (cellRecord.assessments && cellRecord.assessments.length > 0) {
            studentReport.courses[tc.courseCode].monthlyAssessments[monthKey] = [
              ...studentReport.courses[tc.courseCode].monthlyAssessments[monthKey],
              ...cellRecord.assessments,
            ];
          }

          // Track presence
          if (cellRecord.presenceStatus !== null) {
            const presence = studentReport.courses[tc.courseCode].monthlyPresence[monthKey];
            presence.total += 1;

            if (cellRecord.presenceStatus === "present") {
              presence.present += 1;
            } else if (cellRecord.presenceStatus === "absent") {
              presence.absent += 1;
            } else if (cellRecord.presenceStatus === "late") {
              presence.late += 1;
            }
          }
        } catch (err) {
          console.error("Error processing cell date:", cellRecord.date, err);
        }
      });

      // Calculate final grades with assessments for each month
      for (let month = 1; month <= 12; month++) {
        const monthKey = month.toString();
        const rawGrade = studentReport.courses[tc.courseCode].monthlyGrades[monthKey];
        const assessments = studentReport.courses[tc.courseCode].monthlyAssessments[monthKey];

        if (rawGrade !== null) {
          const teacherCourseKey = `${tc.teacherCode}_${tc.courseCode}`;
          studentReport.courses[tc.courseCode].monthlyGrades[monthKey] = calculateFinalScore(
            rawGrade,
            assessments,
            teacherCourseKey,
            assessmentValues
          );
        }
      }

      // Calculate year average for this course
      const grades = Object.values(studentReport.courses[tc.courseCode].monthlyGrades)
        .filter((grade) => grade !== null) as number[];

      if (grades.length > 0) {
        studentReport.courses[tc.courseCode].yearAverage =
          grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
      }
    }

    // Calculate weighted average
    const weightedGradesInfo: WeightedGradeInfo[] = [];
    let totalWeight = 0;
    let weightedSum = 0;

    Object.values(studentReport.courses).forEach((course) => {
      if (course.yearAverage !== null) {
        const weightedValue = course.yearAverage * course.vahed;
        weightedSum += weightedValue;
        totalWeight += course.vahed;

        weightedGradesInfo.push({
          courseName: course.courseName,
          grade: course.yearAverage,
          vahed: course.vahed,
          weightedValue,
        });
      }
    });

    const weightedAverage =
      totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : null;

    // Add weighted average info to the student record
    const finalStudentReport = {
      ...studentReport,
      weightedAverage,
      weightedGradesInfo,
    };

    return NextResponse.json({
      success: true,
      reportCard: finalStudentReport,
      customAssessments: customAssessments.map((ca: CustomAssessment) => ({
        _id: ca._id.toString(),
        type: ca.type,
        value: ca.value,
        weight: ca.weight,
        isGlobal: ca.isGlobal,
        teacherCode: ca.teacherCode,
        createdAt: ca.createdAt,
      })),
      assessmentValues,
      yearOptions: [
        { value: (currentJYear - 1).toString(), label: `${currentJYear - 1}-${currentJYear}` },
        { value: currentJYear.toString(), label: `${currentJYear}-${currentJYear + 1}` },
      ],
      currentYear: yearToUse,
    });

  } catch (error) {
    console.error("Error fetching report card data:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات کارنامه" },
      { status: 500 }
    );
  }
} 