"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarDays, GraduationCap, Star, TrendingUp } from "lucide-react";

// Types from the reportcards component
interface AssessmentEntry {
  title: string;
  value: string;
  date: string;
  weight?: number;
}

interface WeightedGradeInfo {
  courseName: string;
  grade: number;
  vahed: number;
  weightedValue: number;
}

interface StudentReportCard {
  studentCode: string;
  studentName: string;
  courses: Record<
    string,
    {
      courseName: string;
      teacherName: string;
      vahed: number;
      monthlyGrades: Record<string, number | null>;
      monthlyAssessments: Record<string, AssessmentEntry[]>;
      monthlyPresence: Record<
        string,
        {
          present: number;
          absent: number;
          late: number;
          total: number;
        }
      >;
      yearAverage: number | null;
    }
  >;
  weightedAverage?: number | null;
  weightedGradesInfo?: WeightedGradeInfo[];
}

// Helper function: Convert numbers to Persian digits (same as reportcards)
function toPersianDigits(num: number | string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num)
    .split("")
    .map((digit) => persianDigits[parseInt(digit, 10)] || digit)
    .join("");
}

// Function to get color class based on grade (same as reportcards)
const getScoreColorClass = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return "text-gray-400";
  if (score >= 18) return "text-emerald-600 font-bold";
  if (score >= 15) return "text-green-600";
  if (score >= 12) return "text-blue-600";
  if (score >= 10) return "text-amber-500";
  return "text-red-500";
};

// Assessment value styling (same as reportcards)
const getAssessmentValueClass = (value: string): string => {
  switch (value) {
    case "عالی":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "خوب":
      return "bg-green-100 text-green-700 border-green-200";
    case "متوسط":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "ضعیف":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "بسیار ضعیف":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

// Persian month names
const PERSIAN_MONTHS = [
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

interface ReportCardTabProps {
  studentId: string;
}

export default function ReportCardTab({ studentId }: ReportCardTabProps) {
  const [reportCard, setReportCard] = useState<StudentReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [yearOptions, setYearOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const fetchReportCard = async () => {
      if (!studentId) return;

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          studentId: studentId,
          ...(selectedYear && { year: selectedYear }),
        });

        const response = await fetch(`/api/students/reportcard?${params}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "خطا در دریافت کارنامه");
        }

        const data = await response.json();
        setReportCard(data.reportCard);
        setYearOptions(data.yearOptions);
        if (!selectedYear && data.currentYear) {
          setSelectedYear(data.currentYear);
        }
      } catch (err) {
        console.error("Error fetching report card:", err);
        setError(err instanceof Error ? err.message : "خطا در دریافت کارنامه");
      } finally {
        setLoading(false);
      }
    };

    fetchReportCard();
  }, [studentId, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری کارنامه...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                تلاش مجدد
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reportCard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-gray-600">
              <p>کارنامه‌ای یافت نشد</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const courses = Object.values(reportCard.courses);

  return (
    <div className="space-y-6">
      {/* Header with Year Selection */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">کارنامه تحصیلی</h2>
        </div>
        {yearOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <Label htmlFor="year-select">سال تحصیلی:</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-select" className="w-48">
                <SelectValue placeholder="انتخاب سال تحصیلی" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Overall Statistics */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Star className="h-5 w-5" />
            آمار کلی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {toPersianDigits(courses.length)}
              </div>
              <div className="text-sm text-gray-600">تعداد دروس</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {reportCard.weightedAverage
                  ? toPersianDigits(reportCard.weightedAverage.toFixed(2))
                  : "---"}
              </div>
              <div className="text-sm text-gray-600">میانگین کل</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">
                {toPersianDigits(
                  courses.reduce((sum, course) => sum + course.vahed, 0)
                )}
              </div>
              <div className="text-sm text-gray-600">مجموع واحد</div>
            </div>
          </div>

          {reportCard.weightedGradesInfo &&
            reportCard.weightedGradesInfo.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  جزئیات محاسبه میانگین
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  {reportCard.weightedGradesInfo.map((info, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{info.courseName}:</span>
                      <span>
                        {toPersianDigits(info.grade.toFixed(2))} ×{" "}
                        {toPersianDigits(info.vahed)} ={" "}
                        {toPersianDigits(info.weightedValue.toFixed(2))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Report Card Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            کارنامه ماهانه
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-center min-w-[120px]">
                    نام درس
                  </TableHead>
                  <TableHead className="font-bold text-center min-w-[100px]">
                    معلم
                  </TableHead>
                  <TableHead className="font-bold text-center w-16">
                    واحد
                  </TableHead>
                  {[7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6].map((month) => (
                    <TableHead
                      key={month}
                      className="font-bold text-center min-w-[80px]"
                    >
                      <div className="flex flex-col">
                        <span>{PERSIAN_MONTHS[month - 1]}</span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="font-bold text-center min-w-[80px]">
                    میانگین
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-center border-r">
                      {course.courseName}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      {course.teacherName}
                    </TableCell>
                    <TableCell className="text-center font-bold text-purple-600">
                      {toPersianDigits(course.vahed)}
                    </TableCell>
                    {[7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6].map((month) => {
                      const monthKey = month.toString();
                      const grade = course.monthlyGrades[monthKey];
                      const assessments =
                        course.monthlyAssessments[monthKey] || [];

                      return (
                        <TableCell key={month} className="text-center p-2">
                          <div className="space-y-1">
                            {grade !== null ? (
                              <div
                                className={`font-semibold ${getScoreColorClass(
                                  grade
                                )}`}
                              >
                                {toPersianDigits(grade.toFixed(1))}
                              </div>
                            ) : (
                              <div className="text-gray-400">---</div>
                            )}

                            {assessments.length > 0 && (
                              <div className="space-y-1">
                                {assessments.map((assessment, i) => (
                                  <div
                                    key={i}
                                    className={`text-xs px-1 py-0.5 rounded border ${getAssessmentValueClass(
                                      assessment.value
                                    )}`}
                                  >
                                    {assessment.value}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-bold border-l">
                      {course.yearAverage !== null ? (
                        <div
                          className={`${getScoreColorClass(
                            course.yearAverage
                          )} text-lg`}
                        >
                          {toPersianDigits(course.yearAverage.toFixed(2))}
                        </div>
                      ) : (
                        <div className="text-gray-400">---</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                {course.courseName}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">معلم:</span>
                  <span className="font-medium">{course.teacherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">واحد:</span>
                  <span className="font-medium">
                    {toPersianDigits(course.vahed)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">میانگین:</span>
                  <span
                    className={`font-bold ${getScoreColorClass(
                      course.yearAverage
                    )}`}
                  >
                    {course.yearAverage !== null
                      ? toPersianDigits(course.yearAverage.toFixed(2))
                      : "---"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">نمرات ثبت شده:</span>
                  <span className="font-medium">
                    {toPersianDigits(
                      Object.values(course.monthlyGrades).filter(
                        (g) => g !== null
                      ).length
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
