"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

interface StudentData {
  studentCode: string;
  studentName: string;
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

interface TeacherStatisticsProps {
  studentsArray: StudentData[];
}

export function TeacherStatistics({ studentsArray }: TeacherStatisticsProps) {
  return (
    <Card className="border-blue-200 bg-blue-50 print:hidden">
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
                      <span className="font-medium">{student.studentName}</span>
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
                      <span className="font-medium">{student.studentName}</span>
                    </div>
                    <div className="text-sm text-red-600">
                      {student.overallProgress?.totalScoreChange} نمره (
                      {100 - (student.overallProgress?.progressPercentage || 0)}
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
              <div className="text-xs text-green-600">دانش‌آموز با پیشرفت</div>
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
  );
}
