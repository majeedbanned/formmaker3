import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TeacherActivity } from "./TeacherActivities";

interface TeacherSummaryProps {
  activities: TeacherActivity[];
  teachers: Record<string, string>;
  loading: boolean;
}

const TeacherSummary: React.FC<TeacherSummaryProps> = ({
  activities,
  teachers,
  loading,
}) => {
  // Calculate overall stats
  const totalActivities = activities.reduce(
    (sum, teacher) => sum + teacher.totalActivities,
    0
  );

  const totalGrades = activities.reduce(
    (sum, teacher) => sum + teacher.gradeCounts,
    0
  );

  const totalPresence = activities.reduce(
    (sum, teacher) => sum + teacher.presenceRecords,
    0
  );

  const totalAssessments = activities.reduce(
    (sum, teacher) => sum + teacher.assessments,
    0
  );

  const totalComments = activities.reduce(
    (sum, teacher) => sum + teacher.comments,
    0
  );

  const totalEvents = activities.reduce(
    (sum, teacher) => sum + teacher.events,
    0
  );

  // Find most active and least active teachers
  const mostActiveTeacher =
    activities.length > 0
      ? activities.reduce((prev, current) =>
          prev.totalActivities > current.totalActivities ? prev : current
        )
      : null;

  const leastActiveTeacher =
    activities.length > 0
      ? activities.reduce((prev, current) =>
          prev.totalActivities < current.totalActivities ? prev : current
        )
      : null;

  // Get average activities per teacher
  const avgActivitiesPerTeacher =
    activities.length > 0 ? totalActivities / activities.length : 0;

  // Get the most recent active teacher
  const mostRecentlyActiveTeacher =
    activities.length > 0
      ? activities.reduce((prev, current) => {
          if (!prev.lastActivity) return current;
          if (!current.lastActivity) return prev;
          return new Date(current.lastActivity) > new Date(prev.lastActivity)
            ? current
            : prev;
        })
      : null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800">کل فعالیت‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">
              {totalActivities.toLocaleString()}
            </p>
            <div className="grid grid-cols-3 gap-1 mt-4">
              <div className="text-center">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 mb-1"
                >
                  نمرات
                </Badge>
                <p className="text-sm font-medium">
                  {totalGrades.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 mb-1"
                >
                  حضور و غیاب
                </Badge>
                <p className="text-sm font-medium">
                  {totalPresence.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 mb-1"
                >
                  ارزیابی‌ها
                </Badge>
                <p className="text-sm font-medium">
                  {totalAssessments.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              <div className="text-center">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 mb-1"
                >
                  یادداشت‌ها
                </Badge>
                <p className="text-sm font-medium">
                  {totalComments.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 mb-1"
                >
                  رویدادها
                </Badge>
                <p className="text-sm font-medium">
                  {totalEvents.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800">فعال‌ترین معلم</CardTitle>
          </CardHeader>
          <CardContent>
            {mostActiveTeacher ? (
              <>
                <p className="text-xl font-bold text-green-700">
                  {teachers[mostActiveTeacher.teacherCode] ||
                    mostActiveTeacher.teacherCode}
                </p>
                <p className="text-3xl font-bold text-green-700 my-2">
                  {mostActiveTeacher.totalActivities.toLocaleString()} فعالیت
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge className="bg-green-200 text-green-800">
                    {mostActiveTeacher.gradeCounts} نمره
                  </Badge>
                  <Badge className="bg-green-200 text-green-800">
                    {mostActiveTeacher.presenceRecords} حضور و غیاب
                  </Badge>
                  <Badge className="bg-green-200 text-green-800">
                    {mostActiveTeacher.assessments} ارزیابی
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">اطلاعاتی موجود نیست</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800">
              میانگین فعالیت معلمان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700">
              {avgActivitiesPerTeacher.toFixed(1)}
            </p>
            <p className="text-sm text-amber-800 mb-2">
              فعالیت به ازای هر معلم
            </p>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div>
                <p className="text-xs font-medium text-amber-800 mb-1">
                  تعداد معلمان فعال:
                </p>
                <p className="text-lg font-bold text-amber-700">
                  {activities.length} معلم
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-amber-800 mb-1">
                  متوسط نمره‌دهی:
                </p>
                <p className="text-lg font-bold text-amber-700">
                  {activities.length > 0
                    ? (totalGrades / activities.length).toFixed(1)
                    : "0"}{" "}
                  نمره
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-800">آخرین فعالیت</CardTitle>
          </CardHeader>
          <CardContent>
            {mostRecentlyActiveTeacher &&
            mostRecentlyActiveTeacher.lastActivity ? (
              <>
                <p className="text-xl font-bold text-purple-700">
                  {teachers[mostRecentlyActiveTeacher.teacherCode] ||
                    mostRecentlyActiveTeacher.teacherCode}
                </p>
                <p className="text-sm text-purple-700 my-2">
                  در تاریخ{" "}
                  {new Date(
                    mostRecentlyActiveTeacher.lastActivity
                  ).toLocaleDateString("fa-IR")}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge className="bg-purple-200 text-purple-800">
                    {mostRecentlyActiveTeacher.totalActivities} فعالیت در کل
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">اطلاعاتی موجود نیست</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800">کم‌فعالیت‌ترین معلم</CardTitle>
          </CardHeader>
          <CardContent>
            {leastActiveTeacher ? (
              <>
                <p className="text-xl font-bold text-red-700">
                  {teachers[leastActiveTeacher.teacherCode] ||
                    leastActiveTeacher.teacherCode}
                </p>
                <p className="text-3xl font-bold text-red-700 my-2">
                  {leastActiveTeacher.totalActivities.toLocaleString()} فعالیت
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge className="bg-red-200 text-red-800">
                    {leastActiveTeacher.gradeCounts} نمره
                  </Badge>
                  <Badge className="bg-red-200 text-red-800">
                    {leastActiveTeacher.presenceRecords} حضور و غیاب
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">اطلاعاتی موجود نیست</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-800">آمار پوشش</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      پوشش کلاس‌ها:
                    </p>
                    <p className="text-2xl font-bold text-gray-700">
                      {(
                        activities.reduce(
                          (sum, teacher) => sum + (teacher.classCoverage || 0),
                          0
                        ) / activities.length
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      پوشش دانش‌آموزان:
                    </p>
                    <p className="text-2xl font-bold text-gray-700">
                      {(
                        activities.reduce(
                          (sum, teacher) =>
                            sum + (teacher.studentCoverage || 0),
                          0
                        ) / activities.length
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  میانگین درصد کلاس‌ها و دانش‌آموزانی که معلمان برای آنها فعالیت
                  ثبت کرده‌اند
                </p>
              </>
            ) : (
              <p className="text-gray-500">اطلاعاتی موجود نیست</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Teacher activity list */}
      <Card>
        <CardHeader>
          <CardTitle>لیست فعالیت معلمان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-2 text-right">نام معلم</th>
                  <th className="p-2 text-center">کل فعالیت‌ها</th>
                  <th className="p-2 text-center">نمرات</th>
                  <th className="p-2 text-center">حضور و غیاب</th>
                  <th className="p-2 text-center">ارزیابی‌ها</th>
                  <th className="p-2 text-center">یادداشت‌ها</th>
                  <th className="p-2 text-center">رویدادها</th>
                  <th className="p-2 text-center">آخرین فعالیت</th>
                </tr>
              </thead>
              <tbody>
                {activities.length > 0 ? (
                  activities.map((teacher) => (
                    <tr
                      key={teacher.teacherCode}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-2 font-medium">
                        {teachers[teacher.teacherCode] || teacher.teacherCode}
                      </td>
                      <td className="p-2 text-center font-bold">
                        {teacher.totalActivities.toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        {teacher.gradeCounts.toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        {teacher.presenceRecords.toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        {teacher.assessments.toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        {teacher.comments.toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        {teacher.events.toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        {teacher.lastActivity
                          ? new Date(teacher.lastActivity).toLocaleDateString(
                              "fa-IR"
                            )
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">
                      هیچ اطلاعاتی در بازه زمانی انتخاب شده یافت نشد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherSummary;
