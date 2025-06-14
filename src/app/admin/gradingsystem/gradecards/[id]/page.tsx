"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Download,
  AlertTriangle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Star,
  Target,
  Award,
  Users,
  Eye,
  EyeOff,
  Hash,
  MessageSquare,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";

interface StudentGrade {
  studentCode: string;
  studentName: string;
  score?: number;
  descriptiveText?: string;
  rank?: number;
  differenceFromAverage?: number;
  percentile?: number;
  status?: "excellent" | "good" | "average" | "poor" | "failing";
}

interface GradeCardsData {
  gradeList: {
    _id: string;
    title: string;
    gradeDate: string;
    gradingType: "numerical" | "descriptive";
    classCode: string;
    className: string;
    courseCode: string;
    courseName: string;
    teacherCode: string;
    statistics: {
      average?: number;
      passing?: number;
      failing?: number;
      highest?: number;
      lowest?: number;
      total: number;
      standardDeviation?: number;
      median?: number;
      type?: string;
    };
  };
  students: StudentGrade[];
  teacherName: string;
  schoolName: string;
}

// Helper function: Convert numbers to Persian digits
function toPersianDigits(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num)
    .split("")
    .map((digit) => persianDigits[parseInt(digit, 10)] || digit)
    .join("");
}

// Helper function to get grade letter (only for numerical grades)
function getGradeLetter(score: number): string {
  if (score >= 18) return "A";
  if (score >= 15) return "B";
  if (score >= 12) return "C";
  if (score >= 10) return "D";
  return "F";
}

// Helper function to get status info (only for numerical grades)
function getStatusInfo(status: string): {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
} {
  const statusMap = {
    excellent: {
      label: "عالی",
      color: "text-green-800",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    good: {
      label: "خوب",
      color: "text-blue-800",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    average: {
      label: "متوسط",
      color: "text-yellow-800",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
    },
    poor: {
      label: "ضعیف",
      color: "text-orange-800",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
    },
    failing: {
      label: "مردود",
      color: "text-red-800",
      bgColor: "bg-red-100",
      textColor: "text-red-600",
    },
  };
  return statusMap[status as keyof typeof statusMap] || statusMap.average;
}

// Helper function to get performance level (only for numerical grades)
function getPerformanceLevel(
  score: number,
  average: number
): {
  icon: React.ReactNode;
  text: string;
  color: string;
  level: number;
} {
  const diff = score - average;
  if (diff > 3)
    return {
      icon: <TrendingUp className="h-4 w-4" />,
      text: "عملکرد فوق‌العاده",
      color: "text-green-600",
      level: 5,
    };
  if (diff > 1)
    return {
      icon: <Activity className="h-4 w-4" />,
      text: "عملکرد مطلوب",
      color: "text-blue-600",
      level: 4,
    };
  if (diff > -1)
    return {
      icon: <BarChart3 className="h-4 w-4" />,
      text: "عملکرد معمولی",
      color: "text-yellow-600",
      level: 3,
    };
  if (diff > -3)
    return {
      icon: <TrendingDown className="h-4 w-4" />,
      text: "نیاز به تحریک",
      color: "text-orange-600",
      level: 2,
    };
  return {
    icon: <TrendingDown className="h-4 w-4" />,
    text: "نیاز به تلاش بیشتر",
    color: "text-red-600",
    level: 1,
  };
}

// Calculate additional statistics (only for numerical grades)
function calculateAdvancedStats(
  students: StudentGrade[],
  gradeList: GradeCardsData["gradeList"]
) {
  if (gradeList.gradingType === "descriptive") {
    return {
      median: 0,
      standardDeviation: 0,
      gradeDistribution: {},
      quartiles: { q1: 0, q2: 0, q3: 0 },
    };
  }

  const scores = students
    .filter((s) => s.score !== undefined)
    .map((s) => s.score!);

  if (scores.length === 0) {
    return {
      median: 0,
      standardDeviation: 0,
      gradeDistribution: {},
      quartiles: { q1: 0, q2: 0, q3: 0 },
    };
  }

  const sortedScores = [...scores].sort((a, b) => a - b);

  const median =
    sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] +
          sortedScores[sortedScores.length / 2]) /
        2
      : sortedScores[Math.floor(sortedScores.length / 2)];

  const mean = gradeList.statistics.average || 0;
  const variance =
    scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) /
    scores.length;
  const standardDeviation = Math.sqrt(variance);

  const gradeDistribution = {
    "18-20": scores.filter((s) => s >= 18).length,
    "15-17": scores.filter((s) => s >= 15 && s < 18).length,
    "12-14": scores.filter((s) => s >= 12 && s < 15).length,
    "10-11": scores.filter((s) => s >= 10 && s < 12).length,
    "0-9": scores.filter((s) => s < 10).length,
  };

  return {
    median,
    standardDeviation,
    gradeDistribution,
    quartiles: {
      q1: sortedScores[Math.floor(sortedScores.length * 0.25)],
      q2: median,
      q3: sortedScores[Math.floor(sortedScores.length * 0.75)],
    },
  };
}

export default function GradeCardsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gradeListId = params.id as string;
  const schoolCode = searchParams.get("schoolCode");

  const [gradeCardsData, setGradeCardsData] = useState<GradeCardsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCharts, setShowCharts] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (gradeListId && schoolCode) {
      fetchGradeCardsData();
    }
  }, [gradeListId, schoolCode]);

  const fetchGradeCardsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/gradingsystem/grade-report/${gradeListId}?schoolCode=${schoolCode}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch grade cards data");
      }

      const data = await response.json();
      setGradeCardsData(data);
    } catch (error) {
      console.error("Error fetching grade cards:", error);
      setError("خطا در دریافت کارنامه‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setShowCharts(false);
    setTimeout(() => {
      window.print();
      setShowCharts(true);
    }, 500);
  };

  const handleDownload = () => {
    handlePrint();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>در حال بارگذاری کارنامه‌ها...</p>
        </div>
      </div>
    );
  }

  if (error || !gradeCardsData) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error || "کارنامه‌ها یافت نشد"}</p>
            <Button onClick={() => window.close()} className="mt-4">
              بستن
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { gradeList, students } = gradeCardsData;
  const advancedStats = calculateAdvancedStats(students, gradeList);
  const isNumerical = gradeList.gradingType === "numerical";

  // Prepare chart data (only for numerical grades)
  const distributionData = isNumerical
    ? Object.entries(advancedStats.gradeDistribution).map(([range, count]) => ({
        range,
        count,
        percentage: ((count / students.length) * 100).toFixed(1),
      }))
    : [];

  const performanceData = isNumerical
    ? students
        .filter((s) => s.score !== undefined)
        .map((student) => ({
          name: student.studentName.split(" ")[0], // First name only for chart
          score: student.score!,
          rank: student.rank || 0,
          percentile: student.percentile || 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10) // Top 10 for visibility
    : [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            font-family: "Tahoma", Arial, sans-serif;
            font-size: 9px !important;
            direction: rtl;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.2 !important;
          }
          .no-print {
            display: none !important;
          }
          .container {
            max-width: none !important;
            padding: 6px !important;
            margin: 0 !important;
          }
          .grade-cards-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .grade-card {
            border: 2px solid #333 !important;
            padding: 8px !important;
            page-break-inside: avoid !important;
            background: white !important;
            font-size: 8px !important;
          }
          .student-name {
            font-size: 12px !important;
            font-weight: bold;
            margin: 0 0 3px 0 !important;
          }
          .main-score {
            font-size: 20px !important;
            font-weight: bold;
            text-align: center;
            margin: 5px 0 !important;
            padding: 8px !important;
            border: 2px solid #333 !important;
            background: #f8f9fa !important;
          }
        }
      `}</style>

      <div className="container mx-auto p-6" dir="rtl">
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              بازگشت
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                {isNumerical ? (
                  <Hash className="h-8 w-8 text-blue-600" />
                ) : (
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                )}
                {isNumerical
                  ? "کارنامه‌های نمرات"
                  : "کارنامه‌های ارزیابی توصیفی"}
              </h1>
              <p className="text-muted-foreground">
                {gradeList.className} - {gradeList.courseName}
              </p>
              <Badge variant="outline" className="mt-1">
                {isNumerical ? "نمره‌دهی عددی" : "ارزیابی توصیفی"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isNumerical && (
              <Button
                variant="outline"
                onClick={() => setShowCharts(!showCharts)}
                className="gap-2"
              >
                {showCharts ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showCharts ? "مخفی کردن نمودارها" : "نمایش نمودارها"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              دانلود PDF
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              چاپ کارنامه‌ها
            </Button>
          </div>
        </div>

        {/* Statistics Overview - Only for numerical grades */}
        {isNumerical && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">میانگین کلاس</p>
                    <p className="text-2xl font-bold">
                      {toPersianDigits(
                        (gradeList.statistics.average || 0).toFixed(1)
                      )}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">قبولی</p>
                    <p className="text-2xl font-bold">
                      {toPersianDigits(gradeList.statistics.passing || 0)}
                    </p>
                    <p className="text-green-200 text-xs">
                      {toPersianDigits(
                        (
                          ((gradeList.statistics.passing || 0) /
                            gradeList.statistics.total) *
                          100
                        ).toFixed(0)
                      )}
                      %
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">میانه نمرات</p>
                    <p className="text-2xl font-bold">
                      {toPersianDigits(advancedStats.median.toFixed(1))}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">انحراف استاندارد</p>
                    <p className="text-2xl font-bold">
                      {toPersianDigits(
                        advancedStats.standardDeviation.toFixed(1)
                      )}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Simple Statistics for Descriptive Grades */}
        {!isNumerical && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 no-print">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">تعداد ارزیابی‌ها</p>
                    <p className="text-2xl font-bold">
                      {toPersianDigits(gradeList.statistics.total)}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">نوع ارزیابی</p>
                    <p className="text-xl font-bold">توصیفی</p>
                    <p className="text-purple-200 text-xs">متن توضیحی</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Section - Only for numerical grades */}
        {isNumerical && showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 no-print">
            {/* Grade Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  توزیع نمرات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        toPersianDigits(value as number),
                        name === "count" ? "تعداد" : "درصد",
                      ]}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  وضعیت عملکرد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, percentage }) =>
                        `${range}: ${toPersianDigits(percentage)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => toPersianDigits(value as number)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Students Performance */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  عملکرد برترین دانش‌آموزان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        toPersianDigits(value as number),
                        name === "score"
                          ? "نمره"
                          : name === "rank"
                          ? "رتبه"
                          : "درصدک",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Grade Cards Grid */}
        <div className="grade-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => {
            if (isNumerical && student.score === undefined) return null;
            if (
              !isNumerical &&
              (!student.descriptiveText ||
                student.descriptiveText.trim() === "")
            )
              return null;

            const performance =
              isNumerical && student.score !== undefined
                ? getPerformanceLevel(
                    student.score,
                    gradeList.statistics.average || 0
                  )
                : null;

            const statusInfo =
              isNumerical && student.status
                ? getStatusInfo(student.status)
                : null;

            return (
              <Card
                key={student.studentCode}
                className="grade-card relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() =>
                  setSelectedStudent(
                    selectedStudent === student.studentCode
                      ? null
                      : student.studentCode
                  )
                }
              >
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="student-name font-bold text-lg">
                        {student.studentName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        کد دانش‌آموزی: {toPersianDigits(student.studentCode)}
                      </p>
                    </div>
                    {isNumerical && statusInfo && (
                      <Badge
                        className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}
                      >
                        {statusInfo.label}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Main Score/Text Display */}
                  {isNumerical ? (
                    <div className="main-score text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-sm text-blue-700 font-medium">
                          نمره کسب شده
                        </span>
                      </div>
                      <p className="text-4xl font-bold text-blue-900 mb-1">
                        {toPersianDigits(student.score!)}
                      </p>
                      <p className="text-sm text-blue-600">
                        از ۲۰ ({getGradeLetter(student.score!)})
                      </p>
                    </div>
                  ) : (
                    <div className="main-score text-right p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                        <span className="text-sm text-purple-700 font-medium">
                          ارزیابی توصیفی
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-purple-900 bg-white p-3 rounded border">
                        {student.descriptiveText}
                      </p>
                    </div>
                  )}

                  {/* Additional Statistics for Numerical Grades */}
                  {isNumerical && student.score !== undefined && (
                    <>
                      {/* Comparative Statistics */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg text-center">
                          <p className="text-xs text-green-700 font-medium">
                            رتبه کلاس
                          </p>
                          <p className="text-lg font-bold text-green-800">
                            {toPersianDigits(student.rank || 0)}
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg text-center">
                          <p className="text-xs text-red-700 font-medium">
                            اختلاف با میانگین
                          </p>
                          <p
                            className={`text-lg font-bold ${
                              (student.differenceFromAverage || 0) > 0
                                ? "text-green-600"
                                : (student.differenceFromAverage || 0) < 0
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {(student.differenceFromAverage || 0) > 0
                              ? "+"
                              : ""}
                            {toPersianDigits(
                              (student.differenceFromAverage || 0).toFixed(1)
                            )}
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg text-center">
                          <p className="text-xs text-blue-700 font-medium">
                            میانگین کلاس
                          </p>
                          <p className="text-lg font-bold text-blue-800">
                            {toPersianDigits(
                              (gradeList.statistics.average || 0).toFixed(1)
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Performance Analysis */}
                      {performance && (
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg text-center mb-4">
                          <div
                            className={`flex items-center justify-center gap-2 mb-2 ${performance.color}`}
                          >
                            {performance.icon}
                            <span className="font-bold">
                              {performance.text}
                            </span>
                          </div>

                          {/* Performance Level Visualization */}
                          <div className="flex justify-center gap-1 mb-2">
                            {Array.from({ length: 5 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full ${
                                  i < performance.level
                                    ? "bg-blue-500"
                                    : "bg-gray-300"
                                }`}
                              />
                            ))}
                          </div>

                          <p className="text-xs text-gray-600">
                            سطح عملکرد: {toPersianDigits(performance.level)} از
                            ۵
                          </p>
                        </div>
                      )}

                      {/* Rank Achievement */}
                      {(student.rank || 999) <= 3 && (
                        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-3 rounded-lg text-center border-2 border-yellow-300">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Award className="h-5 w-5 text-yellow-600" />
                            <span className="font-bold text-yellow-800">
                              {student.rank === 1
                                ? "🥇 رتبه اول"
                                : student.rank === 2
                                ? "🥈 رتبه دوم"
                                : "🥉 رتبه سوم"}{" "}
                              کلاس
                            </span>
                          </div>
                          <p className="text-xs text-yellow-700">
                            تبریک! عملکرد بسیار عالی
                          </p>
                        </div>
                      )}

                      {/* Expandable Details */}
                      {selectedStudent === student.studentCode && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200 no-print">
                          <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            تحلیل تفصیلی
                          </h4>

                          {/* Individual Performance Chart */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">موقعیت در کلاس:</p>
                              <p className="font-bold">
                                {toPersianDigits(student.rank || 0)} از{" "}
                                {toPersianDigits(gradeList.statistics.total)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">
                                وضعیت نسبت به میانه:
                              </p>
                              <p
                                className={`font-bold ${
                                  student.score! > advancedStats.median
                                    ? "text-green-600"
                                    : "text-orange-600"
                                }`}
                              >
                                {student.score! > advancedStats.median
                                  ? "بالاتر از میانه"
                                  : "پایین‌تر از میانه"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">فاصله از Q1:</p>
                              <p className="font-bold">
                                {toPersianDigits(
                                  (
                                    student.score! - advancedStats.quartiles.q1
                                  ).toFixed(1)
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">فاصله از Q3:</p>
                              <p className="font-bold">
                                {toPersianDigits(
                                  (
                                    student.score! - advancedStats.quartiles.q3
                                  ).toFixed(1)
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Footer */}
                  <div className="text-center text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200">
                    صادر شده در تاریخ:{" "}
                    {toPersianDigits(new Date().toLocaleDateString("fa-IR"))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Footer */}
        <Card className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-6 text-center">
            <div
              className={`grid gap-4 mb-4 ${
                isNumerical
                  ? "grid-cols-2 md:grid-cols-4"
                  : "grid-cols-1 md:grid-cols-2"
              }`}
            >
              <div>
                <p className="text-sm text-gray-600">
                  {isNumerical ? "تعداد کل نمرات" : "تعداد کل ارزیابی‌ها"}
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {toPersianDigits(gradeList.statistics.total)}
                </p>
              </div>
              {isNumerical && (
                <>
                  <div>
                    <p className="text-sm text-green-600">قبول شدگان</p>
                    <p className="text-2xl font-bold text-green-700">
                      {toPersianDigits(gradeList.statistics.passing || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-red-600">مردودین</p>
                    <p className="text-2xl font-bold text-red-700">
                      {toPersianDigits(gradeList.statistics.failing || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">نرخ موفقیت</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {toPersianDigits(
                        (
                          ((gradeList.statistics.passing || 0) /
                            gradeList.statistics.total) *
                          100
                        ).toFixed(0)
                      )}
                      %
                    </p>
                  </div>
                </>
              )}
              {!isNumerical && (
                <div>
                  <p className="text-sm text-purple-600">نوع ارزیابی</p>
                  <p className="text-xl font-bold text-purple-700">توصیفی</p>
                  <p className="text-xs text-purple-500">متن توضیحی</p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              کارنامه‌ها در تاریخ{" "}
              {toPersianDigits(new Date().toLocaleDateString("fa-IR"))} تولید
              شده‌اند
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
