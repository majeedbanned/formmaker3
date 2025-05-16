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
  formatter: (value: any) => string;
};

const rankingOptions: RankingOption[] = [
  {
    value: "totalActivities",
    label: "کل فعالیت‌ها",
    description: "رتبه‌بندی بر اساس مجموع همه فعالیت‌های ثبت شده",
    colorClass: "bg-blue-100 text-blue-800 border-blue-200",
    formatter: (value: number) => `${value.toLocaleString()} فعالیت`,
  },
  {
    value: "gradeCounts",
    label: "تعداد نمرات",
    description: "رتبه‌بندی بر اساس تعداد نمرات ثبت شده",
    colorClass: "bg-green-100 text-green-800 border-green-200",
    formatter: (value: number) => `${value.toLocaleString()} نمره`,
  },
  {
    value: "presenceRecords",
    label: "حضور و غیاب",
    description: "رتبه‌بندی بر اساس تعداد ثبت حضور و غیاب",
    colorClass: "bg-amber-100 text-amber-800 border-amber-200",
    formatter: (value: number) => `${value.toLocaleString()} رکورد`,
  },
  {
    value: "assessments",
    label: "ارزیابی‌ها",
    description: "رتبه‌بندی بر اساس تعداد ارزیابی‌های توصیفی",
    colorClass: "bg-purple-100 text-purple-800 border-purple-200",
    formatter: (value: number) => `${value.toLocaleString()} ارزیابی`,
  },
  {
    value: "comments",
    label: "یادداشت‌ها",
    description: "رتبه‌بندی بر اساس تعداد یادداشت‌های ثبت شده",
    colorClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    formatter: (value: number) => `${value.toLocaleString()} یادداشت`,
  },
  {
    value: "events",
    label: "رویدادها",
    description: "رتبه‌بندی بر اساس تعداد رویدادهای ثبت شده",
    colorClass: "bg-pink-100 text-pink-800 border-pink-200",
    formatter: (value: number) => `${value.toLocaleString()} رویداد`,
  },
  {
    value: "lastActivity",
    label: "آخرین فعالیت",
    description: "رتبه‌بندی بر اساس تاریخ آخرین فعالیت (اخیرترین)",
    colorClass: "bg-orange-100 text-orange-800 border-orange-200",
    formatter: (value: Date) =>
      value ? new Date(value).toLocaleDateString("fa-IR") : "-",
  },
  {
    value: "classCoverage",
    label: "پوشش کلاس‌ها",
    description:
      "رتبه‌بندی بر اساس درصد کلاس‌هایی که معلم برای آنها فعالیت ثبت کرده است",
    colorClass: "bg-teal-100 text-teal-800 border-teal-200",
    formatter: (value: number) => `${value?.toFixed(1) || 0}%`,
  },
  {
    value: "studentCoverage",
    label: "پوشش دانش‌آموزان",
    description:
      "رتبه‌بندی بر اساس درصد دانش‌آموزانی که معلم برای آنها فعالیت ثبت کرده است",
    colorClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
    formatter: (value: number) => `${value?.toFixed(1) || 0}%`,
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-6" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-10 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>رتبه‌بندی معلمان بر اساس فعالیت</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select
              value={selectedMetric}
              onValueChange={(value) =>
                setSelectedMetric(value as RankingMetric)
              }
            >
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="انتخاب معیار رتبه‌بندی" />
              </SelectTrigger>
              <SelectContent>
                {rankingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-2">
              {currentRankingOption.description}
            </p>
          </div>

          <div className="space-y-4">
            {sortedActivities.length > 0 ? (
              sortedActivities.slice(0, 10).map((teacher, index) => {
                const value = teacher[selectedMetric as keyof TeacherActivity];
                const formattedValue = currentRankingOption.formatter(value);

                return (
                  <div
                    key={teacher.teacherCode}
                    className="flex items-center border-b border-gray-100 pb-3"
                  >
                    <div className="flex-none w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xl text-gray-700 mr-4">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">
                        {teachers[teacher.teacherCode] || teacher.teacherCode}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline" className="bg-gray-50">
                          {teacher.totalActivities.toLocaleString()} فعالیت کل
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50">
                          {teacher.gradeCounts.toLocaleString()} نمره
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50">
                          {teacher.presenceRecords.toLocaleString()} حضور/غیاب
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-none">
                      <Badge
                        className={`px-3 py-1 text-base ${currentRankingOption.colorClass}`}
                      >
                        {formattedValue}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                هیچ اطلاعاتی در بازه زمانی انتخاب شده یافت نشد
              </div>
            )}
          </div>

          {sortedActivities.length > 10 && (
            <div className="text-center text-sm text-gray-500 mt-4">
              ۱۰ معلم برتر از مجموع {sortedActivities.length} معلم نمایش داده
              شده است
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional statistical cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800">پرتلاش‌ترین معلمان</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedActivities.length > 0 ? (
                sortedActivities
                  .sort((a, b) => b.totalActivities - a.totalActivities)
                  .slice(0, 5)
                  .map((teacher, index) => (
                    <div
                      key={teacher.teacherCode}
                      className="flex items-center"
                    >
                      <div className="flex-none w-8 h-8 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-800 ml-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-green-900">
                          {teachers[teacher.teacherCode] || teacher.teacherCode}
                        </p>
                      </div>
                      <div className="flex-none">
                        <Badge className="bg-green-100 text-green-800">
                          {teacher.totalActivities.toLocaleString()} فعالیت
                        </Badge>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  داده‌ای یافت نشد
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800">بیشترین نمره‌دهی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedActivities.length > 0 ? (
                sortedActivities
                  .sort((a, b) => b.gradeCounts - a.gradeCounts)
                  .slice(0, 5)
                  .map((teacher, index) => (
                    <div
                      key={teacher.teacherCode}
                      className="flex items-center"
                    >
                      <div className="flex-none w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-800 ml-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-amber-900">
                          {teachers[teacher.teacherCode] || teacher.teacherCode}
                        </p>
                      </div>
                      <div className="flex-none">
                        <Badge className="bg-amber-100 text-amber-800">
                          {teacher.gradeCounts.toLocaleString()} نمره
                        </Badge>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  داده‌ای یافت نشد
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800">بیشترین حضور و غیاب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedActivities.length > 0 ? (
                sortedActivities
                  .sort((a, b) => b.presenceRecords - a.presenceRecords)
                  .slice(0, 5)
                  .map((teacher, index) => (
                    <div
                      key={teacher.teacherCode}
                      className="flex items-center"
                    >
                      <div className="flex-none w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-800 ml-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">
                          {teachers[teacher.teacherCode] || teacher.teacherCode}
                        </p>
                      </div>
                      <div className="flex-none">
                        <Badge className="bg-blue-100 text-blue-800">
                          {teacher.presenceRecords.toLocaleString()} رکورد
                        </Badge>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-4">
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
