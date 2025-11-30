"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Helper function to convert numbers to Persian digits
function toPersianDigits(num: number | string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num)
    .split("")
    .map((digit) => persianDigits[parseInt(digit, 10)] || digit)
    .join("");
}

// Helper function to get color class based on grade
const getScoreColorClass = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return "text-gray-400";
  if (score >= 18) return "text-emerald-600 font-bold";
  if (score >= 15) return "text-green-600";
  if (score >= 12) return "text-blue-600";
  if (score >= 10) return "text-amber-500";
  return "text-red-500";
};

// Assessment values with weights
const ASSESSMENT_VALUES_MAP: Record<string, number> = {
  عالی: 2,
  خوب: 1,
  متوسط: 0,
  ضعیف: -1,
  "بسیار ضعیف": -2,
};

type GradeEntry = {
  value: number;
  description: string;
  date: string;
  totalPoints?: number;
};

type AssessmentEntry = {
  title: string;
  value: string;
  date: string;
  weight?: number;
};

// Persian month names
const persianMonths = [
  { value: "1", label: "فروردین" },
  { value: "2", label: "اردیبهشت" },
  { value: "3", label: "خرداد" },
  { value: "4", label: "تیر" },
  { value: "5", label: "مرداد" },
  { value: "6", label: "شهریور" },
  { value: "7", label: "مهر" },
  { value: "8", label: "آبان" },
  { value: "9", label: "آذر" },
  { value: "10", label: "دی" },
  { value: "11", label: "بهمن" },
  { value: "12", label: "اسفند" },
];

// Calculate final score
const calculateFinalScore = (
  grades: GradeEntry[],
  assessments: AssessmentEntry[],
  courseKey: string,
  courseSpecificAssessmentValues: Record<string, Record<string, number>>
): number | null => {
  if (!grades || grades.length === 0) return null;

  const totalValue = grades.reduce((sum, grade) => sum + grade.value, 0);
  const totalPoints = grades.reduce(
    (sum, grade) => sum + (grade.totalPoints || 20),
    0
  );

  const baseGrade = totalPoints > 0 ? Math.min((totalValue / totalPoints) * 20, 20) : 0;

  if (!assessments || assessments.length === 0) return baseGrade;

  const assessmentAdjustment = assessments.reduce((total, assessment) => {
    const courseSpecificValues = courseSpecificAssessmentValues[courseKey] || {};
    const adjustment =
      courseSpecificValues[assessment.value] !== undefined
        ? courseSpecificValues[assessment.value]
        : ASSESSMENT_VALUES_MAP[assessment.value] || 0;
    return total + adjustment;
  }, 0);

  let finalScore = baseGrade + assessmentAdjustment;
  finalScore = Math.min(finalScore, 20);
  finalScore = Math.max(finalScore, 0);

  return finalScore;
};

// Calculate progress between two scores
const calculateProgress = (
  currentScore: number | null,
  previousScore: number | null
): number | null => {
  if (currentScore === null || previousScore === null || previousScore === 0)
    return null;
  return ((currentScore - previousScore) / previousScore) * 100;
};

// Print-optimized styles
const printStyles = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 1cm;
    }
    
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    body {
      background: white !important;
      color: black !important;
      font-size: 8pt !important;
    }
    
    .print-container {
      padding: 0.3cm !important;
    }
    
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      font-size: 7pt !important;
      page-break-inside: auto !important;
    }
    
    thead {
      display: table-header-group !important;
    }
    
    tbody {
      display: table-row-group !important;
    }
    
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    th, td {
      padding: 0.1cm 0.15cm !important;
      border: 1px solid #d1d5db !important;
      text-align: center !important;
      font-size: 7pt !important;
    }
    
    th {
      background-color: #f3f4f6 !important;
      font-weight: bold !important;
      color: #1f2937 !important;
    }
    
    .course-header-vertical {
      writing-mode: vertical-rl !important;
      text-orientation: mixed !important;
      transform: rotate(180deg) !important;
      white-space: nowrap !important;
      height: 1.5cm !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 7pt !important;
      line-height: 1.3 !important;
      padding: 0.1cm 0.05cm !important;
    }
    
    .course-header-container {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 0.1cm !important;
      min-height: 3.5cm !important;
      width: 100% !important;
    }
    
    .vahed-badge-print {
      background-color: #e2e8f0 !important;
      border-radius: 9999px !important;
      padding: 0.02cm 0.05cm !important;
      font-size: 5pt !important;
      margin-top: 0.05cm !important;
      display: inline-block !important;
    }
    
    .header-section {
      margin-bottom: 0.3cm !important;
      padding-bottom: 0.2cm !important;
      border-bottom: 2px solid #1f2937 !important;
    }
    
    .header-title {
      font-size: 12pt !important;
      font-weight: bold !important;
      text-align: center !important;
      margin-bottom: 0.15cm !important;
    }
    
    .header-info {
      font-size: 8pt !important;
      text-align: center !important;
      color: #4b5563 !important;
    }
    
    .progress-indicator {
      font-size: 5pt !important;
      margin-top: 0.05cm !important;
    }
    
    .rank-badge {
      font-size: 5pt !important;
      padding: 0.03cm 0.08cm !important;
      border-radius: 0.1cm !important;
      margin-top: 0.05cm !important;
      display: inline-block !important;
    }
    
    .rank-1 {
      background-color: #fef3c7 !important;
      color: #92400e !important;
    }
    
    .rank-2 {
      background-color: #e5e7eb !important;
      color: #374151 !important;
    }
    
    .rank-3 {
      background-color: #fed7aa !important;
      color: #9a3412 !important;
    }
    
    .rank-other {
      background-color: #e5e7eb !important;
      color: #374151 !important;
    }
  }
  
  @media screen {
    body {
      background: white;
      padding: 1cm;
    }
    
    .print-container {
      max-width: 100%;
      margin: 0 auto;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    
    th, td {
      padding: 0.3cm 0.4cm;
      border: 1px solid #d1d5db;
      text-align: center;
    }
    
    th {
      background-color: #f3f4f6;
      font-weight: bold;
    }
    
    .header-section {
      margin-bottom: 1cm;
      padding-bottom: 0.5cm;
      border-bottom: 2px solid #1f2937;
    }
    
    .header-title {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 0.5cm;
    }
    
    .header-info {
      font-size: 11pt;
      text-align: center;
      color: #4b5563;
    }
  }
`;

type MonthlyGradeOverallPrintViewProps = {
  studentGrades: any[];
  selectedClass: string;
  selectedMonths: string[];
  selectedCourses: string[];
  selectedYear: string;
  className: string;
  yearLabel: string;
  selectedMonthNames: string[];
  selectedCourseInfos: Array<{
    courseCode: string;
    teacherCode: string;
    courseName: string;
    vahed?: number;
  }>;
  showProgress: boolean;
  showRankings: boolean;
  courseSpecificAssessmentValues: Record<string, Record<string, number>>;
};

const MonthlyGradeOverallPrintView = ({
  studentGrades,
  className,
  yearLabel,
  selectedMonthNames,
  selectedCourseInfos,
  selectedMonths,
  showProgress,
  showRankings,
  courseSpecificAssessmentValues,
}: MonthlyGradeOverallPrintViewProps) => {
  // Calculate student ranks
  const calculateStudentRanks = () => {
    const ranksByCourseMonth: Record<string, Record<string, Record<string, number>>> = {};
    const averageRanks: Record<string, number> = {};

    // Initialize rank storage
    selectedCourseInfos.forEach((course) => {
      const courseKey = `${course.teacherCode}_${course.courseCode}`;
      ranksByCourseMonth[courseKey] = {};
      selectedMonths.forEach((month) => {
        ranksByCourseMonth[courseKey][month] = {};
      });
    });

    // Calculate ranks for each course/month combination
    selectedCourseInfos.forEach((course) => {
      const courseKey = `${course.teacherCode}_${course.courseCode}`;
      selectedMonths.forEach((month) => {
        const monthKey = `${courseKey}_${month}`;
        const studentsWithScores = studentGrades
          .map((student) => {
            const monthData = student.gradeDetails?.[monthKey];
            const score = monthData
              ? calculateFinalScore(
                  monthData.grades || [],
                  monthData.assessments || [],
                  courseKey,
                  courseSpecificAssessmentValues
                )
              : null;
            return {
              studentCode: student.studentCode,
              score,
            };
          })
          .filter((s) => s.score !== null);

        const sortedStudents = [...studentsWithScores].sort(
          (a, b) => (b.score ?? 0) - (a.score ?? 0)
        );

        let currentRank = 1;
        let previousScore: number | null = null;

        sortedStudents.forEach((student, index) => {
          if (student.score !== previousScore) {
            currentRank = index + 1;
          }
          ranksByCourseMonth[courseKey][month][student.studentCode] = currentRank;
          previousScore = student.score;
        });
      });
    });

    // Calculate ranks for average
    const studentsWithAvg = studentGrades
      .map((student) => ({
        studentCode: student.studentCode,
        average: student.average,
      }))
      .filter((student) => student.average !== null);

    const sortedByAvg = [...studentsWithAvg].sort(
      (a, b) => (b.average ?? 0) - (a.average ?? 0)
    );

    let currentRank = 1;
    let previousAvg: number | null = null;

    sortedByAvg.forEach((student, index) => {
      if (student.average !== previousAvg) {
        currentRank = index + 1;
      }
      averageRanks[student.studentCode] = currentRank;
      previousAvg = student.average;
    });

    return { courseMonthRanks: ranksByCourseMonth, averageRanks };
  };

  const { courseMonthRanks, averageRanks } = showRankings
    ? calculateStudentRanks()
    : { courseMonthRanks: {}, averageRanks: {} };

  const getRankBadgeClass = (rank: number): string => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "rank-other";
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="print-container" dir="rtl">
        {/* Header Section */}
        <div className="header-section">
          <div className="header-title">گزارش نمرات تمام دروس</div>
          <div className="header-info">
            <div>کلاس: {className}</div>
            <div>
              ماه‌ها: {selectedMonthNames.join("، ")} - سال تحصیلی: {yearLabel}
            </div>
          </div>
        </div>

        {/* Table */}
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]" rowSpan={2}>
                ردیف
              </TableHead>
              {/* <TableHead className="w-[50px]" rowSpan={2}>
                کد
              </TableHead> */}
              <TableHead className="w-[100px]" rowSpan={2}>
                نام دانش‌آموز
              </TableHead>

              {/* Course headers */}
              {selectedCourseInfos.map((course) => {
                const courseKey = `${course.teacherCode}_${course.courseCode}`;
                return (
                  <TableHead
                    key={courseKey}
                    colSpan={selectedMonths.length}
                    className="text-center bg-gray-50"
                    style={{
                      verticalAlign: 'middle',
                      padding: '0.1cm 0.05cm',
                    }}
                  >
                    <div className="course-header-container">
                      <div className="course-header-vertical">
                        {course.courseName}
                      </div>
                      <span className="vahed-badge-print">
                        {course.vahed || 1} واحد
                      </span>
                    </div>
                  </TableHead>
                );
              })}

              {/* Average column */}
              <TableHead className="w-[50px] font-bold" rowSpan={2}>
                میانگین
              </TableHead>
            </TableRow>
            <TableRow>
              {/* Month headers for each course */}
              {selectedCourseInfos.map((course) => {
                return selectedMonths.map((month) => {
                  const monthName =
                    persianMonths.find((m) => m.value === month)?.label || month;
                  return (
                    <TableHead
                      key={`${course.teacherCode}_${course.courseCode}_${month}`}
                      className="w-[50px] text-center text-[7pt]"
                    >
                      {monthName}
                    </TableHead>
                  );
                });
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentGrades.map((student, index) => (
              <TableRow key={student.studentCode}>
                <TableCell>{toPersianDigits(index + 1)}</TableCell>
                {/* <TableCell>{toPersianDigits(student.studentCode)}</TableCell> */}
                <TableCell className="text-[8pt]">{student.studentName}</TableCell>

                {/* Course grades for each selected month */}
                {selectedCourseInfos.map((course) => {
                  const courseKey = `${course.teacherCode}_${course.courseCode}`;
                  return selectedMonths.map((month, monthIndex) => {
                    const monthKey = `${courseKey}_${month}`;
                    const monthData = student.gradeDetails?.[monthKey];
                    const score = monthData
                      ? calculateFinalScore(
                          monthData.grades || [],
                          monthData.assessments || [],
                          courseKey,
                          courseSpecificAssessmentValues
                        )
                      : null;

                    // Calculate progress from previous month
                    let progressElement = null;
                    if (showProgress && monthIndex > 0) {
                      const prevMonth = selectedMonths[monthIndex - 1];
                      const prevMonthKey = `${courseKey}_${prevMonth}`;
                      const prevMonthData = student.gradeDetails?.[prevMonthKey];
                      const prevScore = prevMonthData
                        ? calculateFinalScore(
                            prevMonthData.grades || [],
                            prevMonthData.assessments || [],
                            courseKey,
                            courseSpecificAssessmentValues
                          )
                        : null;

                      if (score !== null && prevScore !== null) {
                        const progress = calculateProgress(score, prevScore);
                        if (progress !== null) {
                          const isPositive = progress >= 0;
                          progressElement = (
                            <div
                              className={`progress-indicator ${
                                isPositive ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {isPositive ? "↑" : "↓"}{" "}
                              {toPersianDigits(Math.abs(progress).toFixed(1))}%
                            </div>
                          );
                        }
                      }
                    }

                    // Get rank if enabled
                    const rank =
                      showRankings &&
                      courseMonthRanks[courseKey]?.[month]?.[student.studentCode];

                    return (
                      <TableCell
                        key={monthKey}
                        className={getScoreColorClass(score)}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          {score !== null
                            ? toPersianDigits(score.toFixed(2))
                            : "-"}
                          {progressElement}
                          {rank && rank <= 3 && (
                            <div
                              className={`rank-badge ${getRankBadgeClass(rank)}`}
                            >
                              {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    );
                  });
                })}

                {/* Year average */}
                <TableCell
                  className={`font-bold ${
                    student.average !== null
                      ? getScoreColorClass(student.average)
                      : "text-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    {student.average !== null
                      ? toPersianDigits(student.average.toFixed(2))
                      : "-"}
                    {showRankings &&
                      averageRanks[student.studentCode] &&
                      averageRanks[student.studentCode] <= 3 && (
                        <div
                          className={`rank-badge ${getRankBadgeClass(
                            averageRanks[student.studentCode]
                          )}`}
                        >
                          {averageRanks[student.studentCode] === 1
                            ? "🥇"
                            : averageRanks[student.studentCode] === 2
                            ? "🥈"
                            : "🥉"}
                        </div>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default MonthlyGradeOverallPrintView;

