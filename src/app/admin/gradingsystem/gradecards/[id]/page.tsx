"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  BookOpen,
  Users,
  Calendar,
  Eye,
  EyeOff,
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
  score: number;
  rank: number;
  differenceFromAverage: number;
  percentile: number;
  status: "excellent" | "good" | "average" | "poor" | "failing";
}

interface GradeCardsData {
  gradeList: {
    _id: string;
    title: string;
    gradeDate: string;
    classCode: string;
    className: string;
    courseCode: string;
    courseName: string;
    teacherCode: string;
    statistics: {
      average: number;
      passing: number;
      failing: number;
      highest: number;
      lowest: number;
      total: number;
      standardDeviation?: number;
      median?: number;
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

// Helper function to get grade letter
function getGradeLetter(score: number): string {
  if (score >= 18) return "A";
  if (score >= 15) return "B";
  if (score >= 12) return "C";
  if (score >= 10) return "D";
  return "F";
}

// Helper function to get status info
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

// Helper function to get performance level
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

// Calculate additional statistics
function calculateAdvancedStats(
  students: StudentGrade[],
  gradeList: GradeCardsData["gradeList"]
) {
  const scores = students.map((s) => s.score);
  const sortedScores = [...scores].sort((a, b) => a - b);

  const median =
    sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] +
          sortedScores[sortedScores.length / 2]) /
        2
      : sortedScores[Math.floor(sortedScores.length / 2)];

  const mean = gradeList.statistics.average;
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

  const { gradeList, students, teacherName, schoolName } = gradeCardsData;
  const advancedStats = calculateAdvancedStats(students, gradeList);

  // Prepare chart data
  const distributionData = Object.entries(advancedStats.gradeDistribution).map(
    ([range, count]) => ({
      range,
      count,
      percentage: ((count / students.length) * 100).toFixed(1),
    })
  );

  const performanceData = students
    .map((student) => ({
      name: student.studentName.split(" ")[0], // First name only for chart
      score: student.score,
      rank: student.rank,
      percentile: student.percentile,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10 for visibility

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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                کارنامه‌های دانش‌آموزان
              </h1>
              <p className="text-muted-foreground">
                {gradeList.className} - {gradeList.courseName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">میانگین کلاس</p>
                  <p className="text-2xl font-bold">
                    {toPersianDigits(gradeList.statistics.average.toFixed(1))}
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
                    {toPersianDigits(gradeList.statistics.passing)}
                  </p>
                  <p className="text-green-200 text-xs">
                    {toPersianDigits(
                      (
                        (gradeList.statistics.passing /
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

        {/* Charts Section */}
        {showCharts && (
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
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="percentile"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* School Header Info */}
        <Card className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">{schoolName}</CardTitle>
            <CardDescription className="text-indigo-100 text-lg">
              کارنامه‌های {gradeList.title} - کلاس {gradeList.className}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-indigo-200" />
                <p className="text-indigo-100 text-sm">درس</p>
                <p className="font-bold text-lg">{gradeList.courseName}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <Users className="h-6 w-6 mx-auto mb-2 text-indigo-200" />
                <p className="text-indigo-100 text-sm">معلم</p>
                <p className="font-bold text-lg">{teacherName}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <Users className="h-6 w-6 mx-auto mb-2 text-indigo-200" />
                <p className="text-indigo-100 text-sm">تعداد دانش‌آموزان</p>
                <p className="font-bold text-lg">
                  {toPersianDigits(gradeList.statistics.total)}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-indigo-200" />
                <p className="text-indigo-100 text-sm">تاریخ آزمون</p>
                <p className="font-bold text-lg">
                  {gradeList.gradeDate
                    ? toPersianDigits(
                        new Date(gradeList.gradeDate).toLocaleDateString(
                          "fa-IR"
                        )
                      )
                    : toPersianDigits(new Date().toLocaleDateString("fa-IR"))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Grade Cards */}
        <div className="grade-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => {
            const statusInfo = getStatusInfo(student.status);
            const performance = getPerformanceLevel(
              student.score,
              gradeList.statistics.average
            );

            return (
              <Card
                key={student.studentCode}
                className={`grade-card border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer ${
                  selectedStudent === student.studentCode
                    ? "ring-4 ring-blue-500 border-blue-500"
                    : "hover:border-blue-300"
                }`}
                onClick={() =>
                  setSelectedStudent(
                    selectedStudent === student.studentCode
                      ? null
                      : student.studentCode
                  )
                }
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="text-center mb-4 pb-4 border-b-2 border-gray-100">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {student.rank <= 3 && (
                        <Award
                          className={`h-5 w-5 ${
                            student.rank === 1
                              ? "text-yellow-500"
                              : student.rank === 2
                              ? "text-gray-400"
                              : "text-orange-500"
                          }`}
                        />
                      )}
                      <h3 className="student-name text-xl font-bold text-gray-800">
                        {student.studentName}
                      </h3>
                    </div>
                    <p className="student-code text-sm text-gray-500">
                      کد دانش‌آموزی: {toPersianDigits(student.studentCode)}
                    </p>
                  </div>

                  {/* Main Score with Visual Enhancement */}
                  <div className="main-score relative mb-6">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border-2 border-blue-200">
                      <div className="text-4xl font-bold text-blue-800 mb-2">
                        {toPersianDigits(student.score)}
                      </div>
                      <div className="text-sm text-blue-600 mb-3">از ۲۰</div>
                      <Progress
                        value={(student.score / 20) * 100}
                        className="h-3 mb-2"
                      />
                      <div className="text-xs text-gray-600">
                        {toPersianDigits(
                          ((student.score / 20) * 100).toFixed(0)
                        )}
                        % از حداکثر نمره
                      </div>
                    </div>

                    {/* Floating rank badge */}
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold shadow-lg">
                      {toPersianDigits(student.rank)}
                    </div>
                  </div>

                  {/* Status and Grade Letter */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge
                      className={`${statusInfo.bgColor} ${statusInfo.color} px-3 py-1 text-sm font-medium`}
                    >
                      {statusInfo.label}
                    </Badge>
                    <div className="bg-gray-100 px-3 py-1 rounded-lg">
                      <span className="text-sm font-bold">
                        نمره حرفی: {getGradeLetter(student.score)}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Statistics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg text-center">
                      <p className="text-xs text-green-700 font-medium">
                        درصدک
                      </p>
                      <p className="text-lg font-bold text-green-800">
                        {toPersianDigits(student.percentile.toFixed(0))}%
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg text-center">
                      <p className="text-xs text-purple-700 font-medium">
                        اختلاف از میانگین
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          student.differenceFromAverage > 0
                            ? "text-green-600"
                            : student.differenceFromAverage < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {student.differenceFromAverage > 0 ? "+" : ""}
                        {toPersianDigits(
                          student.differenceFromAverage.toFixed(1)
                        )}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg text-center">
                      <p className="text-xs text-blue-700 font-medium">
                        میانگین کلاس
                      </p>
                      <p className="text-lg font-bold text-blue-800">
                        {toPersianDigits(
                          gradeList.statistics.average.toFixed(1)
                        )}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg text-center">
                      <p className="text-xs text-orange-700 font-medium">
                        بالاترین نمره
                      </p>
                      <p className="text-lg font-bold text-orange-800">
                        {toPersianDigits(gradeList.statistics.highest)}
                      </p>
                    </div>
                  </div>

                  {/* Performance Analysis */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg text-center mb-4">
                    <div
                      className={`flex items-center justify-center gap-2 mb-2 ${performance.color}`}
                    >
                      {performance.icon}
                      <span className="font-bold">{performance.text}</span>
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
                      سطح عملکرد: {toPersianDigits(performance.level)} از ۵
                    </p>
                  </div>

                  {/* Rank Achievement */}
                  {student.rank <= 3 && (
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
                            {toPersianDigits(student.rank)} از{" "}
                            {toPersianDigits(gradeList.statistics.total)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">وضعیت نسبت به میانه:</p>
                          <p
                            className={`font-bold ${
                              student.score > advancedStats.median
                                ? "text-green-600"
                                : "text-orange-600"
                            }`}
                          >
                            {student.score > advancedStats.median
                              ? "بالاتر از میانه"
                              : "پایین‌تر از میانه"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">فاصله از Q1:</p>
                          <p className="font-bold">
                            {toPersianDigits(
                              (
                                student.score - advancedStats.quartiles.q1
                              ).toFixed(1)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">فاصله از Q3:</p>
                          <p className="font-bold">
                            {toPersianDigits(
                              (
                                student.score - advancedStats.quartiles.q3
                              ).toFixed(1)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">تعداد کل</p>
                <p className="text-2xl font-bold text-gray-800">
                  {toPersianDigits(gradeList.statistics.total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-600">قبول شدگان</p>
                <p className="text-2xl font-bold text-green-700">
                  {toPersianDigits(gradeList.statistics.passing)}
                </p>
              </div>
              <div>
                <p className="text-sm text-red-600">مردودین</p>
                <p className="text-2xl font-bold text-red-700">
                  {toPersianDigits(gradeList.statistics.failing)}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600">نرخ موفقیت</p>
                <p className="text-2xl font-bold text-blue-700">
                  {toPersianDigits(
                    (
                      (gradeList.statistics.passing /
                        gradeList.statistics.total) *
                      100
                    ).toFixed(0)
                  )}
                  %
                </p>
              </div>
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
