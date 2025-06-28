"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  TrendingUp,
  Star,
  Calendar,
  Award,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface GradeRecord {
  _id: string;
  courseCode: string;
  courseName: string;
  date: string;
  persianDate: string;
  timeSlot: string;
  presenceStatus: string;
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
}

interface GradeStatistics {
  totalRecords: number;
  totalGrades: number;
  totalAssessments: number;
  averageGrade: number;
}

interface CourseGradeSummary {
  courseCode: string;
  courseName: string;
  totalGrades: number;
  totalAssessments: number;
  averageGrade: number;
  records: GradeRecord[];
}

interface GradesTabProps {
  studentId: string;
}

export default function GradesTab({ studentId }: GradesTabProps) {
  const [gradesData, setGradesData] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<GradeStatistics>({
    totalRecords: 0,
    totalGrades: 0,
    totalAssessments: 0,
    averageGrade: 0,
  });
  const [coursesSummary, setCoursesSummary] = useState<CourseGradeSummary[]>(
    []
  );

  useEffect(() => {
    const fetchGradesData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/students/grades?studentId=${studentId}`,
          {
            headers: {
              "x-domain": window.location.host,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setGradesData(data.records || []);
          setStatistics(data.statistics || {});
          calculateCoursesSummary(data.records || []);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "خطا در دریافت اطلاعات نمرات");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "خطا در بارگذاری اطلاعات"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGradesData();
  }, [studentId]);

  const calculateCoursesSummary = (records: GradeRecord[]) => {
    const courseGroups: Record<string, GradeRecord[]> = {};

    records.forEach((record) => {
      if (!courseGroups[record.courseCode]) {
        courseGroups[record.courseCode] = [];
      }
      courseGroups[record.courseCode].push(record);
    });

    const summary: CourseGradeSummary[] = Object.entries(courseGroups).map(
      ([courseCode, courseRecords]) => {
        let totalPoints = 0;
        let totalMaxPoints = 0;
        let totalGrades = 0;
        let totalAssessments = 0;

        courseRecords.forEach((record) => {
          totalGrades += record.grades?.length || 0;
          totalAssessments += record.assessments?.length || 0;

          record.grades?.forEach((grade) => {
            totalPoints += grade.value;
            totalMaxPoints += grade.totalPoints;
          });
        });

        const averageGrade =
          totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 100 : 0;

        return {
          courseCode,
          courseName: courseRecords[0].courseName,
          totalGrades,
          totalAssessments,
          averageGrade,
          records: courseRecords,
        };
      }
    );

    summary.sort((a, b) => b.averageGrade - a.averageGrade);
    setCoursesSummary(summary);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600 bg-green-50";
    if (percentage >= 75) return "text-blue-600 bg-blue-50";
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getPresenceStatusInfo = (status: string) => {
    switch (status) {
      case "present":
        return {
          color: "bg-green-100 text-green-800",
          text: "حاضر",
          icon: CheckCircle,
        };
      case "absent":
        return {
          color: "bg-red-100 text-red-800",
          text: "غایب",
          icon: XCircle,
        };
      case "late":
        return {
          color: "bg-yellow-100 text-yellow-800",
          text: "تأخیر",
          icon: Clock,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          text: "نامشخص",
          icon: Clock,
        };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 mb-2">خطا در بارگذاری اطلاعات نمرات</p>
          <p className="text-sm text-gray-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">کل نمرات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalGrades}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ارزیابی‌ها</p>
                <p className="text-2xl font-bold text-purple-600">
                  {statistics.totalAssessments}
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">میانگین کل</p>
                <p
                  className={`text-2xl font-bold ${
                    getGradeColor(statistics.averageGrade).split(" ")[0]
                  }`}
                >
                  {statistics.averageGrade.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">تعداد دروس</p>
                <p className="text-2xl font-bold text-blue-600">
                  {coursesSummary.length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Summary */}
      {coursesSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 ml-2" />
              خلاصه نمرات به تفکیک درس
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {coursesSummary.map((course) => (
                <div
                  key={course.courseCode}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
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
                      <p
                        className={`text-2xl font-bold ${
                          getGradeColor(course.averageGrade).split(" ")[0]
                        }`}
                      >
                        {course.averageGrade.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {course.totalGrades} نمره، {course.totalAssessments}{" "}
                        ارزیابی
                      </p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>میانگین درس</span>
                      <span>{course.averageGrade.toFixed(1)}%</span>
                    </div>
                    <Progress value={course.averageGrade} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Records */}
      {gradesData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 ml-2" />
              جزئیات نمرات و ارزیابی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {gradesData.map((record) => {
                const statusInfo = getPresenceStatusInfo(record.presenceStatus);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={record._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-2">
                          <Badge
                            className={statusInfo.color + " flex items-center"}
                          >
                            <StatusIcon className="h-3 w-3 ml-1" />
                            {statusInfo.text}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {record.persianDate} - جلسه {record.timeSlot}
                          </span>
                        </div>

                        <div className="text-sm text-gray-700 mb-2">
                          <p className="font-medium">{record.courseName}</p>
                          <p>کد درس: {record.courseCode}</p>
                        </div>
                      </div>
                    </div>

                    {/* Grades Section */}
                    {record.grades && record.grades.length > 0 && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          نمرات:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {record.grades.map((grade, index) => {
                            const percentage =
                              (grade.value / grade.totalPoints) * 100;
                            return (
                              <div
                                key={index}
                                className={`p-2 rounded ${getGradeColor(
                                  percentage
                                )}`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium">
                                    {grade.description || "نمره"}
                                  </span>
                                  <span className="font-bold">
                                    {grade.value}/{grade.totalPoints}
                                  </span>
                                </div>
                                <div className="text-xs mt-1">
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Assessments Section */}
                    {record.assessments && record.assessments.length > 0 && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm font-medium text-purple-800 mb-2">
                          ارزیابی‌ها:
                        </p>
                        <div className="space-y-2">
                          {record.assessments.map((assessment, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="font-medium text-purple-700">
                                {assessment.title}
                              </span>
                              <div className="text-left">
                                <span className="text-purple-600 font-bold">
                                  {assessment.value}
                                </span>
                                {assessment.weight && (
                                  <span className="text-purple-500 mr-2 text-xs">
                                    (وزن: {assessment.weight})
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              نمره‌ای ثبت نشده است
            </h3>
            <p className="text-gray-600">
              برای این دانش‌آموز هنوز نمره یا ارزیابی‌ای ثبت نشده است
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
