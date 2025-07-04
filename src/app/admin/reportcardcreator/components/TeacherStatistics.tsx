"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Table2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useState } from "react";

// Persian digit conversion function (performant)
const toPersianDigits = (input: string | number): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(
    /[0-9]/g,
    (digit) => persianDigits[parseInt(digit)]
  );
};

// Persian date formatting function
const formatPersianDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const persianMonths = [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند",
    ];

    // Simple Gregorian to Persian approximation for display
    const month = date.getMonth();
    const day = date.getDate();

    // Convert to Persian calendar (simplified)
    const persianMonth = persianMonths[month] || persianMonths[0];

    return `${toPersianDigits(day)} ${persianMonth}`;
  } catch {
    return "تاریخ نامشخص";
  }
};

interface StudentSubject {
  gradingId: string; // Add grading ID to uniquely identify each grade
  subjectName: string;
  gradingTitle: string;
  gradingDate: string;
  score: number;
  classAverage: number;
  rank: number;
  totalStudents: number;
  percentile: number;
  diffFromAvg: number;
  performance: string;
  courseCode: string;
  courseGrade: string;
  courseVahed: number;
  progressInfo?: {
    scoreDiff: number;
    rankDiff: number;
    hasProgress: boolean;
    previousScore: number;
    previousRank: number;
  };
}

interface StudentData {
  studentCode: string;
  studentName: string;
  className?: string;
  subjects: StudentSubject[];
  descriptiveGrades?: {
    gradingId: string;
    subjectName: string;
    gradingTitle: string;
    gradingDate: string;
    descriptiveText: string;
    courseCode: string;
    courseGrade: string;
    courseVahed: number;
  }[];
  overallAverage: number;
  overallRank: number;
  overallDiffFromAvg: number;
  overallProgress?: {
    totalScoreChange: number;
    totalRankChange: number;
    progressCount: number;
    declineCount: number;
    noChangeCount: number;
    overallTrend: "improvement" | "decline" | "stable";
    progressPercentage: number;
  };
}

interface CourseData {
  score: number;
  rank: number;
  totalStudents: number;
  performance: string;
  diffFromAvg: number;
  progressInfo?: {
    scoreDiff: number;
    rankDiff: number;
    hasProgress: boolean;
    previousScore: number;
    previousRank: number;
  };
}

interface CourseAverageData {
  averageScore: number;
  gradeCount: number;
  bestScore: number;
  worstScore: number;
  courseCode: string;
  courseName: string;
  performance: string;
  diffFromClassAvg: number;
}

interface TableRowData {
  studentName: string;
  overallAverage: number;
  overallRank: number;
  progressTrend: "improvement" | "decline" | "stable";
  progressPercentage: number;
  [courseKey: string]: string | number | CourseData | CourseAverageData | null;
}

interface SelectedGrading {
  _id: string;
  title: string;
  date?: string;
  gradingType: "numerical" | "descriptive";
  subjectData?: {
    courseCode?: string;
    courseName?: string;
    Grade?: string;
    vahed?: number;
  };
}

interface TeacherStatisticsProps {
  studentsArray: StudentData[];
  selectedGradings?: SelectedGrading[];
}

export function TeacherStatistics({
  studentsArray,
  selectedGradings = [],
}: TeacherStatisticsProps) {
  const [showIndividualGrades, setShowIndividualGrades] = useState(true);

  // Get all courses/grades based on the toggle
  const allCourses = showIndividualGrades
    ? // Show ALL selected gradings as individual columns ordered by actual gradingDate from database
      (() => {
        // Create a map of grading info with actual dates from student subjects
        const gradingDateMap = new Map<string, string>();

        // Extract actual gradingDate from student subjects for each grading
        selectedGradings
          .filter((grading) => grading.gradingType === "numerical")
          .forEach((grading) => {
            const gradingKey = `${grading._id}-${grading.title}`;

            // Find the actual gradingDate from any student's subject data
            for (const student of studentsArray) {
              const subjectData = student.subjects.find(
                (s) =>
                  s.gradingTitle === grading.title &&
                  s.subjectName ===
                    (grading.subjectData?.courseName || "نامشخص") &&
                  (s.courseCode || "N/A") ===
                    (grading.subjectData?.courseCode || "N/A")
              );

              if (subjectData && subjectData.gradingDate) {
                gradingDateMap.set(gradingKey, subjectData.gradingDate);
                break; // Found the date, no need to check other students
              }
            }

            // Fallback to grading.date if no gradingDate found in subjects
            if (!gradingDateMap.has(gradingKey)) {
              gradingDateMap.set(gradingKey, grading.date || "1900-01-01");
            }
          });

        const sortedGradings = selectedGradings
          .filter((grading) => grading.gradingType === "numerical")
          .map((grading) => `${grading._id}-${grading.title}`)
          .sort((a, b) => {
            // Sort by actual gradingDate from database (same as progress calculation)
            const dateA = new Date(
              gradingDateMap.get(a) || "1900-01-01"
            ).getTime();
            const dateB = new Date(
              gradingDateMap.get(b) || "1900-01-01"
            ).getTime();
            if (dateA !== dateB) return dateA - dateB;

            // Secondary sort by course code
            const gradingA = selectedGradings.find(
              (g) => `${g._id}-${g.title}` === a
            );
            const gradingB = selectedGradings.find(
              (g) => `${g._id}-${g.title}` === b
            );
            if (!gradingA || !gradingB) return 0;

            const codeA = gradingA.subjectData?.courseCode || "N/A";
            const codeB = gradingB.subjectData?.courseCode || "N/A";
            if (codeA !== codeB) return codeA.localeCompare(codeB);

            // Tertiary sort by title
            return gradingA.title.localeCompare(gradingB.title, "fa");
          });

        // Debug: Log the chronological order and grading IDs
        console.log(
          "Table columns chronological order:",
          sortedGradings.map((key) => {
            const grading = selectedGradings.find(
              (g) => `${g._id}-${g.title}` === key
            );
            return {
              gradingId: grading?._id,
              title: grading?.title,
              courseCode: grading?.subjectData?.courseCode,
              gradingDate: gradingDateMap.get(key),
            };
          })
        );

        return sortedGradings;
      })()
    : // Show unique course combinations for average mode
      Array.from(
        new Set(
          studentsArray.flatMap((student) =>
            student.subjects.map(
              (subject) =>
                `${subject.courseCode || "N/A"}-${subject.subjectName}`
            )
          )
        )
      ).sort();

  // Create a comprehensive table data structure
  const tableData: TableRowData[] = studentsArray.map((student) => {
    // Calculate a more precise progress percentage for table display
    let preciseProgressPercentage = 0;
    if (student.overallProgress) {
      const totalSubjects =
        student.overallProgress.progressCount +
        student.overallProgress.declineCount +
        student.overallProgress.noChangeCount;

      if (totalSubjects > 0) {
        // Calculate improvement score: (improved + 0.5*stable) / total * 100
        // This gives partial credit to stable subjects
        const improvementScore =
          student.overallProgress.progressCount +
          student.overallProgress.noChangeCount * 0.5;
        preciseProgressPercentage = Math.round(
          (improvementScore / totalSubjects) * 100
        );
      }
    }

    const studentRow: TableRowData = {
      studentName: student.studentName,
      overallAverage: student.overallAverage,
      overallRank: student.overallRank,
      progressTrend: student.overallProgress?.overallTrend || "stable",
      progressPercentage: preciseProgressPercentage,
    };

    if (showIndividualGrades) {
      // Add each individual grade data (already chronologically ordered)
      allCourses.forEach((courseKey) => {
        // Extract grading ID and title from the courseKey
        const grading = selectedGradings.find(
          (g) => `${g._id}-${g.title}` === courseKey
        );
        if (!grading) {
          studentRow[courseKey] = null;
          return;
        }

        // Find the subject data that matches this specific grading using unique grading ID
        // This ensures that each column shows the correct grade even when titles are the same
        const subjectData = student.subjects.find(
          (s) => s.gradingId === grading._id
        );

        // Debug: Log matching for duplicate titles
        if (
          grading.title &&
          student.subjects.filter((s) => s.gradingTitle === grading.title)
            .length > 1
        ) {
          console.log(
            `Student ${student.studentName} - Multiple grades with title "${grading.title}":`,
            {
              lookingForGradingId: grading._id,
              foundSubject: subjectData
                ? {
                    gradingId: subjectData.gradingId,
                    score: subjectData.score,
                    gradingDate: subjectData.gradingDate,
                  }
                : "NOT FOUND",
              allSubjectsWithSameTitle: student.subjects
                .filter((s) => s.gradingTitle === grading.title)
                .map((s) => ({
                  gradingId: s.gradingId,
                  score: s.score,
                  gradingDate: s.gradingDate,
                })),
            }
          );
        }

        if (subjectData) {
          studentRow[courseKey] = {
            score: subjectData.score,
            rank: subjectData.rank,
            totalStudents: subjectData.totalStudents,
            performance: subjectData.performance,
            diffFromAvg: subjectData.diffFromAvg,
            // progressInfo is already calculated based on chronological order in ReportPreviewStep
            progressInfo: subjectData.progressInfo,
          };
        } else {
          studentRow[courseKey] = null;
        }
      });
    } else {
      // Add course average data grouped by course code
      allCourses.forEach((courseKey) => {
        const [courseCode, subjectName] = courseKey.split("-");
        const courseSubjects = student.subjects.filter(
          (s) => `${s.courseCode || "N/A"}-${s.subjectName}` === courseKey
        );

        if (courseSubjects.length > 0) {
          const averageScore =
            courseSubjects.reduce((sum, s) => sum + s.score, 0) /
            courseSubjects.length;
          const bestScore = Math.max(...courseSubjects.map((s) => s.score));
          const worstScore = Math.min(...courseSubjects.map((s) => s.score));
          const classAverage =
            courseSubjects.reduce((sum, s) => sum + s.classAverage, 0) /
            courseSubjects.length;
          const diffFromClassAvg = averageScore - classAverage;

          let performance = "متوسط";
          if (averageScore >= 18) performance = "عالی";
          else if (averageScore >= 15) performance = "خوب";
          else if (averageScore >= 12) performance = "متوسط";
          else if (averageScore >= 10) performance = "ضعیف";
          else performance = "نیازمند تقویت";

          studentRow[courseKey] = {
            averageScore: Math.round(averageScore * 10) / 10,
            gradeCount: courseSubjects.length,
            bestScore: bestScore,
            worstScore: worstScore,
            courseCode: courseCode,
            courseName: subjectName,
            performance: performance,
            diffFromClassAvg: Math.round(diffFromClassAvg * 10) / 10,
          };
        } else {
          studentRow[courseKey] = null;
        }
      });
    }

    return studentRow;
  });

  return (
    <div className="space-y-6 print:hidden">
      {/* Existing Statistics Cards */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800 flex items-center">
            <BarChart3 className="h-5 w-5 ml-2" />
            آمار کلی برای معلم - خلاصه پیشرفت دانش‌آموزان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Improved Students */}
            <div>
              <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 ml-1" />
                دانش‌آموزان با بیشترین پیشرفت
              </h4>
              <div className="space-y-2">
                {studentsArray
                  .filter(
                    (s) =>
                      s.overallProgress &&
                      s.overallProgress.overallTrend === "improvement"
                  )
                  .sort(
                    (a, b) =>
                      (b.overallProgress?.totalScoreChange || 0) -
                      (a.overallProgress?.totalScoreChange || 0)
                  )
                  .slice(0, 5)
                  .map((student, index) => (
                    <div
                      key={student.studentCode}
                      className="flex items-center justify-between p-2 bg-green-100 rounded"
                    >
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-green-700 ml-2">
                          #{toPersianDigits(index + 1)}
                        </span>
                        <span className="font-medium">
                          {student.studentName}
                        </span>
                      </div>
                      <div className="text-sm text-green-600">
                        +
                        {toPersianDigits(
                          student.overallProgress?.totalScoreChange || 0
                        )}{" "}
                        نمره (
                        {toPersianDigits(
                          student.overallProgress?.progressPercentage || 0
                        )}
                        % بهبود)
                      </div>
                    </div>
                  ))}
                {studentsArray.filter(
                  (s) => s.overallProgress?.overallTrend === "improvement"
                ).length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    هیچ دانش‌آموزی پیشرفت قابل توجه نداشته است
                  </p>
                )}
              </div>
            </div>

            {/* Most Declined Students */}
            <div>
              <h4 className="font-semibold text-red-700 mb-3 flex items-center">
                <TrendingDown className="h-4 w-4 ml-1 transform rotate-180" />
                دانش‌آموزان نیازمند توجه بیشتر
              </h4>
              <div className="space-y-2">
                {studentsArray
                  .filter(
                    (s) =>
                      s.overallProgress &&
                      s.overallProgress.overallTrend === "decline"
                  )
                  .sort(
                    (a, b) =>
                      (a.overallProgress?.totalScoreChange || 0) -
                      (b.overallProgress?.totalScoreChange || 0)
                  )
                  .slice(0, 5)
                  .map((student, index) => (
                    <div
                      key={student.studentCode}
                      className="flex items-center justify-between p-2 bg-red-100 rounded"
                    >
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-red-700 ml-2">
                          #{toPersianDigits(index + 1)}
                        </span>
                        <span className="font-medium">
                          {student.studentName}
                        </span>
                      </div>
                      <div className="text-sm text-red-600">
                        {toPersianDigits(
                          student.overallProgress?.totalScoreChange || 0
                        )}{" "}
                        نمره (
                        {toPersianDigits(
                          100 -
                            (student.overallProgress?.progressPercentage || 0)
                        )}
                        % کاهش)
                      </div>
                    </div>
                  ))}
                {studentsArray.filter(
                  (s) => s.overallProgress?.overallTrend === "decline"
                ).length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    هیچ دانش‌آموزی کاهش عملکرد نداشته است
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Overall Class Statistics */}
          <div className="mt-6 pt-4 border-t border-blue-200">
            <h4 className="font-semibold text-blue-700 mb-3">آمار کلی کلاس</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-100 rounded">
                <div className="text-lg font-bold text-green-700">
                  {toPersianDigits(
                    studentsArray.filter(
                      (s) => s.overallProgress?.overallTrend === "improvement"
                    ).length
                  )}
                </div>
                <div className="text-xs text-green-600">
                  دانش‌آموز با پیشرفت
                </div>
              </div>
              <div className="text-center p-3 bg-red-100 rounded">
                <div className="text-lg font-bold text-red-700">
                  {toPersianDigits(
                    studentsArray.filter(
                      (s) => s.overallProgress?.overallTrend === "decline"
                    ).length
                  )}
                </div>
                <div className="text-xs text-red-600">
                  دانش‌آموز با کاهش عملکرد
                </div>
              </div>
              <div className="text-center p-3 bg-yellow-100 rounded">
                <div className="text-lg font-bold text-yellow-700">
                  {toPersianDigits(
                    studentsArray.filter(
                      (s) => s.overallProgress?.overallTrend === "stable"
                    ).length
                  )}
                </div>
                <div className="text-xs text-yellow-600">
                  دانش‌آموز با عملکرد ثابت
                </div>
              </div>
              <div className="text-center p-3 bg-blue-100 rounded">
                <div className="text-lg font-bold text-blue-700">
                  {toPersianDigits(
                    Math.round(
                      studentsArray.reduce(
                        (sum, s) =>
                          sum + (s.overallProgress?.progressPercentage || 0),
                        0
                      ) / studentsArray.filter((s) => s.overallProgress).length
                    ) || 0
                  )}
                  %
                </div>
                <div className="text-xs text-blue-600">میانگین پیشرفت کلاس</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Table */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-lg text-purple-800 flex items-center justify-between">
            <div className="flex items-center">
              <Table2 className="h-5 w-5 ml-2" />
              جدول جامع نمرات و آمار دانش‌آموزان
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center space-x-3 text-sm">
              <span
                className={`${
                  !showIndividualGrades
                    ? "text-purple-800 font-semibold"
                    : "text-gray-600"
                }`}
              >
                میانگین درس‌ها
              </span>
              <button
                onClick={() => setShowIndividualGrades(!showIndividualGrades)}
                className="flex items-center p-1 rounded-lg hover:bg-purple-100 transition-colors"
                title={
                  showIndividualGrades
                    ? "تغییر به نمایش میانگین درس‌ها"
                    : "تغییر به نمایش نمرات جداگانه"
                }
              >
                {showIndividualGrades ? (
                  <ToggleRight className="h-6 w-6 text-purple-600" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-purple-600" />
                )}
              </button>
              <span
                className={`${
                  showIndividualGrades
                    ? "text-purple-800 font-semibold"
                    : "text-gray-600"
                }`}
              >
                نمرات جداگانه
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-purple-100">
                  <th className="border border-gray-300 p-2 text-right font-bold sticky right-0 bg-purple-100 z-10 min-w-[120px]">
                    نام دانش‌آموز
                  </th>
                  <th className="border border-gray-300 p-1 text-center font-bold min-w-[60px]">
                    میانگین کلی
                  </th>
                  <th className="border border-gray-300 p-1 text-center font-bold min-w-[50px]">
                    رتبه کلی
                  </th>
                  <th className="border border-gray-300 p-1 text-center font-bold min-w-[60px]">
                    روند پیشرفت
                  </th>
                  {allCourses.map((courseKey) => {
                    if (showIndividualGrades) {
                      // Find the grading info for this courseKey
                      const grading = selectedGradings.find(
                        (g) => `${g._id}-${g.title}` === courseKey
                      );
                      const courseCode =
                        grading?.subjectData?.courseCode || "N/A";
                      const subjectName =
                        grading?.subjectData?.courseName || "نامشخص";
                      const gradingTitle = grading?.title || "نامشخص";

                      // Get the actual date from student subjects
                      const actualDate =
                        studentsArray.length > 0
                          ? studentsArray[0].subjects.find(
                              (s) => s.gradingId === grading?._id
                            )?.gradingDate || grading?.date
                          : grading?.date;
                      const formattedDate = actualDate
                        ? formatPersianDate(actualDate)
                        : "تاریخ نامشخص";

                      return (
                        <th
                          key={courseKey}
                          className="border border-gray-300 p-1 text-center font-bold min-w-[90px] max-w-[90px]"
                        >
                          <div className="transform -rotate-90 whitespace-nowrap text-xs leading-tight py-3">
                            <div className="font-bold text-purple-700 mb-1">
                              [{courseCode}]
                            </div>
                            <div className="text-purple-600 text-[10px] mb-1">
                              {subjectName.length > 10
                                ? subjectName.substring(0, 10) + "..."
                                : subjectName}
                            </div>
                            <div className="text-purple-500 text-[9px] mb-1">
                              {gradingTitle.length > 8
                                ? gradingTitle.substring(0, 8) + "..."
                                : gradingTitle}
                            </div>
                            <div className="text-purple-400 text-[8px] bg-purple-100 px-1 rounded">
                              {formattedDate}
                            </div>
                          </div>
                        </th>
                      );
                    } else {
                      const [courseCode, subjectName] = courseKey.split("-");
                      return (
                        <th
                          key={courseKey}
                          className="border border-gray-300 p-1 text-center font-bold min-w-[80px] max-w-[80px]"
                        >
                          <div className="transform -rotate-90 whitespace-nowrap text-xs leading-tight py-2">
                            <div className="font-bold text-purple-700">
                              [{courseCode}]
                            </div>
                            <div className="text-purple-600 text-[10px] mt-1">
                              {subjectName.length > 15
                                ? subjectName.substring(0, 15) + "..."
                                : subjectName}
                            </div>
                            <div className="text-purple-500 text-[9px] mt-0.5">
                              میانگین
                            </div>
                          </div>
                        </th>
                      );
                    }
                  })}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-purple-25"}
                  >
                    <td className="border border-gray-300 p-2 font-medium sticky right-0 bg-white z-10">
                      {row.studentName}
                    </td>
                    <td className="border border-gray-300 p-1 text-center font-bold">
                      <span
                        className={`px-1 py-0.5 rounded text-xs ${
                          row.overallAverage >= 18
                            ? "bg-green-100 text-green-800"
                            : row.overallAverage >= 15
                            ? "bg-blue-100 text-blue-800"
                            : row.overallAverage >= 12
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {toPersianDigits(row.overallAverage.toFixed(1))}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      <span className="font-bold text-purple-700">
                        {toPersianDigits(row.overallRank)}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      <div
                        className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-bold ${
                          row.progressTrend === "improvement"
                            ? "bg-green-100 text-green-700"
                            : row.progressTrend === "decline"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.progressTrend === "improvement" ? (
                          <TrendingUp className="h-2 w-2 ml-0.5" />
                        ) : row.progressTrend === "decline" ? (
                          <TrendingDown className="h-2 w-2 ml-0.5" />
                        ) : (
                          <span className="w-2 h-2 bg-yellow-500 rounded-full ml-0.5"></span>
                        )}
                        <span className="text-[10px]">
                          {toPersianDigits(row.progressPercentage)}%
                        </span>
                      </div>
                    </td>
                    {allCourses.map((courseKey) => {
                      const courseData = row[courseKey];
                      const isCourseData =
                        courseData &&
                        typeof courseData === "object" &&
                        "score" in courseData;
                      const isCourseAvgData =
                        courseData &&
                        typeof courseData === "object" &&
                        "averageScore" in courseData;

                      return (
                        <td
                          key={courseKey}
                          className="border border-gray-300 p-1.5 text-center min-w-[90px]"
                        >
                          {showIndividualGrades && isCourseData ? (
                            <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                              {/* Main Score - Prominent Display */}
                              <div
                                className={`text-sm font-bold px-2 py-1 rounded-md shadow-sm ${
                                  (courseData as CourseData).score >= 18
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : (courseData as CourseData).score >= 15
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : (courseData as CourseData).score >= 12
                                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                    : "bg-red-100 text-red-800 border border-red-200"
                                }`}
                              >
                                {toPersianDigits(
                                  (courseData as CourseData).score.toFixed(1)
                                )}
                              </div>

                              {/* Rank and Performance in a Row */}
                              <div className="flex justify-between items-center">
                                <div className="text-[10px] text-gray-600 bg-white px-1 py-0.5 rounded">
                                  #
                                  {toPersianDigits(
                                    (courseData as CourseData).rank
                                  )}
                                </div>
                                <div
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                    (courseData as CourseData).performance ===
                                    "عالی"
                                      ? "bg-green-200 text-green-800"
                                      : (courseData as CourseData)
                                          .performance === "خوب"
                                      ? "bg-blue-200 text-blue-800"
                                      : (courseData as CourseData)
                                          .performance === "متوسط"
                                      ? "bg-yellow-200 text-yellow-800"
                                      : "bg-red-200 text-red-800"
                                  }`}
                                >
                                  {(courseData as CourseData).performance}
                                </div>
                              </div>

                              {/* Progress indicator with percentage */}
                              {(courseData as CourseData).progressInfo && (
                                <div
                                  className={`text-[9px] px-1.5 py-1 rounded-md font-medium border ${
                                    (courseData as CourseData).progressInfo!
                                      .hasProgress
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }`}
                                >
                                  {(() => {
                                    const progressInfo = (
                                      courseData as CourseData
                                    ).progressInfo!;
                                    const previousScore =
                                      progressInfo.previousScore;
                                    const scoreDiff = progressInfo.scoreDiff;

                                    // Calculate percentage change from previous score
                                    let percentageChange = 0;
                                    if (previousScore > 0) {
                                      percentageChange = Math.round(
                                        (scoreDiff / previousScore) * 100
                                      );
                                    }

                                    const isImprovement =
                                      progressInfo.hasProgress;
                                    const icon = isImprovement ? "↗" : "↘";
                                    const sign = scoreDiff > 0 ? "+" : "";

                                    return (
                                      <div className="text-center">
                                        <div>
                                          {icon} {sign}
                                          {toPersianDigits(
                                            scoreDiff.toFixed(1)
                                          )}
                                        </div>
                                        <div className="text-[8px] opacity-75">
                                          ({sign}
                                          {toPersianDigits(percentageChange)}%)
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Difference from class average */}
                              <div
                                className={`text-[9px] px-1 py-0.5 rounded text-center ${
                                  (courseData as CourseData).diffFromAvg >= 0
                                    ? "text-green-600 bg-green-50"
                                    : "text-red-600 bg-red-50"
                                }`}
                              >
                                از میانگین:{" "}
                                {(courseData as CourseData).diffFromAvg >= 0
                                  ? "+"
                                  : ""}
                                {toPersianDigits(
                                  (courseData as CourseData).diffFromAvg
                                )}
                              </div>
                            </div>
                          ) : !showIndividualGrades && isCourseAvgData ? (
                            <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                              {/* Average Score - Prominent Display */}
                              <div
                                className={`text-sm font-bold px-2 py-1 rounded-md shadow-sm ${
                                  (courseData as CourseAverageData)
                                    .averageScore >= 18
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : (courseData as CourseAverageData)
                                        .averageScore >= 15
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : (courseData as CourseAverageData)
                                        .averageScore >= 12
                                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                    : "bg-red-100 text-red-800 border border-red-200"
                                }`}
                              >
                                {toPersianDigits(
                                  (
                                    courseData as CourseAverageData
                                  ).averageScore.toFixed(1)
                                )}
                              </div>

                              {/* Grade Count and Performance */}
                              <div className="flex justify-between items-center">
                                <div className="text-[10px] text-gray-600 bg-white px-1 py-0.5 rounded">
                                  {toPersianDigits(
                                    (courseData as CourseAverageData).gradeCount
                                  )}{" "}
                                  نمره
                                </div>
                                <div
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                    (courseData as CourseAverageData)
                                      .performance === "عالی"
                                      ? "bg-green-200 text-green-800"
                                      : (courseData as CourseAverageData)
                                          .performance === "خوب"
                                      ? "bg-blue-200 text-blue-800"
                                      : (courseData as CourseAverageData)
                                          .performance === "متوسط"
                                      ? "bg-yellow-200 text-yellow-800"
                                      : "bg-red-200 text-red-800"
                                  }`}
                                >
                                  {
                                    (courseData as CourseAverageData)
                                      .performance
                                  }
                                </div>
                              </div>

                              {/* Score Range */}
                              <div className="text-[9px] text-gray-600 bg-white px-1.5 py-1 rounded text-center">
                                محدوده:{" "}
                                {toPersianDigits(
                                  (
                                    courseData as CourseAverageData
                                  ).worstScore.toFixed(1)
                                )}{" "}
                                -{" "}
                                {toPersianDigits(
                                  (
                                    courseData as CourseAverageData
                                  ).bestScore.toFixed(1)
                                )}
                              </div>

                              {/* Difference from class average */}
                              <div
                                className={`text-[9px] px-1 py-0.5 rounded text-center ${
                                  (courseData as CourseAverageData)
                                    .diffFromClassAvg >= 0
                                    ? "text-green-600 bg-green-50"
                                    : "text-red-600 bg-red-50"
                                }`}
                              >
                                از میانگین کلاس:{" "}
                                {(courseData as CourseAverageData)
                                  .diffFromClassAvg >= 0
                                  ? "+"
                                  : ""}
                                {toPersianDigits(
                                  (courseData as CourseAverageData)
                                    .diffFromClassAvg
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Legend */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="font-semibold text-gray-700 mb-2">
              راهنمای جدول (
              {showIndividualGrades ? "نمرات جداگانه" : "میانگین درس‌ها"}):
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 rounded ml-1"></div>
                <span>
                  عالی ({toPersianDigits("18")}-{toPersianDigits("20")})
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 rounded ml-1"></div>
                <span>
                  خوب ({toPersianDigits("15")}-{toPersianDigits("18")})
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-100 rounded ml-1"></div>
                <span>
                  متوسط ({toPersianDigits("12")}-{toPersianDigits("15")})
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-100 rounded ml-1"></div>
                <span>ضعیف (&lt;{toPersianDigits("12")})</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 text-green-600 ml-1" />
                <span>پیشرفت</span>
              </div>
              <div className="flex items-center">
                <TrendingDown className="h-3 w-3 text-red-600 ml-1" />
                <span>کاهش</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full ml-1"></span>
                <span>ثابت</span>
              </div>
              {showIndividualGrades ? (
                <div className="flex items-center">
                  <span className="text-gray-600">↗/↘</span>
                  <span className="ml-1">تغییر نمره و درصد</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-gray-600">Min-Max</span>
                  <span className="ml-1">محدوده نمرات</span>
                </div>
              )}
            </div>
            {showIndividualGrades && (
              <div className="mt-2 text-xs text-gray-600 border-t pt-2">
                <strong>نحوه محاسبه درصد:</strong> درصد تغییر بر اساس نمره قبلی
                محاسبه می‌شود. مثال: ↗ +{toPersianDigits("2.0")} (+
                {toPersianDigits("13")}%) یعنی {toPersianDigits("2")} نمره
                افزایش که معادل
                {toPersianDigits("13")}% بهبود نسبت به نمره قبلی است.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
