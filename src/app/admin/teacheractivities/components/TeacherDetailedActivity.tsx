import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TeacherDetailedStats } from "./TeacherActivities";

interface TeacherDetailedActivityProps {
  teacherStats: TeacherDetailedStats | null;
  teachers: Record<string, string>;
  loading: boolean;
  selectedTeacher: string;
}

const TeacherDetailedActivity: React.FC<TeacherDetailedActivityProps> = ({
  teacherStats,
  teachers,
  loading,
  selectedTeacher,
}) => {
  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR");
  };

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Skeleton className="h-12 w-1/2 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // No teacher selected message
  if (!selectedTeacher) {
    return (
      <div className="text-center py-12" dir="rtl">
        <h3 className="text-xl font-medium mb-2">لطفاً یک معلم انتخاب کنید</h3>
        <p className="text-gray-500">
          برای مشاهده جزئیات فعالیت، یک معلم را از منوی بالا انتخاب کنید
        </p>
      </div>
    );
  }

  // No data message
  if (!teacherStats) {
    return (
      <div className="text-center py-12" dir="rtl">
        <h3 className="text-xl font-medium mb-2">اطلاعاتی یافت نشد</h3>
        <p className="text-gray-500">
          هیچ داده‌ای برای معلم انتخاب شده در بازه زمانی مشخص شده وجود ندارد
        </p>
      </div>
    );
  }

  // Calculate teacher totals
  const totalGrades = teacherStats.classes.reduce(
    (sum, cls) => sum + cls.grades,
    0
  );

  const totalPresenceRecords = teacherStats.classes.reduce(
    (sum, cls) => sum + cls.presenceRecords,
    0
  );

  const totalAssessments = teacherStats.classes.reduce(
    (sum, cls) => sum + cls.assessments,
    0
  );

  const totalComments = teacherStats.classes.reduce(
    (sum, cls) => sum + cls.comments,
    0
  );

  const totalEvents = teacherStats.classes.reduce(
    (sum, cls) => sum + cls.events,
    0
  );

  const totalActivities =
    totalGrades +
    totalPresenceRecords +
    totalAssessments +
    totalComments +
    totalEvents;

  const avgClassCoverage =
    teacherStats.classes.length > 0
      ? teacherStats.classes.reduce((sum, cls) => sum + cls.classCoverage, 0) /
        teacherStats.classes.length
      : 0;

  // Find most active class
  const mostActiveClass =
    teacherStats.classes.length > 0
      ? teacherStats.classes.reduce((prev, current) => {
          const prevTotal =
            prev.grades +
            prev.presenceRecords +
            prev.assessments +
            prev.comments +
            prev.events;
          const currentTotal =
            current.grades +
            current.presenceRecords +
            current.assessments +
            current.comments +
            current.events;
          return prevTotal > currentTotal ? prev : current;
        })
      : null;

  // Find most recent activity day
  const mostRecentActivity =
    teacherStats.activity.length > 0
      ? teacherStats.activity.reduce((prev, current) => {
          return new Date(current.date) > new Date(prev.date) ? current : prev;
        })
      : null;

  return (
    <div className="space-y-6" dir="rtl">
      <h2 className="text-2xl font-bold mb-6">
        جزئیات فعالیت{" "}
        {teachers[teacherStats.teacherCode] || teacherStats.teacherCode}
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {totalPresenceRecords.toLocaleString()}
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
            <CardTitle className="text-green-800">کلاس فعال</CardTitle>
          </CardHeader>
          <CardContent>
            {mostActiveClass ? (
              <>
                <p className="text-xl font-bold text-green-700">
                  {mostActiveClass.className}
                </p>
                <p className="text-sm text-green-600 my-1">
                  درس: {mostActiveClass.courseName}
                </p>
                <p className="text-lg font-bold text-green-700 mt-2">
                  {(
                    mostActiveClass.grades +
                    mostActiveClass.presenceRecords +
                    mostActiveClass.assessments +
                    mostActiveClass.comments +
                    mostActiveClass.events
                  ).toLocaleString()}{" "}
                  فعالیت
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  <Badge className="bg-green-200 text-green-800">
                    {mostActiveClass.grades} نمره
                  </Badge>
                  <Badge className="bg-green-200 text-green-800">
                    {mostActiveClass.presenceRecords} حضور و غیاب
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
            <CardTitle className="text-amber-800">آخرین فعالیت</CardTitle>
          </CardHeader>
          <CardContent>
            {mostRecentActivity ? (
              <>
                <p className="text-xl font-bold text-amber-700">
                  {formatDate(mostRecentActivity.date)}
                </p>
                <p className="text-3xl font-bold text-amber-700 my-2">
                  {mostRecentActivity.total.toLocaleString()} فعالیت
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge className="bg-amber-200 text-amber-800">
                    {mostRecentActivity.grades} نمره
                  </Badge>
                  <Badge className="bg-amber-200 text-amber-800">
                    {mostRecentActivity.presenceRecords} حضور و غیاب
                  </Badge>
                  <Badge className="bg-amber-200 text-amber-800">
                    {mostRecentActivity.assessments} ارزیابی
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">اطلاعاتی موجود نیست</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Class Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>جزئیات فعالیت به تفکیک کلاس</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-2 text-right">نام کلاس</th>
                  <th className="p-2 text-center">درس</th>
                  <th className="p-2 text-center">تعداد دانش‌آموزان</th>
                  <th className="p-2 text-center">نمرات</th>
                  <th className="p-2 text-center">حضور و غیاب</th>
                  <th className="p-2 text-center">ارزیابی‌ها</th>
                  <th className="p-2 text-center">یادداشت‌ها</th>
                  <th className="p-2 text-center">رویدادها</th>
                  <th className="p-2 text-center">پوشش کلاس</th>
                </tr>
              </thead>
              <tbody>
                {teacherStats.classes.length > 0 ? (
                  teacherStats.classes.map((cls) => {
                    const totalClassActivities =
                      cls.grades +
                      cls.presenceRecords +
                      cls.assessments +
                      cls.comments +
                      cls.events;

                    return (
                      <tr
                        key={`${cls.classCode}_${cls.courseCode}`}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-2 font-medium">{cls.className}</td>
                        <td className="p-2 text-center">{cls.courseName}</td>
                        <td className="p-2 text-center">{cls.studentCount}</td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={cls.grades > 0 ? "default" : "outline"}
                            className={
                              cls.grades > 0
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                          >
                            {cls.grades.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={
                              cls.presenceRecords > 0 ? "default" : "outline"
                            }
                            className={
                              cls.presenceRecords > 0
                                ? "bg-blue-100 text-blue-800"
                                : ""
                            }
                          >
                            {cls.presenceRecords.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={
                              cls.assessments > 0 ? "default" : "outline"
                            }
                            className={
                              cls.assessments > 0
                                ? "bg-purple-100 text-purple-800"
                                : ""
                            }
                          >
                            {cls.assessments.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={cls.comments > 0 ? "default" : "outline"}
                            className={
                              cls.comments > 0
                                ? "bg-indigo-100 text-indigo-800"
                                : ""
                            }
                          >
                            {cls.comments.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={cls.events > 0 ? "default" : "outline"}
                            className={
                              cls.events > 0 ? "bg-pink-100 text-pink-800" : ""
                            }
                          >
                            {cls.events.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant="outline"
                            className={
                              totalClassActivities > 0 ? "bg-gray-100" : ""
                            }
                          >
                            {cls.classCoverage.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-gray-500">
                      هیچ اطلاعاتی در بازه زمانی انتخاب شده یافت نشد
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="p-2">مجموع</td>
                  <td className="p-2 text-center">
                    {teacherStats.classes.length} کلاس
                  </td>
                  <td className="p-2 text-center">
                    {teacherStats.classes.reduce(
                      (sum, cls) => sum + cls.studentCount,
                      0
                    )}{" "}
                    دانش‌آموز
                  </td>
                  <td className="p-2 text-center">
                    {totalGrades.toLocaleString()}
                  </td>
                  <td className="p-2 text-center">
                    {totalPresenceRecords.toLocaleString()}
                  </td>
                  <td className="p-2 text-center">
                    {totalAssessments.toLocaleString()}
                  </td>
                  <td className="p-2 text-center">
                    {totalComments.toLocaleString()}
                  </td>
                  <td className="p-2 text-center">
                    {totalEvents.toLocaleString()}
                  </td>
                  <td className="p-2 text-center">
                    {avgClassCoverage.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Daily Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>فعالیت روزانه</CardTitle>
        </CardHeader>
        <CardContent>
          {teacherStats.activity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-2 text-right">تاریخ</th>
                    <th className="p-2 text-center">کل فعالیت‌ها</th>
                    <th className="p-2 text-center">نمرات</th>
                    <th className="p-2 text-center">حضور و غیاب</th>
                    <th className="p-2 text-center">ارزیابی‌ها</th>
                    <th className="p-2 text-center">یادداشت‌ها</th>
                    <th className="p-2 text-center">رویدادها</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherStats.activity
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((day) => (
                      <tr
                        key={day.date}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-2 font-medium">
                          {formatDate(day.date)}
                        </td>
                        <td className="p-2 text-center font-bold">
                          {day.total.toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={day.grades > 0 ? "default" : "outline"}
                            className={
                              day.grades > 0
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                          >
                            {day.grades.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={
                              day.presenceRecords > 0 ? "default" : "outline"
                            }
                            className={
                              day.presenceRecords > 0
                                ? "bg-blue-100 text-blue-800"
                                : ""
                            }
                          >
                            {day.presenceRecords.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={
                              day.assessments > 0 ? "default" : "outline"
                            }
                            className={
                              day.assessments > 0
                                ? "bg-purple-100 text-purple-800"
                                : ""
                            }
                          >
                            {day.assessments.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={day.comments > 0 ? "default" : "outline"}
                            className={
                              day.comments > 0
                                ? "bg-indigo-100 text-indigo-800"
                                : ""
                            }
                          >
                            {day.comments.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={day.events > 0 ? "default" : "outline"}
                            className={
                              day.events > 0 ? "bg-pink-100 text-pink-800" : ""
                            }
                          >
                            {day.events.toLocaleString()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              هیچ فعالیتی در بازه زمانی انتخاب شده یافت نشد
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDetailedActivity;
