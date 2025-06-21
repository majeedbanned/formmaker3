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

interface StudentSubject {
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

interface TeacherStatisticsProps {
  studentsArray: StudentData[];
}

export function TeacherStatistics({ studentsArray }: TeacherStatisticsProps) {
  const [showIndividualGrades, setShowIndividualGrades] = useState(true);

  // Get all unique courses/grades based on the toggle
  const allCourses = showIndividualGrades
    ? Array.from(
        new Set(
          studentsArray.flatMap((student) =>
            student.subjects.map(
              (subject) =>
                `${subject.courseCode || "N/A"}-${subject.subjectName}-${
                  subject.gradingTitle
                }`
            )
          )
        )
      ).sort()
    : Array.from(
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
    const studentRow: TableRowData = {
      studentName: student.studentName,
      overallAverage: student.overallAverage,
      overallRank: student.overallRank,
      progressTrend: student.overallProgress?.overallTrend || "stable",
      progressPercentage: student.overallProgress?.progressPercentage || 0,
    };

    if (showIndividualGrades) {
      // Add each individual grade data
      allCourses.forEach((courseKey) => {
        const subjectData = student.subjects.find(
          (s) =>
            `${s.courseCode || "N/A"}-${s.subjectName}-${s.gradingTitle}` ===
            courseKey
        );

        if (subjectData) {
          studentRow[courseKey] = {
            score: subjectData.score,
            rank: subjectData.rank,
            totalStudents: subjectData.totalStudents,
            performance: subjectData.performance,
            diffFromAvg: subjectData.diffFromAvg,
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
                          #{index + 1}
                        </span>
                        <span className="font-medium">
                          {student.studentName}
                        </span>
                      </div>
                      <div className="text-sm text-green-600">
                        +{student.overallProgress?.totalScoreChange} نمره (
                        {student.overallProgress?.progressPercentage}% بهبود)
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
                          #{index + 1}
                        </span>
                        <span className="font-medium">
                          {student.studentName}
                        </span>
                      </div>
                      <div className="text-sm text-red-600">
                        {student.overallProgress?.totalScoreChange} نمره (
                        {100 -
                          (student.overallProgress?.progressPercentage || 0)}
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
                  {
                    studentsArray.filter(
                      (s) => s.overallProgress?.overallTrend === "improvement"
                    ).length
                  }
                </div>
                <div className="text-xs text-green-600">
                  دانش‌آموز با پیشرفت
                </div>
              </div>
              <div className="text-center p-3 bg-red-100 rounded">
                <div className="text-lg font-bold text-red-700">
                  {
                    studentsArray.filter(
                      (s) => s.overallProgress?.overallTrend === "decline"
                    ).length
                  }
                </div>
                <div className="text-xs text-red-600">
                  دانش‌آموز با کاهش عملکرد
                </div>
              </div>
              <div className="text-center p-3 bg-yellow-100 rounded">
                <div className="text-lg font-bold text-yellow-700">
                  {
                    studentsArray.filter(
                      (s) => s.overallProgress?.overallTrend === "stable"
                    ).length
                  }
                </div>
                <div className="text-xs text-yellow-600">
                  دانش‌آموز با عملکرد ثابت
                </div>
              </div>
              <div className="text-center p-3 bg-blue-100 rounded">
                <div className="text-lg font-bold text-blue-700">
                  {Math.round(
                    studentsArray.reduce(
                      (sum, s) =>
                        sum + (s.overallProgress?.progressPercentage || 0),
                      0
                    ) / studentsArray.filter((s) => s.overallProgress).length
                  ) || 0}
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
                      const [courseCode, subjectName, gradingTitle] =
                        courseKey.split("-");
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
                              {subjectName.length > 12
                                ? subjectName.substring(0, 12) + "..."
                                : subjectName}
                            </div>
                            <div className="text-purple-500 text-[9px] mt-0.5">
                              {gradingTitle.length > 10
                                ? gradingTitle.substring(0, 10) + "..."
                                : gradingTitle}
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
                        {row.overallAverage.toFixed(1)}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      <span className="font-bold text-purple-700">
                        {row.overallRank}
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
                          {row.progressPercentage}%
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
                          className="border border-gray-300 p-1 text-center"
                        >
                          {showIndividualGrades && isCourseData ? (
                            <div className="space-y-0.5">
                              {/* Score */}
                              <div
                                className={`text-xs font-bold px-1 py-0.5 rounded ${
                                  (courseData as CourseData).score >= 18
                                    ? "bg-green-100 text-green-800"
                                    : (courseData as CourseData).score >= 15
                                    ? "bg-blue-100 text-blue-800"
                                    : (courseData as CourseData).score >= 12
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {(courseData as CourseData).score.toFixed(1)}
                              </div>

                              {/* Rank */}
                              <div className="text-[10px] text-gray-600">
                                رتبه: {(courseData as CourseData).rank}/
                                {(courseData as CourseData).totalStudents}
                              </div>

                              {/* Performance */}
                              <div
                                className={`text-[9px] px-1 rounded ${
                                  (courseData as CourseData).performance ===
                                  "عالی"
                                    ? "bg-green-200 text-green-800"
                                    : (courseData as CourseData).performance ===
                                      "خوب"
                                    ? "bg-blue-200 text-blue-800"
                                    : (courseData as CourseData).performance ===
                                      "متوسط"
                                    ? "bg-yellow-200 text-yellow-800"
                                    : "bg-red-200 text-red-800"
                                }`}
                              >
                                {(courseData as CourseData).performance}
                              </div>

                              {/* Progress indicator */}
                              {(courseData as CourseData).progressInfo && (
                                <div
                                  className={`text-[9px] px-1 rounded ${
                                    (courseData as CourseData).progressInfo!
                                      .hasProgress
                                      ? "bg-green-200 text-green-700"
                                      : "bg-red-200 text-red-700"
                                  }`}
                                >
                                  {(courseData as CourseData).progressInfo!
                                    .hasProgress
                                    ? "↗"
                                    : "↘"}
                                  {(courseData as CourseData).progressInfo!
                                    .scoreDiff > 0
                                    ? "+"
                                    : ""}
                                  {(
                                    courseData as CourseData
                                  ).progressInfo!.scoreDiff.toFixed(1)}
                                </div>
                              )}

                              {/* Difference from average */}
                              <div
                                className={`text-[9px] ${
                                  (courseData as CourseData).diffFromAvg >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {(courseData as CourseData).diffFromAvg >= 0
                                  ? "+"
                                  : ""}
                                {(courseData as CourseData).diffFromAvg}
                              </div>
                            </div>
                          ) : !showIndividualGrades && isCourseAvgData ? (
                            <div className="space-y-0.5">
                              {/* Average Score */}
                              <div
                                className={`text-xs font-bold px-1 py-0.5 rounded ${
                                  (courseData as CourseAverageData)
                                    .averageScore >= 18
                                    ? "bg-green-100 text-green-800"
                                    : (courseData as CourseAverageData)
                                        .averageScore >= 15
                                    ? "bg-blue-100 text-blue-800"
                                    : (courseData as CourseAverageData)
                                        .averageScore >= 12
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {(
                                  courseData as CourseAverageData
                                ).averageScore.toFixed(1)}
                              </div>

                              {/* Grade Count */}
                              <div className="text-[10px] text-gray-600">
                                {(courseData as CourseAverageData).gradeCount}{" "}
                                نمره
                              </div>

                              {/* Performance */}
                              <div
                                className={`text-[9px] px-1 rounded ${
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
                                {(courseData as CourseAverageData).performance}
                              </div>

                              {/* Best/Worst Range */}
                              <div className="text-[9px] text-gray-600">
                                {(
                                  courseData as CourseAverageData
                                ).worstScore.toFixed(1)}{" "}
                                -{" "}
                                {(
                                  courseData as CourseAverageData
                                ).bestScore.toFixed(1)}
                              </div>

                              {/* Difference from class average */}
                              <div
                                className={`text-[9px] ${
                                  (courseData as CourseAverageData)
                                    .diffFromClassAvg >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {(courseData as CourseAverageData)
                                  .diffFromClassAvg >= 0
                                  ? "+"
                                  : ""}
                                {
                                  (courseData as CourseAverageData)
                                    .diffFromClassAvg
                                }
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
                <span>عالی (18-20)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 rounded ml-1"></div>
                <span>خوب (15-18)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-100 rounded ml-1"></div>
                <span>متوسط (12-15)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-100 rounded ml-1"></div>
                <span>ضعیف (&lt;12)</span>
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
                  <span className="ml-1">تغییر نمره</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-gray-600">Min-Max</span>
                  <span className="ml-1">محدوده نمرات</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
