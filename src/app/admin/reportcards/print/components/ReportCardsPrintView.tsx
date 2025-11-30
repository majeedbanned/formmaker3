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

// Helper function to get assessment value class
const getAssessmentValueClass = (value: string): string => {
  switch (value) {
    case "عالی":
      return "assessment-excellent";
    case "خوب":
      return "assessment-good";
    case "متوسط":
      return "assessment-average";
    case "ضعیف":
      return "assessment-poor";
    case "بسیار ضعیف":
      return "assessment-very-poor";
    default:
      return "";
  }
};

// Minimal Presence Display Component (for inline display in course name column)
const MinimalPresenceDisplay = ({
  presenceData,
}: {
  presenceData: Record<
    string,
    { present: number; absent: number; late: number; total: number }
  >;
}) => {
  const totals = Object.values(presenceData).reduce(
    (acc, curr) => {
      acc.present += curr.present;
      acc.absent += curr.absent;
      acc.late += curr.late;
      acc.total += curr.total;
      return acc;
    },
    { present: 0, absent: 0, late: 0, total: 0 }
  );

  if (totals.total === 0) {
    return null;
  }

  return (
    <div className="presence-minimal text-[6pt] text-gray-600 mt-0.5 text-right">
      <span className="presence-present">
        ح: {toPersianDigits(totals.present)}
      </span>
      <span className="text-gray-400 mx-0.5">|</span>
      <span className="presence-absent">
        غ: {toPersianDigits(totals.absent)}
      </span>
      <span className="text-gray-400 mx-0.5">|</span>
      <span className="presence-late">
        ت: {toPersianDigits(totals.late)}
      </span>
    </div>
  );
};

// Compact Info Display Component (for assessments only, shown in separate row)
const CompactInfoDisplay = ({
  assessmentData,
  showAssessments,
}: {
  assessmentData: Record<string, any[]>;
  showAssessments: boolean;
}) => {
  if (!showAssessments || Object.values(assessmentData).flatMap((a) => a).length === 0) {
    return null;
  }

  const groupedAssessments: Record<string, any> = {};
  Object.values(assessmentData)
    .flat()
    .forEach((assessment) => {
      if (
        !groupedAssessments[assessment.title] ||
        new Date(assessment.date) >
          new Date(groupedAssessments[assessment.title].date)
      ) {
        groupedAssessments[assessment.title] = assessment;
      }
    });

  if (Object.keys(groupedAssessments).length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      <div className="inline-flex flex-wrap gap-1 text-xs">
        {Object.entries(groupedAssessments).map(([title, assessment]) => (
          <div
            key={title}
            className="bg-gray-100 rounded p-1 flex items-center"
          >
            <span className="font-medium">{title}: </span>
            <span
              className={`ml-1 assessment-value text-[0.65rem] ${getAssessmentValueClass(
                assessment.value
              )}`}
            >
              {assessment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Overall Statistics Component
const OverallStatistics = ({ student }: { student: any }) => {
  const overallPresence = {
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  };

  const assessmentCounts: Record<string, number> = {};
  const monthlyAverages: Record<
    string,
    { sum: number; count: number; avg: number | null }
  > = {};
  for (let i = 1; i <= 12; i++) {
    monthlyAverages[i.toString()] = { sum: 0, count: 0, avg: null };
  }

  const subjectPerformance: {
    best: { subject: string; avg: number } | null;
    worst: { subject: string; avg: number } | null;
    mostImproved: { subject: string; improvement: number } | null;
  } = {
    best: null,
    worst: null,
    mostImproved: null,
  };

  Object.entries(student.courses).forEach(([, courseData]: [string, any]) => {
    Object.values(courseData.monthlyPresence).forEach((monthData: any) => {
      overallPresence.present += monthData.present;
      overallPresence.absent += monthData.absent;
      overallPresence.late += monthData.late;
      overallPresence.total += monthData.total;
    });

    Object.values(courseData.monthlyAssessments)
      .flat()
      .forEach((assessment: any) => {
        assessmentCounts[assessment.value] =
          (assessmentCounts[assessment.value] || 0) + 1;
      });

    Object.entries(courseData.monthlyGrades).forEach(([month, grade]) => {
      if (grade !== null && typeof grade === 'number') {
        monthlyAverages[month].sum += grade;
        monthlyAverages[month].count += 1;
      }
    });

    if (courseData.yearAverage !== null) {
      if (
        !subjectPerformance.best ||
        courseData.yearAverage > subjectPerformance.best.avg
      ) {
        subjectPerformance.best = {
          subject: courseData.courseName,
          avg: courseData.yearAverage,
        };
      }

      if (
        !subjectPerformance.worst ||
        courseData.yearAverage < subjectPerformance.worst.avg
      ) {
        subjectPerformance.worst = {
          subject: courseData.courseName,
          avg: courseData.yearAverage,
        };
      }

      const monthsWithGrades = Object.entries(courseData.monthlyGrades)
        .filter(([, grade]) => grade !== null)
        .map(([month]) => parseInt(month))
        .sort((a, b) => a - b);

      if (monthsWithGrades.length >= 2) {
        const firstMonth = monthsWithGrades[0].toString();
        const lastMonth =
          monthsWithGrades[monthsWithGrades.length - 1].toString();

        const firstGrade = courseData.monthlyGrades[firstMonth];
        const lastGrade = courseData.monthlyGrades[lastMonth];

        if (firstGrade !== null && lastGrade !== null) {
          const improvement = lastGrade - firstGrade;

          if (
            !subjectPerformance.mostImproved ||
            improvement > subjectPerformance.mostImproved.improvement
          ) {
            subjectPerformance.mostImproved = {
              subject: courseData.courseName,
              improvement,
            };
          }
        }
      }
    }
  });

  Object.keys(monthlyAverages).forEach((month) => {
    if (monthlyAverages[month].count > 0) {
      monthlyAverages[month].avg =
        monthlyAverages[month].sum / monthlyAverages[month].count;
    }
  });

  const totalAssessments = Object.values(assessmentCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const assessmentPercentages: Record<
    string,
    { count: number; percentage: number }
  > = {};

  Object.entries(assessmentCounts).forEach(([value, count]) => {
    assessmentPercentages[value] = {
      count,
      percentage: totalAssessments > 0 ? (count / totalAssessments) * 100 : 0,
    };
  });

  if (
    overallPresence.total === 0 &&
    totalAssessments === 0 &&
    !subjectPerformance.best &&
    Object.values(monthlyAverages).every((m) => m.avg === null)
  ) {
    return (
      <div className="text-center text-gray-500 py-4">
        آمار کافی برای نمایش وجود ندارد.
      </div>
    );
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-md p-4 bg-gray-50">
      <h4 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">
        آمار کلی عملکرد دانش‌آموز
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {overallPresence.total > 0 && (
          <div className="border rounded-md p-3 bg-white shadow-sm">
            <h5 className="font-semibold border-b pb-1 mb-2">
              وضعیت حضور و غیاب
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>حاضر:</span>
                <span className="text-green-600 font-medium">
                  {toPersianDigits(overallPresence.present)} (
                  {toPersianDigits(
                    Math.round(
                      (overallPresence.present / overallPresence.total) * 100
                    )
                  )}
                  %)
                </span>
              </div>
              <div className="flex justify-between">
                <span>غایب:</span>
                <span className="text-red-600 font-medium">
                  {toPersianDigits(overallPresence.absent)} (
                  {toPersianDigits(
                    Math.round(
                      (overallPresence.absent / overallPresence.total) * 100
                    )
                  )}
                  %)
                </span>
              </div>
              <div className="flex justify-between">
                <span>با تأخیر:</span>
                <span className="text-amber-600 font-medium">
                  {toPersianDigits(overallPresence.late)} (
                  {toPersianDigits(
                    Math.round(
                      (overallPresence.late / overallPresence.total) * 100
                    )
                  )}
                  %)
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-100">
                <span>مجموع جلسات:</span>
                <span className="font-medium">
                  {toPersianDigits(overallPresence.total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {totalAssessments > 0 && (
          <div className="border rounded-md p-3 bg-white shadow-sm">
            <h5 className="font-semibold border-b pb-1 mb-2">
              ارزیابی‌های کیفی
            </h5>
            <div className="space-y-2">
              {Object.entries(assessmentPercentages).map(([value, data]) => (
                <div key={value} className="flex justify-between">
                  <span>
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-1 ${getAssessmentValueClass(
                        value
                      )}`}
                    ></span>
                    {value}:
                  </span>
                  <span className="font-medium">
                    {toPersianDigits(data.count)} (
                    {toPersianDigits(Math.round(data.percentage))}%)
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-1 border-t border-gray-100">
                <span>مجموع ارزیابی‌ها:</span>
                <span className="font-medium">
                  {toPersianDigits(totalAssessments)}
                </span>
              </div>
            </div>
          </div>
        )}

        {(subjectPerformance.best ||
          subjectPerformance.worst ||
          subjectPerformance.mostImproved) && (
          <div className="border rounded-md p-3 bg-white shadow-sm">
            <h5 className="font-semibold border-b pb-1 mb-2">
              عملکرد در دروس
            </h5>
            <div className="space-y-2">
              {subjectPerformance.best && (
                <div className="flex justify-between">
                  <span>بهترین درس:</span>
                  <span className="text-emerald-600 font-medium">
                    {subjectPerformance.best.subject} (
                    {toPersianDigits(subjectPerformance.best.avg.toFixed(2))})
                  </span>
                </div>
              )}

              {subjectPerformance.worst && (
                <div className="flex justify-between">
                  <span>ضعیف‌ترین درس:</span>
                  <span className="text-red-600 font-medium">
                    {subjectPerformance.worst.subject} (
                    {toPersianDigits(subjectPerformance.worst.avg.toFixed(2))}
                    )
                  </span>
                </div>
              )}

              {subjectPerformance.mostImproved && (
                <div className="flex justify-between">
                  <span>بیشترین پیشرفت:</span>
                  <span
                    className={
                      subjectPerformance.mostImproved.improvement > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {subjectPerformance.mostImproved.subject} (
                    {toPersianDigits(
                      (subjectPerformance.mostImproved.improvement > 0
                        ? "+"
                        : "") +
                        subjectPerformance.mostImproved.improvement.toFixed(2)
                    )}
                    )
                  </span>
                </div>
              )}

              {student.weightedAverage !== undefined &&
                student.weightedAverage !== null && (
                  <div className="flex justify-between pt-1 border-t border-gray-100">
                    <span>میانگین کل:</span>
                    <span
                      className={`font-medium ${getScoreColorClass(
                        student.weightedAverage
                      )}`}
                    >
                      {toPersianDigits(student.weightedAverage.toFixed(2))}
                    </span>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Print-optimized styles
const printStyles = `
  @media print {
    @page {
      size: A4;
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
      font-size: 10pt !important;
    }
    
    .report-card-wrapper {
      page-break-after: always !important;
      page-break-inside: avoid !important;
      break-after: page !important;
      break-inside: avoid !important;
      margin-bottom: 0 !important;
      padding: 0.5cm !important;
      display: flex !important;
      flex-direction: column !important;
    }
    
    .report-card-wrapper:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    
    /* Keep header and table together - prevent page break between them */
    .header-table-container {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    .student-name {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    
    .print-table-container {
      page-break-before: avoid !important;
      break-before: avoid !important;
      margin-top: 0.2cm !important;
    }
    
    .student-name {
      background: #f8fafc !important;
      color: #1f2937 !important;
      padding: 0.3cm 0.5cm !important;
      margin: -0.5cm -0.5cm 0.3cm -0.5cm !important;
      border-radius: 0.15cm 0.15cm 0 0 !important;
      border-bottom: 1px solid #e5e7eb !important;
    }
    
    .student-name-text {
      font-size: 11pt !important;
      font-weight: bold !important;
      color: #1f2937 !important;
    }
    
    .student-code {
      font-size: 8pt !important;
      background: #e5e7eb !important;
      color: #4b5563 !important;
      padding: 0.1cm 0.3cm !important;
      border-radius: 0.1cm !important;
    }
    
    .student-details {
      font-size: 8pt !important;
      color: #6b7280 !important;
    }
    
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      font-size: 9pt !important;
      page-break-inside: auto !important;
    }
    
    /* Allow page breaks within table body but keep header with first row */
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
      border: 1px solid #ddd !important;
      text-align: center !important;
    }
    
    th {
      background: #f8fafc !important;
      font-weight: bold !important;
    }
    
    .subject-cell {
      background: #f8fafc !important;
      font-weight: 600 !important;
    }
    
    .grade-value {
      font-weight: 600 !important;
      font-size: 9pt !important;
    }
    
    .grade-container {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 1px !important;
    }
    
    .presence-minimal {
      font-size: 5pt !important;
      line-height: 1.1 !important;
      margin-top: 1px !important;
    }
    
    .presence-present {
      color: #10b981 !important;
    }
    
    .presence-absent {
      color: #ef4444 !important;
    }
    
    .presence-late {
      color: #f59e0b !important;
    }
    
    .average-row {
      background: #f3f4f6 !important;
      font-weight: bold !important;
    }
    
    .presence-container,
    .assessment-container {
      page-break-inside: avoid !important;
      margin: 0.5cm 0 !important;
      font-size: 8pt !important;
    }
    
    .overall-stats-section {
      page-break-inside: avoid !important;
      margin-top: 0.5cm !important;
    }
    
    .assessments-section {
      page-break-inside: avoid !important;
      margin-top: 0.3cm !important;
      padding: 0.2cm 0 !important;
      border-top: 1px solid #e5e7eb !important;
    }
    
    .assessments-section > div:first-child {
      font-size: 7pt !important;
      margin-bottom: 0.15cm !important;
    }
    
    .assessments-section .space-y-1 > div {
      font-size: 6pt !important;
      line-height: 1.4 !important;
      margin-bottom: 0.1cm !important;
    }
    
    .overall-stats-section {
      page-break-inside: avoid !important;
      margin-top: 0.3cm !important;
      padding: 0.2cm 0 !important;
      border-top: 1px solid #e5e7eb !important;
    }
    
    .overall-stats-section > div:first-child {
      font-size: 7pt !important;
      margin-bottom: 0.15cm !important;
    }
    
    .overall-stats-section .space-y-0\\.5 > div {
      font-size: 6pt !important;
      line-height: 1.4 !important;
      margin-bottom: 0.08cm !important;
    }
    
    .progress-indicator {
      font-size: 5pt !important;
      border-radius: 9999px !important;
      padding: 0.5px 3px !important;
      margin-top: 1px !important;
      display: inline-block !important;
      line-height: 1.2 !important;
    }
    
    .progress-positive {
      background-color: rgba(16, 185, 129, 0.1) !important;
      color: rgb(16, 185, 129) !important;
    }
    
    .progress-negative {
      background-color: rgba(239, 68, 68, 0.1) !important;
      color: rgb(239, 68, 68) !important;
    }
    
    .progress-neutral {
      background-color: rgba(107, 114, 128, 0.1) !important;
      color: rgb(107, 114, 128) !important;
    }
    
    .rank-indicator {
      font-size: 5pt !important;
      border-radius: 9999px !important;
      padding: 0.5px 3px !important;
      background-color: rgba(139, 92, 246, 0.1) !important;
      color: rgb(139, 92, 246) !important;
      margin-top: 1px !important;
      display: inline-block !important;
      line-height: 1.2 !important;
    }
    
    .overall-rank {
      background-color: rgba(79, 70, 229, 0.15) !important;
      color: rgb(79, 70, 229) !important;
      font-weight: 600 !important;
    }
    
    .presence-minimal {
      font-size: 0.5rem !important;
      line-height: 1.2 !important;
      margin-top: 2px !important;
    }
    
    .presence-present {
      color: #10b981 !important;
    }
    
    .presence-absent {
      color: #ef4444 !important;
    }
    
    .presence-late {
      color: #f59e0b !important;
    }
  }
  
  @media screen {
    body {
      background: white;
      padding: 1cm;
    }
    
    .report-card-wrapper {
      margin-bottom: 2cm;
      border: 1px solid #ddd;
      border-radius: 0.5cm;
      padding: 1cm;
      background: white;
    }
    
    .student-name {
      background: #f8fafc;
      color: #1f2937;
      padding: 0.5rem 1rem;
      margin: -1rem -1rem 0.75rem -1rem;
      border-radius: 0.375rem 0.375rem 0 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .student-name-text {
      font-size: 1rem;
      font-weight: bold;
      color: #1f2937;
    }
    
    .student-code {
      font-size: 0.75rem;
      background: #e5e7eb;
      color: #4b5563;
      padding: 0.15rem 0.5rem;
      border-radius: 0.25rem;
    }
    
    .progress-indicator {
      font-size: 0.65rem;
      border-radius: 9999px;
      padding: 1px 6px;
      margin-top: 0.25rem;
      display: inline-block;
    }
    
    .progress-positive {
      background-color: rgba(16, 185, 129, 0.1);
      color: rgb(16, 185, 129);
    }
    
    .progress-negative {
      background-color: rgba(239, 68, 68, 0.1);
      color: rgb(239, 68, 68);
    }
    
    .progress-neutral {
      background-color: rgba(107, 114, 128, 0.1);
      color: rgb(107, 114, 128);
    }
    
    .rank-indicator {
      font-size: 0.65rem;
      border-radius: 9999px;
      padding: 1px 6px;
      background-color: rgba(139, 92, 246, 0.1);
      color: rgb(139, 92, 246);
      margin-top: 0.25rem;
      display: inline-block;
    }
    
    .overall-rank {
      background-color: rgba(79, 70, 229, 0.15);
      color: rgb(79, 70, 229);
      font-weight: 600;
    }
  }
`;

type ReportCardsPrintViewProps = {
  studentReportCards: any[];
  selectedClass: string;
  selectedYear: string;
  schoolName: string;
  className: string;
  yearLabel: string;
  showProgress: boolean;
  showRanking: boolean;
  showPresence: boolean;
  showAssessments: boolean;
  showOverallStats: boolean;
  hideEmptyRows: boolean;
  visibleColumns: number[];
};

const ReportCardsPrintView: React.FC<ReportCardsPrintViewProps> = ({
  studentReportCards,
  selectedClass,
  selectedYear,
  schoolName,
  className,
  yearLabel,
  showProgress,
  showRanking,
  showPresence,
  showAssessments,
  showOverallStats,
  hideEmptyRows,
  visibleColumns,
}) => {
  const isMonthVisible = (monthNum: number): boolean => {
    return visibleColumns.includes(monthNum);
  };

  const monthNamesArray = [
    { num: 7, persian: "مهر", gregorian: "Sep/Oct" },
    { num: 8, persian: "آبان", gregorian: "Oct/Nov" },
    { num: 9, persian: "آذر", gregorian: "Nov/Dec" },
    { num: 10, persian: "دی", gregorian: "Dec/Jan" },
    { num: 11, persian: "بهمن", gregorian: "Jan/Feb" },
    { num: 12, persian: "اسفند", gregorian: "Feb/Mar" },
    { num: 1, persian: "فروردین", gregorian: "Mar/Apr" },
    { num: 2, persian: "اردیبهشت", gregorian: "Apr/May" },
    { num: 3, persian: "خرداد", gregorian: "May/Jun" },
    { num: 4, persian: "تیر", gregorian: "Jun/Jul" },
  ];

  // Calculate rankings if needed
  const calculateRankings = () => {
    if (!studentReportCards.length || !showRanking) return {};

    const rankings: Record<string, Record<string, Record<string, number>>> = {};
    const allCourseKeys = new Set<string>();
    
    studentReportCards.forEach((student) => {
      Object.keys(student.courses).forEach((courseKey) => {
        allCourseKeys.add(courseKey);
      });
    });

    allCourseKeys.forEach((courseKey) => {
      rankings[courseKey] = {};
      for (let month = 1; month <= 12; month++) {
        const monthKey = month.toString();
        rankings[courseKey][monthKey] = {};

        const grades = studentReportCards
          .map((student) => ({
            studentCode: student.studentCode,
            grade: student.courses[courseKey]?.monthlyGrades[monthKey] ?? null,
          }))
          .filter((item) => item.grade !== null)
          .sort((a, b) => (b.grade as number) - (a.grade as number));

        grades.forEach((item, index) => {
          rankings[courseKey][monthKey][item.studentCode] = index + 1;
        });
      }
    });

    return rankings;
  };

  const rankings = calculateRankings();

  // Calculate overall ranking
  const calculateOverallRanking = (studentCode: string): number | null => {
    const rankings = studentReportCards
      .filter(
        (student) =>
          student.weightedAverage !== null &&
          student.weightedAverage !== undefined
      )
      .sort((a, b) => {
        const avgA = a.weightedAverage ?? 0;
        const avgB = b.weightedAverage ?? 0;
        return avgB - avgA;
      })
      .map((student) => student.studentCode);

    const position = rankings.indexOf(studentCode);
    return position !== -1 ? position + 1 : null;
  };

  // Calculate progress percentages between months
  const calculateProgress = (
    currentGrade: number | null,
    previousGrade: number | null
  ): number | null => {
    if (currentGrade === null || previousGrade === null) return null;
    if (previousGrade === 0) return null; // Avoid division by zero

    const progressPercent =
      ((currentGrade - previousGrade) / previousGrade) * 100;
    return Math.round(progressPercent * 10) / 10; // Round to 1 decimal place
  };

  // Get progress indicator color class
  const getProgressColorClass = (progress: number | null): string => {
    if (progress === null) return "";
    if (progress > 5) return "progress-positive";
    if (progress > 0) return "progress-positive";
    if (progress === 0) return "progress-neutral";
    if (progress > -5) return "progress-negative";
    return "progress-negative";
  };

  // Get progress indicator symbol
  const getProgressSymbol = (progress: number | null): string => {
    if (progress === null) return "";
    if (progress > 0) return "↑";
    if (progress === 0) return "→";
    return "↓";
  };

  // Validate data
  if (!studentReportCards || studentReportCards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 text-gray-500">
          <p className="text-lg mb-4">هیچ کارنامه‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="print-container" dir="rtl">
        {studentReportCards.map((student) => (
          <div key={student.studentCode} className="report-card-wrapper">
            {/* Header and Table Container - Keep Together */}
            <div className="header-table-container">
              {/* Student Header - Minimal Two-Line Layout */}
              <div className="student-name">
                <div className="w-full">
                  {/* First Line: Student Name, Code, Class, Year */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <span className="student-name-text">
                        {student.studentName}
                      </span>
                      <span className="student-code">
                        کد: {toPersianDigits(student.studentCode)}
                      </span>
                    </div>
                    {student.weightedAverage !== null &&
                      student.weightedAverage !== undefined && (
                        <div className="text-center">
                          <span className="text-sm font-medium">معدل کل: </span>
                          <span className="text-base font-bold">
                            {toPersianDigits(student.weightedAverage.toFixed(2))}
                          </span>
                          {showRanking && (
                            <span className="text-xs mr-2">
                              (رتبه:{" "}
                              {toPersianDigits(
                                calculateOverallRanking(student.studentCode) || 0
                              )}
                              )
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                  {/* Second Line: Class, Year, School */}
                  <div className="flex items-center gap-4 text-xs">
                    <span>کلاس: {className}</span>
                    <span>سال تحصیلی: {yearLabel}</span>
                    {schoolName && <span>مدرسه: {schoolName}</span>}
                  </div>
                </div>
              </div>

              {/* Report Card Table */}
              <div className="mt-2 print-table-container">
              <Table className="w-full border-collapse">
                <TableHeader>
                  <TableRow>
                    <TableHead className="subject-cell">نام درس</TableHead>
                    {monthNamesArray
                      .filter((month) => isMonthVisible(month.num))
                      .map((month) => (
                        <TableHead key={month.num} className="text-center">
                          {month.persian}
                        </TableHead>
                      ))}
                    <TableHead className="text-center">میانگین کل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(student.courses)
                    .filter(([, courseData]: [string, any]) => {
                      if (hideEmptyRows) {
                        const hasGrades = Object.values(
                          courseData.monthlyGrades
                        ).some((grade) => grade !== null);
                        return hasGrades;
                      }
                      return true;
                    })
                    .map(([courseCode, courseData]: [string, any]) => {
                      let courseRanking: number | null = null;

                      if (showRanking && courseData.yearAverage !== null) {
                        const courseAverages = studentReportCards
                          .map((otherStudent) => {
                            const otherCourseData =
                              otherStudent.courses[courseCode];
                            return {
                              studentCode: otherStudent.studentCode,
                              average:
                                otherCourseData?.yearAverage ?? null,
                            };
                          })
                          .filter((item) => item.average !== null)
                          .sort(
                            (a, b) =>
                              (b.average as number) - (a.average as number)
                          );

                        const position = courseAverages.findIndex(
                          (item) => item.studentCode === student.studentCode
                        );

                        if (position !== -1) {
                          courseRanking = position + 1;
                        }
                      }

                      return (
                        <React.Fragment key={courseCode}>
                          <TableRow>
                            <TableCell className="font-medium subject-cell">
                              <div className="flex flex-col items-start">
                                <span>{courseData.courseName}</span>
                                {showPresence && (
                                  <MinimalPresenceDisplay
                                    presenceData={courseData.monthlyPresence}
                                  />
                                )}
                              </div>
                            </TableCell>
                            {monthNamesArray
                              .filter((month) => isMonthVisible(month.num))
                              .map((month, monthIndex) => {
                                const monthKey = month.num.toString();
                                const grade =
                                  courseData.monthlyGrades[monthKey];

                                // Calculate previous month for progress
                                let prevMonthKey: string | null = null;
                                if (month.num === 7) {
                                  prevMonthKey = "6"; // Shahrivar
                                } else if (month.num === 1) {
                                  prevMonthKey = "12"; // Esfand to Farvardin transition
                                } else {
                                  prevMonthKey = (month.num - 1).toString();
                                }

                                const prevGrade =
                                  prevMonthKey
                                    ? courseData.monthlyGrades[prevMonthKey]
                                    : null;

                                // Calculate progress
                                const progress =
                                  showProgress && grade !== null && prevGrade !== null
                                    ? calculateProgress(grade, prevGrade)
                                    : null;

                                // Get monthly ranking
                                const monthlyRank =
                                  showRanking &&
                                  grade !== null &&
                                  rankings[courseCode]?.[monthKey]?.[
                                    student.studentCode
                                  ];

                                return (
                                  <TableCell
                                    key={month.num}
                                    className={`text-center ${getScoreColorClass(
                                      grade
                                    )}`}
                                  >
                                    {grade !== null ? (
                                      <div className="grade-container">
                                        <div className="grade-value">
                                          {toPersianDigits(grade.toFixed(2))}
                                        </div>

                                        {/* Progress percentage */}
                                        {showProgress && progress !== null && (
                                          <div
                                            className={`progress-indicator ${getProgressColorClass(
                                              progress
                                            )}`}
                                          >
                                            {getProgressSymbol(progress)}{" "}
                                            {toPersianDigits(
                                              Math.abs(progress).toFixed(1)
                                            )}
                                            %
                                          </div>
                                        )}

                                        {/* Ranking */}
                                        {showRanking && monthlyRank && (
                                          <div className="rank-indicator">
                                            رتبه: {toPersianDigits(monthlyRank)}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      "—"
                                    )}
                                  </TableCell>
                                );
                              })}
                            <TableCell
                              className={`font-bold text-center ${getScoreColorClass(
                                courseData.yearAverage
                              )}`}
                            >
                              {courseData.yearAverage !== null ? (
                                <div className="grade-container">
                                  <div className="grade-value">
                                    {toPersianDigits(
                                      courseData.yearAverage.toFixed(2)
                                    )}
                                  </div>
                                  {/* Show ranking for yearly course average */}
                                  {showRanking && courseRanking !== null && (
                                    <div className="rank-indicator">
                                      رتبه: {toPersianDigits(courseRanking)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}

                  {/* Overall Average Row */}
                  <TableRow className="average-row">
                    <TableCell colSpan={1} className="font-bold subject-cell">
                      میانگین کل (با احتساب واحد)
                    </TableCell>
                    {monthNamesArray
                      .filter((month) => isMonthVisible(month.num))
                      .map((month) => {
                        const monthKey = month.num.toString();
                        let totalWeight = 0;
                        let weightedSum = 0;

                        Object.values(student.courses)
                          .filter((course: any) => {
                            if (hideEmptyRows) {
                              const hasGrades = Object.values(
                                course.monthlyGrades
                              ).some((grade) => grade !== null);
                              return hasGrades;
                            }
                            return true;
                          })
                          .forEach((course: any) => {
                            const grade = course.monthlyGrades[monthKey];
                            const vahed = Number(course.vahed ?? 1) || 1;

                            if (grade !== null) {
                              weightedSum += grade * vahed;
                              totalWeight += vahed;
                            }
                          });

                        const weightedAvg =
                          totalWeight > 0 ? weightedSum / totalWeight : null;

                        // Calculate previous month for progress
                        let prevMonthKey: string | null = null;
                        if (month.num === 7) {
                          prevMonthKey = "6";
                        } else if (month.num === 1) {
                          prevMonthKey = "12";
                        } else {
                          prevMonthKey = (month.num - 1).toString();
                        }

                        // Calculate previous month weighted average
                        let prevTotalWeight = 0;
                        let prevWeightedSum = 0;

                        Object.values(student.courses)
                          .filter((course: any) => {
                            if (hideEmptyRows) {
                              const hasGrades = Object.values(
                                course.monthlyGrades
                              ).some((grade) => grade !== null);
                              return hasGrades;
                            }
                            return true;
                          })
                          .forEach((course: any) => {
                            if (prevMonthKey) {
                              const grade = course.monthlyGrades[prevMonthKey];
                              const vahed = Number(course.vahed ?? 1) || 1;

                              if (grade !== null) {
                                prevWeightedSum += grade * vahed;
                                prevTotalWeight += vahed;
                              }
                            }
                          });

                        const prevWeightedAvg =
                          prevTotalWeight > 0
                            ? prevWeightedSum / prevTotalWeight
                            : null;

                        // Calculate progress
                        const progress =
                          showProgress &&
                          weightedAvg !== null &&
                          prevWeightedAvg !== null
                            ? calculateProgress(weightedAvg, prevWeightedAvg)
                            : null;

                        // Calculate monthly ranking for overall average
                        let monthlyRanking: number | null = null;
                        if (showRanking && weightedAvg !== null) {
                          const monthlyAverages = studentReportCards
                            .map((otherStudent) => {
                              let otherTotalWeight = 0;
                              let otherWeightedSum = 0;

                              Object.values(otherStudent.courses)
                                .filter((course: any) => {
                                  if (hideEmptyRows) {
                                    const hasGrades = Object.values(
                                      course.monthlyGrades
                                    ).some((grade) => grade !== null);
                                    return hasGrades;
                                  }
                                  return true;
                                })
                                .forEach((course: any) => {
                                  const grade = course.monthlyGrades[monthKey];
                                  const vahed = Number(course.vahed ?? 1) || 1;

                                  if (grade !== null) {
                                    otherWeightedSum += grade * vahed;
                                    otherTotalWeight += vahed;
                                  }
                                });

                              return {
                                studentCode: otherStudent.studentCode,
                                average:
                                  otherTotalWeight > 0
                                    ? otherWeightedSum / otherTotalWeight
                                    : null,
                              };
                            })
                            .filter((item) => item.average !== null)
                            .sort(
                              (a, b) =>
                                (b.average as number) - (a.average as number)
                            );

                          const position = monthlyAverages.findIndex(
                            (item) => item.studentCode === student.studentCode
                          );

                          if (position !== -1) {
                            monthlyRanking = position + 1;
                          }
                        }

                        return (
                          <TableCell
                            key={month.num}
                            className={`font-bold text-center ${getScoreColorClass(
                              weightedAvg
                            )}`}
                          >
                            {weightedAvg !== null ? (
                              <div className="grade-container">
                                <div className="grade-value">
                                  {toPersianDigits(weightedAvg.toFixed(2))}
                                </div>

                                {/* Show progress for monthly average */}
                                {showProgress && progress !== null && (
                                  <div
                                    className={`progress-indicator ${getProgressColorClass(
                                      progress
                                    )}`}
                                  >
                                    {getProgressSymbol(progress)}{" "}
                                    {toPersianDigits(
                                      Math.abs(progress).toFixed(1)
                                    )}
                                    %
                                  </div>
                                )}

                                {/* Show ranking among class */}
                                {showRanking && monthlyRanking !== null && (
                                  <div className="rank-indicator">
                                    رتبه: {toPersianDigits(monthlyRanking)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        );
                      })}
                    <TableCell
                      className={`font-bold text-lg text-center ${getScoreColorClass(
                        student.weightedAverage || null
                      )}`}
                    >
                      {student.weightedAverage !== null &&
                      student.weightedAverage !== undefined ? (
                        <div className="grade-container">
                          <div className="grade-value">
                            {toPersianDigits(
                              student.weightedAverage.toFixed(2)
                            )}
                          </div>
                          {/* Show overall class ranking */}
                          {showRanking && (
                            <div className="rank-indicator overall-rank">
                              رتبه کل:{" "}
                              {toPersianDigits(
                                calculateOverallRanking(student.studentCode) || 0
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              </div>
            </div>
            {/* End of Header-Table Container */}

            {/* Assessments Section - Minimal */}
            {showAssessments && (() => {
              // Collect all assessments from all courses
              const allAssessments: Array<{
                courseName: string;
                title: string;
                value: string;
                date: string;
              }> = [];

              Object.entries(student.courses).forEach(([courseCode, courseData]: [string, any]) => {
                Object.entries(courseData.monthlyAssessments).forEach(([month, assessments]: [string, any]) => {
                  if (Array.isArray(assessments) && assessments.length > 0) {
                    assessments.forEach((assessment: any) => {
                      allAssessments.push({
                        courseName: courseData.courseName,
                        title: assessment.title || '',
                        value: assessment.value || '',
                        date: assessment.date || '',
                      });
                    });
                  }
                });
              });

              // If no assessments, don't show the section
              if (allAssessments.length === 0) {
                return null;
              }

              // Group by course and title to show most recent
              const groupedAssessments: Record<string, Record<string, {
                courseName: string;
                title: string;
                value: string;
                date: string;
              }>> = {};

              allAssessments.forEach((assessment) => {
                const key = `${assessment.courseName}-${assessment.title}`;
                if (!groupedAssessments[assessment.courseName]) {
                  groupedAssessments[assessment.courseName] = {};
                }
                if (
                  !groupedAssessments[assessment.courseName][assessment.title] ||
                  new Date(assessment.date) > new Date(groupedAssessments[assessment.courseName][assessment.title].date)
                ) {
                  groupedAssessments[assessment.courseName][assessment.title] = assessment;
                }
              });

              return (
                <div className="assessments-section mt-3">
                  <div className="text-xs font-semibold mb-1 text-gray-700 border-b border-gray-300 pb-1">
                    ارزیابی‌های کیفی
                  </div>
                  <div className="space-y-1">
                    {Object.entries(groupedAssessments).map(([courseName, assessments]) => (
                      <div key={courseName} className="text-[7pt]">
                        <span className="font-medium text-gray-800">{courseName}:</span>
                        <span className="mr-2">
                          {Object.values(assessments).map((assessment, idx) => (
                            <span key={idx} className="mr-2">
                              <span className="text-gray-600">{assessment.title}</span>
                              <span className={`mr-1 ${getAssessmentValueClass(assessment.value)}`}>
                                ({assessment.value})
                              </span>
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Overall Statistics - Minimal */}
            {showOverallStats && (() => {
              // Calculate overall presence statistics
              const overallPresence = {
                present: 0,
                absent: 0,
                late: 0,
                total: 0,
              };

              // Calculate assessment statistics
              const assessmentCounts: Record<string, number> = {};

              // Calculate subject performance
              const subjectPerformance: {
                best: { subject: string; avg: number } | null;
                worst: { subject: string; avg: number } | null;
                mostImproved: { subject: string; improvement: number } | null;
              } = {
                best: null,
                worst: null,
                mostImproved: null,
              };

              Object.entries(student.courses).forEach(([, courseData]: [string, any]) => {
                // Collect presence data
                Object.values(courseData.monthlyPresence).forEach((monthData: any) => {
                  overallPresence.present += monthData.present;
                  overallPresence.absent += monthData.absent;
                  overallPresence.late += monthData.late;
                  overallPresence.total += monthData.total;
                });

                // Collect assessment data
                Object.values(courseData.monthlyAssessments)
                  .flat()
                  .forEach((assessment: any) => {
                    assessmentCounts[assessment.value] =
                      (assessmentCounts[assessment.value] || 0) + 1;
                  });

                // Store subject performance
                if (courseData.yearAverage !== null) {
                  if (
                    !subjectPerformance.best ||
                    courseData.yearAverage > subjectPerformance.best.avg
                  ) {
                    subjectPerformance.best = {
                      subject: courseData.courseName,
                      avg: courseData.yearAverage,
                    };
                  }

                  if (
                    !subjectPerformance.worst ||
                    courseData.yearAverage < subjectPerformance.worst.avg
                  ) {
                    subjectPerformance.worst = {
                      subject: courseData.courseName,
                      avg: courseData.yearAverage,
                    };
                  }

                  // Calculate improvement
                  const monthsWithGrades = Object.entries(courseData.monthlyGrades)
                    .filter(([, grade]) => grade !== null)
                    .map(([month]) => parseInt(month))
                    .sort((a, b) => a - b);

                  if (monthsWithGrades.length >= 2) {
                    const firstMonth = monthsWithGrades[0].toString();
                    const lastMonth =
                      monthsWithGrades[monthsWithGrades.length - 1].toString();

                    const firstGrade = courseData.monthlyGrades[firstMonth];
                    const lastGrade = courseData.monthlyGrades[lastMonth];

                    if (firstGrade !== null && lastGrade !== null) {
                      const improvement = lastGrade - firstGrade;

                      if (
                        !subjectPerformance.mostImproved ||
                        improvement > subjectPerformance.mostImproved.improvement
                      ) {
                        subjectPerformance.mostImproved = {
                          subject: courseData.courseName,
                          improvement,
                        };
                      }
                    }
                  }
                }
              });

              const totalAssessments = Object.values(assessmentCounts).reduce(
                (sum, count) => sum + count,
                0
              );

              // Check if there's any data to show
              if (
                overallPresence.total === 0 &&
                totalAssessments === 0 &&
                !subjectPerformance.best &&
                !subjectPerformance.worst &&
                !subjectPerformance.mostImproved &&
                student.weightedAverage === null
              ) {
                return null;
              }

              return (
                <div className="overall-stats-section mt-3">
                  <div className="text-xs font-semibold mb-1 text-gray-700 border-b border-gray-300 pb-1">
                    آمار کلی عملکرد
                  </div>
                  <div className="space-y-0.5">
                    {/* Presence Statistics */}
                    {overallPresence.total > 0 && (
                      <div className="text-[9pt]">
                        <span className="font-medium text-gray-800">حضور و غیاب:</span>
                        <span className="mr-2">
                          <span className="text-green-600">حاضر: {toPersianDigits(overallPresence.present)}</span>
                          <span className="text-gray-400 mx-1">|</span>
                          <span className="text-red-600">غایب: {toPersianDigits(overallPresence.absent)}</span>
                          <span className="text-gray-400 mx-1">|</span>
                          <span className="text-amber-600">تأخیر: {toPersianDigits(overallPresence.late)}</span>
                          <span className="text-gray-600 mr-1">(مجموع: {toPersianDigits(overallPresence.total)})</span>
                        </span>
                      </div>
                    )}

                    {/* Assessment Statistics */}
                    {totalAssessments > 0 && (
                      <div className="text-[7pt]">
                        <span className="font-medium text-gray-800">ارزیابی‌های کیفی:</span>
                        <span className="mr-2">
                          {Object.entries(assessmentCounts).map(([value, count], idx) => (
                            <span key={value} className="mr-2">
                              <span className={`${getAssessmentValueClass(value)}`}>{value}</span>
                              <span className="text-gray-600">: {toPersianDigits(count)}</span>
                            </span>
                          ))}
                          <span className="text-gray-600 mr-1">(مجموع: {toPersianDigits(totalAssessments)})</span>
                        </span>
                      </div>
                    )}

                    {/* Subject Performance */}
                    {(subjectPerformance.best || subjectPerformance.worst || subjectPerformance.mostImproved) && (
                      <div className="text-[7pt]">
                        <span className="font-medium text-gray-800">عملکرد دروس:</span>
                        <span className="mr-2">
                          {subjectPerformance.best && (
                            <span className="mr-2">
                              <span className="text-emerald-600">بهترین: {subjectPerformance.best.subject} ({toPersianDigits(subjectPerformance.best.avg.toFixed(2))})</span>
                            </span>
                          )}
                          {subjectPerformance.worst && (
                            <span className="mr-2">
                              <span className="text-red-600">ضعیف‌ترین: {subjectPerformance.worst.subject} ({toPersianDigits(subjectPerformance.worst.avg.toFixed(2))})</span>
                            </span>
                          )}
                          {subjectPerformance.mostImproved && (
                            <span className="mr-2">
                              <span className={subjectPerformance.mostImproved.improvement > 0 ? "text-green-600" : "text-red-600"}>
                                پیشرفت: {subjectPerformance.mostImproved.subject} (
                                {subjectPerformance.mostImproved.improvement > 0 ? "+" : ""}
                                {toPersianDigits(subjectPerformance.mostImproved.improvement.toFixed(2))})
                              </span>
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Overall Average */}
                    {student.weightedAverage !== null && student.weightedAverage !== undefined && (
                      <div className="text-[7pt]">
                        <span className="font-medium text-gray-800">میانگین کل:</span>
                        <span className={`mr-2 font-semibold ${getScoreColorClass(student.weightedAverage)}`}>
                          {toPersianDigits(student.weightedAverage.toFixed(2))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </>
  );
};

export default ReportCardsPrintView;
