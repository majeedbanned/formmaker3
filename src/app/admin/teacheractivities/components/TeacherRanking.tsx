import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeacherActivity } from "./TeacherActivities";

interface TeacherRankingProps {
  activities: TeacherActivity[];
  teachers: Record<string, string>;
  loading: boolean;
}

type RankingMetric =
  | "totalActivities"
  | "gradeCounts"
  | "presenceRecords"
  | "assessments"
  | "comments"
  | "events"
  | "lastActivity"
  | "classCoverage"
  | "studentCoverage";

type RankingOption = {
  value: RankingMetric;
  label: string;
  description: string;
  colorClass: string;
  formatter: (value: number | Date | undefined) => string;
};

const rankingOptions: RankingOption[] = [
  {
    value: "totalActivities",
    label: "کل فعالیت‌ها",
    description: "رتبه‌بندی بر اساس مجموع همه فعالیت‌های ثبت شده",
    colorClass: "bg-blue-100 text-blue-800 border-blue-200",
    formatter: (value: number | undefined) =>
      `${value?.toLocaleString() || 0} فعالیت`,
  },
  {
    value: "gradeCounts",
    label: "تعداد نمرات",
    description: "رتبه‌بندی بر اساس تعداد نمرات ثبت شده",
    colorClass: "bg-green-100 text-green-800 border-green-200",
    formatter: (value: number | undefined) =>
      `${value?.toLocaleString() || 0} نمره`,
  },
  {
    value: "presenceRecords",
    label: "حضور و غیاب",
    description: "رتبه‌بندی بر اساس تعداد ثبت حضور و غیاب",
    colorClass: "bg-amber-100 text-amber-800 border-amber-200",
    formatter: (value: number | undefined) =>
      `${value?.toLocaleString() || 0} رکورد`,
  },
  {
    value: "assessments",
    label: "ارزیابی‌ها",
    description: "رتبه‌بندی بر اساس تعداد ارزیابی‌های توصیفی",
    colorClass: "bg-purple-100 text-purple-800 border-purple-200",
    formatter: (value: number | undefined) =>
      `${value?.toLocaleString() || 0} ارزیابی`,
  },
  {
    value: "comments",
    label: "یادداشت‌ها",
    description: "رتبه‌بندی بر اساس تعداد یادداشت‌های ثبت شده",
    colorClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    formatter: (value: number | undefined) =>
      `${value?.toLocaleString() || 0} یادداشت`,
  },
  {
    value: "events",
    label: "رویدادها",
    description: "رتبه‌بندی بر اساس تعداد رویدادهای ثبت شده",
    colorClass: "bg-pink-100 text-pink-800 border-pink-200",
    formatter: (value: number | undefined) =>
      `${value?.toLocaleString() || 0} رویداد`,
  },
  {
    value: "lastActivity",
    label: "آخرین فعالیت",
    description: "رتبه‌بندی بر اساس تاریخ آخرین فعالیت (اخیرترین)",
    colorClass: "bg-orange-100 text-orange-800 border-orange-200",
    formatter: (value: Date | undefined) =>
      value ? new Date(value).toLocaleDateString("fa-IR") : "-",
  },
  {
    value: "classCoverage",
    label: "پوشش کلاس‌ها",
    description:
      "رتبه‌بندی بر اساس درصد کلاس‌هایی که معلم برای آنها فعالیت ثبت کرده است",
    colorClass: "bg-teal-100 text-teal-800 border-teal-200",
    formatter: (value: number | undefined) => `${value?.toFixed(1) || 0}%`,
  },
  {
    value: "studentCoverage",
    label: "پوشش دانش‌آموزان",
    description:
      "رتبه‌بندی بر اساس درصد دانش‌آموزانی که معلم برای آنها فعالیت ثبت کرده است",
    colorClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
    formatter: (value: number | undefined) => `${value?.toFixed(1) || 0}%`,
  },
];

const TeacherRanking: React.FC<TeacherRankingProps> = ({
  activities,
  teachers,
  loading,
}) => {
  const [selectedMetric, setSelectedMetric] =
    useState<RankingMetric>("totalActivities");

  // Find the current ranking option
  const currentRankingOption =
    rankingOptions.find((option) => option.value === selectedMetric) ||
    rankingOptions[0];

  // Sort activities by the selected metric
  const sortedActivities = [...activities].sort((a, b) => {
    if (selectedMetric === "lastActivity") {
      // For lastActivity, sort by most recent first
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return (
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    } else {
      // For other metrics, sort by highest value first
      return (
        ((b[selectedMetric as keyof TeacherActivity] as number) || 0) -
        ((a[selectedMetric as keyof TeacherActivity] as number) || 0)
      );
    }
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" dir="rtl">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full mb-6" />
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b border-gray-100 pb-4"
                >
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Main Ranking Card */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100">
          <CardTitle className="flex items-center text-blue-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            رتبه‌بندی معلمان بر اساس فعالیت
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  انتخاب معیار رتبه‌بندی:
                </label>
                <Select
                  value={selectedMetric}
                  onValueChange={(value) =>
                    setSelectedMetric(value as RankingMetric)
                  }
                >
                  <SelectTrigger className="w-full md:w-64 bg-white shadow-sm border-gray-200">
                    <SelectValue placeholder="انتخاب معیار رتبه‌بندی" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {rankingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center">
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                  <span className="font-medium text-gray-700 mb-1 block">
                    توضیح:
                  </span>
                  {currentRankingOption.description}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {sortedActivities.length > 0 ? (
              sortedActivities.slice(0, 10).map((teacher, index) => {
                const value = teacher[selectedMetric as keyof TeacherActivity];
                const formattedValue = currentRankingOption.formatter(
                  value as any
                );

                // Calculate a progress percentage for the progress bar
                const maxValue =
                  (sortedActivities[0][
                    selectedMetric as keyof TeacherActivity
                  ] as number) || 1;
                const currentValue = (value as number) || 0;
                const progressPercentage =
                  selectedMetric === "lastActivity"
                    ? 100 // For dates, we don't show a progress bar
                    : Math.round((currentValue / maxValue) * 100);

                return (
                  <div
                    key={teacher.teacherCode}
                    className="flex items-center border-b border-gray-100 pb-4 pt-1 hover:bg-blue-50/30 p-3 rounded-lg transition-colors"
                  >
                    <div
                      className={`flex-none w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl mr-4 relative ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                          : index === 1
                          ? "bg-gray-100 text-gray-800 border-2 border-gray-300"
                          : index === 2
                          ? "bg-amber-100 text-amber-800 border-2 border-amber-300"
                          : "bg-blue-50 text-blue-800 border border-blue-100"
                      }`}
                    >
                      {/* Medal for top 3 */}
                      {index < 3 && (
                        <span
                          className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white border-2 shadow-sm text-xs font-bold"
                          style={{
                            borderColor:
                              index === 0
                                ? "#FFC107"
                                : index === 1
                                ? "#9E9E9E"
                                : "#CD7F32",
                            color:
                              index === 0
                                ? "#FFC107"
                                : index === 1
                                ? "#9E9E9E"
                                : "#CD7F32",
                          }}
                        >
                          {index === 0 ? "1" : index === 1 ? "2" : "3"}
                        </span>
                      )}
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                        <h3 className="font-bold text-lg text-gray-900 truncate">
                          {teachers[teacher.teacherCode] || teacher.teacherCode}
                        </h3>
                        <div className="mt-1 md:mt-0">
                          <Badge
                            className={`px-3 py-1 text-base shadow-sm rounded-lg ${currentRankingOption.colorClass}`}
                          >
                            {formattedValue}
                          </Badge>
                        </div>
                      </div>

                      {selectedMetric !== "lastActivity" && (
                        <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
                          <div
                            className={`h-2.5 rounded-full ${
                              index === 0
                                ? "bg-gradient-to-r from-yellow-300 to-yellow-500"
                                : index === 1
                                ? "bg-gradient-to-r from-gray-300 to-gray-500"
                                : index === 2
                                ? "bg-gradient-to-r from-amber-300 to-amber-500"
                                : "bg-gradient-to-r from-blue-300 to-blue-500"
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 shadow-sm"
                        >
                          {teacher.totalActivities.toLocaleString()} فعالیت کل
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 shadow-sm"
                        >
                          {teacher.gradeCounts.toLocaleString()} نمره
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 shadow-sm"
                        >
                          {teacher.presenceRecords.toLocaleString()} حضور/غیاب
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400 mb-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-lg font-medium">
                  هیچ اطلاعاتی در بازه زمانی انتخاب شده یافت نشد
                </p>
                <p className="mt-1">
                  لطفاً بازه زمانی دیگری را انتخاب کنید یا فیلترها را تغییر دهید
                </p>
              </div>
            )}
          </div>

          {sortedActivities.length > 10 && (
            <div className="text-center text-sm text-gray-500 mt-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
              ۱۰ معلم برتر از مجموع {sortedActivities.length} معلم نمایش داده
              شده است
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional statistical cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg hover:-translate-y-1 duration-300 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 to-green-600/10">
            <CardTitle className="text-green-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-green-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              پرتلاش‌ترین معلمان
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {sortedActivities.length > 0 ? (
                sortedActivities
                  .sort((a, b) => b.totalActivities - a.totalActivities)
                  .slice(0, 5)
                  .map((teacher, index) => (
                    <div
                      key={teacher.teacherCode}
                      className="flex items-center bg-white/50 p-3 rounded-lg shadow-sm hover:bg-white transition-colors"
                    >
                      <div className="flex-none w-8 h-8 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-800 ml-3 border border-green-200">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-green-900 truncate">
                          {teachers[teacher.teacherCode] || teacher.teacherCode}
                        </p>
                      </div>
                      <div className="flex-none">
                        <Badge className="bg-green-100 text-green-800 shadow-sm px-2 py-1 rounded-md">
                          {teacher.totalActivities.toLocaleString()} فعالیت
                        </Badge>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-6 bg-white/70 rounded-lg">
                  داده‌ای یافت نشد
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg hover:-translate-y-1 duration-300 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
          <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10">
            <CardTitle className="text-amber-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              بیشترین نمره‌دهی
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {sortedActivities.length > 0 ? (
                sortedActivities
                  .sort((a, b) => b.gradeCounts - a.gradeCounts)
                  .slice(0, 5)
                  .map((teacher, index) => (
                    <div
                      key={teacher.teacherCode}
                      className="flex items-center bg-white/50 p-3 rounded-lg shadow-sm hover:bg-white transition-colors"
                    >
                      <div className="flex-none w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-800 ml-3 border border-amber-200">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-amber-900 truncate">
                          {teachers[teacher.teacherCode] || teacher.teacherCode}
                        </p>
                      </div>
                      <div className="flex-none">
                        <Badge className="bg-amber-100 text-amber-800 shadow-sm px-2 py-1 rounded-md">
                          {teacher.gradeCounts.toLocaleString()} نمره
                        </Badge>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-6 bg-white/70 rounded-lg">
                  داده‌ای یافت نشد
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg hover:-translate-y-1 duration-300 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10">
            <CardTitle className="text-blue-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              بیشترین حضور و غیاب
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {sortedActivities.length > 0 ? (
                sortedActivities
                  .sort((a, b) => b.presenceRecords - a.presenceRecords)
                  .slice(0, 5)
                  .map((teacher, index) => (
                    <div
                      key={teacher.teacherCode}
                      className="flex items-center bg-white/50 p-3 rounded-lg shadow-sm hover:bg-white transition-colors"
                    >
                      <div className="flex-none w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-800 ml-3 border border-blue-200">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-blue-900 truncate">
                          {teachers[teacher.teacherCode] || teacher.teacherCode}
                        </p>
                      </div>
                      <div className="flex-none">
                        <Badge className="bg-blue-100 text-blue-800 shadow-sm px-2 py-1 rounded-md">
                          {teacher.presenceRecords.toLocaleString()} رکورد
                        </Badge>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-6 bg-white/70 rounded-lg">
                  داده‌ای یافت نشد
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherRanking;
