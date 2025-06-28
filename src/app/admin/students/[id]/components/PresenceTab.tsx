"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Student {
  _id: string;
  data: {
    studentName: string;
    studentFamily: string;
    studentCode: string;
    classCode: Array<{ label: string; value: string }>;
    schoolCode: string;
    phones: Array<{ owner: string; number: string }>;
    avatar?: {
      path: string;
      filename: string;
    };
    birthDate?: string;
    isActive: boolean;
    groups?: Array<{ label: string; value: string }>;
  };
}

interface ClassSheetRecord {
  _id: string;
  classCode: string;
  courseCode: string;
  date: string;
  schoolCode: string;
  studentCode: string;
  teacherCode: string;
  timeSlot: string;
  presenceStatus: "present" | "absent" | "late" | "excused";
  persianDate: string;
  persianMonth: string;
  note?: string;
  grades?: Array<{
    value: number;
    description: string;
    date: string;
    totalPoints: number;
  }>;
  assessments?: Array<{
    title: string;
    value: string;
    date: string;
    weight: number;
  }>;
  // Enriched data from API
  courseName?: string;
  className?: string;
}

interface PresenceStats {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

interface CourseAbsenceData {
  courseCode: string;
  courseName: string;
  totalSessions: number;
  absentCount: number;
  absentDates: Array<{
    date: string;
    persianDate: string;
    timeSlot: string;
    note?: string;
  }>;
  attendanceRate: number;
}

interface PresenceTabProps {
  studentId: string;
  student: Student;
}

export default function PresenceTab({ studentId }: PresenceTabProps) {
  const [presenceData, setPresenceData] = useState<ClassSheetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PresenceStats>({
    totalSessions: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    attendanceRate: 0,
  });
  const [courseAbsenceData, setCourseAbsenceData] = useState<
    CourseAbsenceData[]
  >([]);

  // Fetch presence data
  const fetchPresenceData = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        studentId: studentId,
      });

      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const response = await fetch(`/api/students/presence?${queryParams}`, {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPresenceData(data.records || []);
        calculateStats(data.records || []);
        calculateCourseAbsenceData(data.records || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در دریافت اطلاعات حضور و غیاب");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (records: ClassSheetRecord[]) => {
    const totalSessions = records.length;
    const presentCount = records.filter(
      (r) => r.presenceStatus === "present"
    ).length;
    const absentCount = records.filter(
      (r) => r.presenceStatus === "absent"
    ).length;
    const lateCount = records.filter((r) => r.presenceStatus === "late").length;
    const excusedCount = records.filter(
      (r) => r.presenceStatus === "excused"
    ).length;
    const attendanceRate =
      totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

    setStats({
      totalSessions,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate,
    });
  };

  // Calculate course absence data
  const calculateCourseAbsenceData = async (records: ClassSheetRecord[]) => {
    // Group records by course
    const courseGroups: Record<string, ClassSheetRecord[]> = {};
    records.forEach((record) => {
      if (!courseGroups[record.courseCode]) {
        courseGroups[record.courseCode] = [];
      }
      courseGroups[record.courseCode].push(record);
    });

    // Calculate absence data for each course
    const courseAbsenceDataArray: CourseAbsenceData[] = [];

    for (const [courseCode, courseRecords] of Object.entries(courseGroups)) {
      const totalSessions = courseRecords.length;
      const absentRecords = courseRecords.filter(
        (r) => r.presenceStatus === "absent"
      );
      const absentCount = absentRecords.length;
      const attendanceRate =
        totalSessions > 0
          ? ((totalSessions - absentCount) / totalSessions) * 100
          : 0;

      const absentDates = absentRecords.map((record) => ({
        date: record.date,
        persianDate: record.persianDate,
        timeSlot: record.timeSlot,
        note: record.note,
      }));

      // Try to get course name from the enriched data
      const courseName = courseRecords[0].courseName || courseCode;

      courseAbsenceDataArray.push({
        courseCode,
        courseName,
        totalSessions,
        absentCount,
        absentDates,
        attendanceRate,
      });
    }

    // Sort by highest absence count
    courseAbsenceDataArray.sort((a, b) => b.absentCount - a.absentCount);
    setCourseAbsenceData(courseAbsenceDataArray);
  };

  // Get presence status color and text
  const getPresenceStatusInfo = (status: string) => {
    switch (status) {
      case "present":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          text: "حاضر",
          icon: CheckCircle,
        };
      case "absent":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          text: "غایب",
          icon: XCircle,
        };
      case "late":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          text: "تأخیر",
          icon: Clock,
        };
      case "excused":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          text: "مرخصی",
          icon: AlertCircle,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          text: "نامشخص",
          icon: AlertCircle,
        };
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchPresenceData();
  }, [studentId]);

  if (loading && presenceData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 mb-2">خطا در بارگذاری اطلاعات</p>
          <p className="text-sm text-gray-500">{error}</p>
          <Button className="mt-4" onClick={() => fetchPresenceData()}>
            تلاش مجدد
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">کل جلسات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalSessions}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">حضور</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.presentCount}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">غیبت</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.absentCount}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">درصد حضور</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.attendanceRate.toFixed(0)}%
                </p>
              </div>
              {stats.attendanceRate >= 75 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Rate Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">درصد حضور کلی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>درصد حضور</span>
              <span>{stats.attendanceRate.toFixed(1)}%</span>
            </div>
            <Progress value={stats.attendanceRate} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>ضعیف (0-50%)</span>
              <span>متوسط (50-75%)</span>
              <span>خوب (75-90%)</span>
              <span>عالی (90-100%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Absence Summary */}
      {courseAbsenceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <XCircle className="h-5 w-5 ml-2 text-red-600" />
              خلاصه غیبت به تفکیک درس
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courseAbsenceData.map((course) => (
                <div
                  key={course.courseCode}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {course.courseName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        کد درس: {course.courseCode}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-red-600">
                        {course.absentCount}
                      </p>
                      <p className="text-xs text-gray-500">
                        از {course.totalSessions} جلسه
                      </p>
                    </div>
                  </div>

                  {/* Course Attendance Rate */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>درصد حضور در این درس</span>
                      <span>{course.attendanceRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={course.attendanceRate} className="h-2" />
                  </div>

                  {/* Absent Dates */}
                  {course.absentDates.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        تاریخ‌های غیبت:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {course.absentDates.map((absence, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md"
                          >
                            <CalendarIcon className="h-3 w-3 ml-1" />
                            <span>{absence.persianDate}</span>
                            <span className="mr-1 text-red-500">
                              (جلسه {absence.timeSlot})
                            </span>
                            {absence.note && (
                              <span
                                className="mr-1 text-orange-600"
                                title={absence.note}
                              >
                                📝
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Summary Note */}
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  دروس بر اساس بیشترین تعداد غیبت مرتب شده‌اند
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Presence Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>سوابق حضور و غیاب</span>
            <span className="text-sm font-normal text-gray-500">
              ({presenceData.length} رکورد)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {presenceData.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                سابقه‌ای یافت نشد
              </h3>
              <p className="text-gray-600">
                برای این دانش‌آموز در بازه زمانی انتخابی، سابقه حضور و غیابی ثبت
                نشده است
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {presenceData.map((record) => {
                const statusInfo = getPresenceStatusInfo(record.presenceStatus);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={record._id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-2">
                          <Badge
                            className={statusInfo.color + " flex items-center"}
                          >
                            <StatusIcon className="h-3 w-3 ml-1" />
                            {statusInfo.text}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900">
                            {record.persianDate}
                          </span>
                          <span className="text-xs text-gray-500">
                            جلسه {record.timeSlot}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <p>کلاس: {record.classCode}</p>
                          <p>درس: {record.courseCode}</p>
                          {record.note && (
                            <p className="text-orange-600">
                              یادداشت: {record.note}
                            </p>
                          )}
                        </div>

                        {/* Grades if available */}
                        {record.grades && record.grades.length > 0 && (
                          <div className="mt-2 p-2 bg-blue-50 rounded">
                            <p className="text-xs font-medium text-blue-800 mb-1">
                              نمرات:
                            </p>
                            {record.grades.map((grade, index) => (
                              <p key={index} className="text-xs text-blue-700">
                                {grade.description || "نمره"}: {grade.value}/
                                {grade.totalPoints}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Assessments if available */}
                        {record.assessments &&
                          record.assessments.length > 0 && (
                            <div className="mt-2 p-2 bg-purple-50 rounded">
                              <p className="text-xs font-medium text-purple-800 mb-1">
                                ارزیابی‌ها:
                              </p>
                              {record.assessments.map((assessment, index) => (
                                <p
                                  key={index}
                                  className="text-xs text-purple-700"
                                >
                                  {assessment.title}: {assessment.value}
                                  {assessment.weight &&
                                    ` (وزن: ${assessment.weight})`}
                                </p>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
