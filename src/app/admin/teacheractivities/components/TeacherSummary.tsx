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
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse"
        dir="rtl"
      >
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="w-full overflow-hidden shadow-md">
            <CardHeader className="pb-2 bg-gray-50">
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="p-6">
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
    <div className="space-y-8" dir="rtl">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10">
            <CardTitle className="text-blue-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              کل فعالیت‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-4xl font-bold text-blue-700 mb-3">
              {totalActivities.toLocaleString()}
            </p>
            <div className="grid grid-cols-3 gap-1 mt-4">
              <div className="text-center">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 mb-1 font-medium px-3 py-1 rounded-lg shadow-sm"
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
                  className="bg-blue-50 text-blue-700 mb-1 font-medium px-3 py-1 rounded-lg shadow-sm"
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
                  className="bg-blue-50 text-blue-700 mb-1 font-medium px-3 py-1 rounded-lg shadow-sm"
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
                  className="bg-blue-50 text-blue-700 mb-1 font-medium px-3 py-1 rounded-lg shadow-sm"
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
                  className="bg-blue-50 text-blue-700 mb-1 font-medium px-3 py-1 rounded-lg shadow-sm"
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

        <Card className="overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 to-green-600/10">
            <CardTitle className="text-green-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-green-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" />
              </svg>
              فعال‌ترین معلم
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {mostActiveTeacher ? (
              <>
                <p className="text-xl font-bold text-green-700">
                  {teachers[mostActiveTeacher.teacherCode] ||
                    mostActiveTeacher.teacherCode}
                </p>
                <p className="text-4xl font-bold text-green-700 my-3">
                  {mostActiveTeacher.totalActivities.toLocaleString()}{" "}
                  <span className="text-base font-normal">فعالیت</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className="bg-green-200 text-green-800 shadow-sm rounded-full px-3 py-1">
                    {mostActiveTeacher.gradeCounts} نمره
                  </Badge>
                  <Badge className="bg-green-200 text-green-800 shadow-sm rounded-full px-3 py-1">
                    {mostActiveTeacher.presenceRecords} حضور و غیاب
                  </Badge>
                  <Badge className="bg-green-200 text-green-800 shadow-sm rounded-full px-3 py-1">
                    {mostActiveTeacher.assessments} ارزیابی
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">اطلاعاتی موجود نیست</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
          <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10">
            <CardTitle className="text-amber-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              میانگین فعالیت معلمان
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-4xl font-bold text-amber-700">
              {avgActivitiesPerTeacher.toFixed(1)}
            </p>
            <p className="text-sm text-amber-800 mb-2 mt-1">
              فعالیت به ازای هر معلم
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 bg-amber-50 p-3 rounded-lg">
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

        <Card className="overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
          <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/10 to-purple-600/10">
            <CardTitle className="text-purple-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-purple-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              آخرین فعالیت
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {mostRecentlyActiveTeacher &&
            mostRecentlyActiveTeacher.lastActivity ? (
              <>
                <p className="text-xl font-bold text-purple-700">
                  {teachers[mostRecentlyActiveTeacher.teacherCode] ||
                    mostRecentlyActiveTeacher.teacherCode}
                </p>
                <p className="text-base text-purple-700 my-3 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1 text-purple-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {new Date(
                    mostRecentlyActiveTeacher.lastActivity
                  ).toLocaleDateString("fa-IR")}
                </p>
                <div className="flex flex-wrap gap-1 mt-4">
                  <Badge className="bg-purple-200 text-purple-800 shadow-sm rounded-full px-3 py-1">
                    {mostRecentlyActiveTeacher.totalActivities} فعالیت در کل
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">اطلاعاتی موجود نیست</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
          <CardHeader className="pb-2 bg-gradient-to-r from-red-500/10 to-red-600/10">
            <CardTitle className="text-red-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-red-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" />
              </svg>
              کم‌فعالیت‌ترین معلم
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {leastActiveTeacher ? (
              <>
                <p className="text-xl font-bold text-red-700">
                  {teachers[leastActiveTeacher.teacherCode] ||
                    leastActiveTeacher.teacherCode}
                </p>
                <p className="text-4xl font-bold text-red-700 my-3">
                  {leastActiveTeacher.totalActivities.toLocaleString()}{" "}
                  <span className="text-base font-normal">فعالیت</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className="bg-red-200 text-red-800 shadow-sm rounded-full px-3 py-1">
                    {leastActiveTeacher.gradeCounts} نمره
                  </Badge>
                  <Badge className="bg-red-200 text-red-800 shadow-sm rounded-full px-3 py-1">
                    {leastActiveTeacher.presenceRecords} حضور و غیاب
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">اطلاعاتی موجود نیست</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
          <CardHeader className="pb-2 bg-gradient-to-r from-gray-500/10 to-gray-600/10">
            <CardTitle className="text-gray-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-gray-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                  clipRule="evenodd"
                />
              </svg>
              آمار پوشش
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {activities.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
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
                  <div className="bg-white rounded-lg p-3 shadow-sm">
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
      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
          <CardTitle className="flex items-center text-gray-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            لیست فعالیت معلمان
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-3 text-right font-medium text-gray-700">
                    نام معلم
                  </th>
                  <th className="p-3 text-center font-medium text-gray-700">
                    کل فعالیت‌ها
                  </th>
                  <th className="p-3 text-center font-medium text-gray-700">
                    نمرات
                  </th>
                  <th className="p-3 text-center font-medium text-gray-700">
                    حضور و غیاب
                  </th>
                  <th className="p-3 text-center font-medium text-gray-700">
                    ارزیابی‌ها
                  </th>
                  <th className="p-3 text-center font-medium text-gray-700">
                    یادداشت‌ها
                  </th>
                  <th className="p-3 text-center font-medium text-gray-700">
                    رویدادها
                  </th>
                  <th className="p-3 text-center font-medium text-gray-700">
                    آخرین فعالیت
                  </th>
                </tr>
              </thead>
              <tbody>
                {activities.length > 0 ? (
                  activities.map((teacher) => (
                    <tr
                      key={teacher.teacherCode}
                      className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="p-3 font-medium text-gray-900">
                        {teachers[teacher.teacherCode] || teacher.teacherCode}
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-sm">
                          {teacher.totalActivities.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 text-center text-green-700">
                        {teacher.gradeCounts.toLocaleString()}
                      </td>
                      <td className="p-3 text-center text-amber-700">
                        {teacher.presenceRecords.toLocaleString()}
                      </td>
                      <td className="p-3 text-center text-purple-700">
                        {teacher.assessments.toLocaleString()}
                      </td>
                      <td className="p-3 text-center text-indigo-700">
                        {teacher.comments.toLocaleString()}
                      </td>
                      <td className="p-3 text-center text-pink-700">
                        {teacher.events.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        {teacher.lastActivity ? (
                          <span className="bg-gray-100 px-2 py-1 rounded-lg text-sm font-medium text-gray-700">
                            {new Date(teacher.lastActivity).toLocaleDateString(
                              "fa-IR"
                            )}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">
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
