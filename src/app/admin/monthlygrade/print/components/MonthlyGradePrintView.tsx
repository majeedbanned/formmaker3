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

type MonthlyGrade = {
  month: number;
  grades: GradeEntry[];
  assessments: AssessmentEntry[];
  averageGrade: number | null;
  finalScore: number | null;
};

type StudentGrade = {
  studentCode: number;
  studentName: string;
  monthlyGrades: Record<string, MonthlyGrade>;
  yearAverage: string;
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
      font-size: 9pt !important;
    }
    
    .print-container {
      padding: 0.5cm !important;
    }
    
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      font-size: 8pt !important;
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
      padding: 0.15cm 0.2cm !important;
      border: 1px solid #d1d5db !important;
      text-align: center !important;
      font-size: 8pt !important;
    }
    
    th {
      background-color: #f3f4f6 !important;
      font-weight: bold !important;
      color: #1f2937 !important;
    }
    
    .header-section {
      margin-bottom: 0.5cm !important;
      padding-bottom: 0.3cm !important;
      border-bottom: 2px solid #1f2937 !important;
    }
    
    .header-title {
      font-size: 14pt !important;
      font-weight: bold !important;
      text-align: center !important;
      margin-bottom: 0.2cm !important;
    }
    
    .header-info {
      font-size: 9pt !important;
      text-align: center !important;
      color: #4b5563 !important;
    }
    
    .progress-indicator {
      font-size: 6pt !important;
      margin-top: 0.1cm !important;
    }
    
    .rank-badge {
      font-size: 6pt !important;
      padding: 0.05cm 0.1cm !important;
      border-radius: 0.1cm !important;
      margin-top: 0.1cm !important;
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

type MonthlyGradePrintViewProps = {
  studentGrades: StudentGrade[];
  selectedClass: string;
  selectedTeacherCourse: string;
  selectedYear: string;
  className: string;
  yearLabel: string;
  teacherName: string;
  courseName: string;
  showProgress: boolean;
  showRank: boolean;
  courseSpecificAssessmentValues: Record<string, number>;
};

const MonthlyGradePrintView = ({
  studentGrades,
  selectedClass,
  className,
  yearLabel,
  teacherName,
  courseName,
  showProgress,
  showRank,
  courseSpecificAssessmentValues,
}: MonthlyGradePrintViewProps) => {
  // Calculate progress between two months (as percentage)
  const calculateProgress = (
    currentScore: number | null,
    previousScore: number | null
  ): number | null => {
    if (currentScore === null || previousScore === null || previousScore === 0)
      return null;
    return ((currentScore - previousScore) / previousScore) * 100;
  };

  // Calculate student ranks
  const calculateStudentRanks = () => {
    const ranksByMonth: Record<string, Record<number, number>> = {};
    const yearAverageRanks: Record<number, number> = {};

    // Initialize rank storage for each month
    for (let i = 1; i <= 12; i++) {
      ranksByMonth[i.toString()] = {};
    }

    // Get all months (1-12)
    const allMonths = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

    // Calculate ranks for each month
    allMonths.forEach((month) => {
      // Get all students with scores for this month
      const studentsWithScores = studentGrades
        .map((student) => ({
          studentCode: student.studentCode,
          finalScore: student.monthlyGrades[month]?.finalScore,
        }))
        .filter(
          (student) =>
            student.finalScore !== null && student.finalScore !== undefined
        );

      // Sort students by score (descending)
      const sortedStudents = [...studentsWithScores].sort(
        (a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0)
      );

      // Assign ranks (equal scores get the same rank)
      let currentRank = 1;
      let previousScore: number | null = null;

      sortedStudents.forEach((student, index) => {
        if (student.finalScore !== previousScore) {
          // New score, assign new rank
          currentRank = index + 1;
        }

        ranksByMonth[month][student.studentCode] = currentRank;
        previousScore = student.finalScore;
      });
    });

    // Calculate ranks for year average
    const studentsWithYearAvg = studentGrades
      .map((student) => ({
        studentCode: student.studentCode,
        yearAverage:
          student.yearAverage !== "-" ? parseFloat(student.yearAverage) : null,
      }))
      .filter((student) => student.yearAverage !== null);

    // Sort students by year average (descending)
    const sortedByYearAvg = [...studentsWithYearAvg].sort(
      (a, b) => (b.yearAverage ?? 0) - (a.yearAverage ?? 0)
    );

    // Assign ranks for year average
    let currentRank = 1;
    let previousAvg: number | null = null;

    sortedByYearAvg.forEach((student, index) => {
      if (student.yearAverage !== previousAvg) {
        // New average, assign new rank
        currentRank = index + 1;
      }

      yearAverageRanks[student.studentCode] = currentRank;
      previousAvg = student.yearAverage;
    });

    return { monthlyRanks: ranksByMonth, yearAverageRanks };
  };

  // Get rank badge class
  const getRankBadgeClass = (rank: number): string => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "rank-other";
  };

  const { monthlyRanks, yearAverageRanks } = showRank
    ? calculateStudentRanks()
    : { monthlyRanks: {}, yearAverageRanks: {} };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="print-container" dir="rtl">
        {/* Header Section */}
        <div className="header-section">
          <div className="header-title">
            گزارش نمرات ماهانه
          </div>
          <div className="header-info">
            <div>کلاس: {className}</div>
            <div>معلم: {teacherName} - درس: {courseName}</div>
            <div>سال تحصیلی: {yearLabel}</div>
          </div>
        </div>

        {/* Table */}
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">ردیف</TableHead>
              <TableHead className="w-[70px]">کد</TableHead>
              <TableHead className="min-w-[120px]">نام دانش‌آموز</TableHead>
              {/* First half of school year (months 7-12) */}
              <TableHead className="w-[60px]">مهر</TableHead>
              <TableHead className="w-[60px]">آبان</TableHead>
              <TableHead className="w-[60px]">آذر</TableHead>
              <TableHead className="w-[60px]">دی</TableHead>
              <TableHead className="w-[60px]">بهمن</TableHead>
              <TableHead className="w-[60px]">اسفند</TableHead>
              {/* Second half of school year (months 1-6) */}
              <TableHead className="w-[60px]">فروردین</TableHead>
              <TableHead className="w-[60px]">اردیبهشت</TableHead>
              <TableHead className="w-[60px]">خرداد</TableHead>
              <TableHead className="w-[60px]">تیر</TableHead>
              <TableHead className="w-[60px]">مرداد</TableHead>
              <TableHead className="w-[60px]">شهریور</TableHead>
              <TableHead className="w-[70px] font-bold">میانگین</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentGrades.map((student, index) => (
              <TableRow key={student.studentCode}>
                <TableCell>{toPersianDigits(index + 1)}</TableCell>
                <TableCell>
                  {toPersianDigits(student.studentCode)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div>{student.studentName}</div>
                    {showRank &&
                      yearAverageRanks[student.studentCode] &&
                      yearAverageRanks[student.studentCode] <= 3 && (
                        <div
                          className={`rank-badge ${getRankBadgeClass(
                            yearAverageRanks[student.studentCode]
                          )}`}
                        >
                          {yearAverageRanks[student.studentCode] === 1
                            ? "🥇"
                            : yearAverageRanks[student.studentCode] === 2
                            ? "🥈"
                            : "🥉"}
                        </div>
                      )}
                  </div>
                </TableCell>

                {/* First half (Fall/Winter) */}
                {[7, 8, 9, 10, 11, 12].map((month, monthIndex) => {
                  const currentScore =
                    student.monthlyGrades[month.toString()]?.finalScore;
                  let progressElement = null;
                  let rankElement = null;

                  if (showProgress && monthIndex > 0) {
                    const previousMonth = [7, 8, 9, 10, 11, 12][
                      monthIndex - 1
                    ];
                    const previousScore =
                      student.monthlyGrades[previousMonth.toString()]
                        ?.finalScore;
                    const progress = calculateProgress(
                      currentScore,
                      previousScore
                    );

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

                  if (showRank && currentScore !== null) {
                    const studentRank =
                      monthlyRanks[month.toString()]?.[student.studentCode];
                    if (studentRank) {
                      rankElement = (
                        <div
                          className={`rank-badge ${getRankBadgeClass(
                            studentRank
                          )}`}
                        >
                          رتبه: {toPersianDigits(studentRank)}
                        </div>
                      );
                    }
                  }

                  return (
                    <TableCell
                      key={`month-${month}`}
                      className={getScoreColorClass(currentScore)}
                    >
                      <div className="flex flex-col">
                        {currentScore !== null
                          ? toPersianDigits(currentScore.toFixed(2))
                          : "-"}
                        {progressElement}
                        {rankElement}
                      </div>
                    </TableCell>
                  );
                })}

                {/* Second half (Spring/Summer) */}
                {[1, 2, 3, 4, 5, 6].map((month, monthIndex) => {
                  const currentScore =
                    student.monthlyGrades[month.toString()]?.finalScore;
                  let progressElement = null;
                  let rankElement = null;

                  if (showProgress) {
                    let previousMonth;
                    const previousScore = (() => {
                      if (monthIndex === 0) {
                        // Compare with Esfand (month 12)
                        previousMonth = 12;
                      } else {
                        // Compare with previous month in this half
                        previousMonth = [1, 2, 3, 4, 5, 6][monthIndex - 1];
                      }

                      return student.monthlyGrades[
                        previousMonth.toString()
                      ]?.finalScore;
                    })();

                    const progress = calculateProgress(
                      currentScore,
                      previousScore
                    );

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

                  if (showRank && currentScore !== null) {
                    const studentRank =
                      monthlyRanks[month.toString()]?.[student.studentCode];
                    if (studentRank) {
                      rankElement = (
                        <div
                          className={`rank-badge ${getRankBadgeClass(
                            studentRank
                          )}`}
                        >
                          رتبه: {toPersianDigits(studentRank)}
                        </div>
                      );
                    }
                  }

                  return (
                    <TableCell
                      key={`month-${month}`}
                      className={getScoreColorClass(currentScore)}
                    >
                      <div className="flex flex-col">
                        {currentScore !== null
                          ? toPersianDigits(currentScore.toFixed(2))
                          : "-"}
                        {progressElement}
                        {rankElement}
                      </div>
                    </TableCell>
                  );
                })}

                {/* Year average */}
                <TableCell
                  className={`font-bold ${
                    student.yearAverage !== "-"
                      ? getScoreColorClass(parseFloat(student.yearAverage))
                      : "text-gray-400"
                  }`}
                >
                  <div className="flex flex-col">
                    {student.yearAverage !== "-"
                      ? toPersianDigits(
                          parseFloat(student.yearAverage).toFixed(2)
                        )
                      : toPersianDigits(student.yearAverage)}
                    {showRank &&
                      student.yearAverage !== "-" &&
                      yearAverageRanks[student.studentCode] && (
                        <div
                          className={`rank-badge ${getRankBadgeClass(
                            yearAverageRanks[student.studentCode]
                          )}`}
                        >
                          رتبه: {toPersianDigits(yearAverageRanks[student.studentCode])}
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

export default MonthlyGradePrintView;

