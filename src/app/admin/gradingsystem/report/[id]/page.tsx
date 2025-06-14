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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Printer,
  Download,
  Trophy,
  Users,
  Target,
  AlertTriangle,
  Calculator,
  ArrowLeft,
  Award,
  TrendingDown,
  Hash,
  MessageSquare,
} from "lucide-react";

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

interface GradeReportData {
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
    };
  };
  students: StudentGrade[];
  teacherName: string;
  schoolName: string;
}

interface GradeDistributionItem {
  name: string;
  count: number;
  color: string;
}

interface ScoreFrequencyItem {
  score: number;
  count: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const STATUS_COLORS = {
  excellent: "#10b981",
  good: "#3b82f6",
  average: "#f59e0b",
  poor: "#f97316",
  failing: "#ef4444",
};

const STATUS_LABELS = {
  excellent: "عالی",
  good: "خوب",
  average: "متوسط",
  poor: "ضعیف",
  failing: "مردود",
};

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

// Helper function to get performance trend icon (only for numerical grades)
function getPerformanceTrend(
  score: number,
  average: number
): { icon: string; color: string; text: string } {
  const diff = score - average;
  if (diff > 3)
    return { icon: "📈", color: "text-green-600", text: "عملکرد عالی" };
  if (diff > 0)
    return { icon: "📊", color: "text-blue-600", text: "بالاتر از میانگین" };
  if (diff > -3)
    return { icon: "📉", color: "text-yellow-600", text: "نزدیک میانگین" };
  return { icon: "⚠️", color: "text-red-600", text: "نیاز به توجه" };
}

export default function GradeReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gradeListId = params.id as string;
  const schoolCode = searchParams.get("schoolCode");

  const [reportData, setReportData] = useState<GradeReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (gradeListId && schoolCode) {
      fetchReportData();
    }
  }, [gradeListId, schoolCode]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/gradingsystem/grade-report/${gradeListId}?schoolCode=${schoolCode}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch grade report data");
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Error fetching grade report:", error);
      setError("خطا در دریافت گزارش نمرات");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // This will trigger the browser's print dialog with option to save as PDF
    window.print();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>در حال بارگذاری گزارش...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error || "گزارش یافت نشد"}</p>
            <Button onClick={() => window.close()} className="mt-4">
              بستن
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { gradeList, students } = reportData;
  const isNumerical = gradeList.gradingType === "numerical";

  // Calculate additional analytics (only for numerical grades)
  let topStudents: StudentGrade[] = [];
  let bottomStudents: StudentGrade[] = [];
  let gradeDistribution: GradeDistributionItem[] = [];
  let scoreFrequency: ScoreFrequencyItem[] = [];

  if (isNumerical) {
    const numericalStudents = students.filter((s) => s.score !== undefined);
    topStudents = numericalStudents.slice(0, 3);
    bottomStudents = numericalStudents.slice(-3).reverse();

    // Grade distribution for charts
    gradeDistribution = [
      {
        name: "عالی (18-20)",
        count: numericalStudents.filter((s) => s.score! >= 18).length,
        color: COLORS[0],
      },
      {
        name: "خوب (15-17)",
        count: numericalStudents.filter((s) => s.score! >= 15 && s.score! < 18)
          .length,
        color: COLORS[1],
      },
      {
        name: "متوسط (12-15)",
        count: numericalStudents.filter((s) => s.score! >= 12 && s.score! < 15)
          .length,
        color: COLORS[2],
      },
      {
        name: "ضعیف (10-12)",
        count: numericalStudents.filter((s) => s.score! >= 10 && s.score! < 12)
          .length,
        color: COLORS[3],
      },
      {
        name: "مردود (<10)",
        count: numericalStudents.filter((s) => s.score! < 10).length,
        color: COLORS[4],
      },
    ];

    // Score frequency for histogram
    scoreFrequency = Array.from({ length: 21 }, (_, i) => ({
      score: i,
      count: numericalStudents.filter((s) => Math.floor(s.score!) === i).length,
    }));
  }

  return (
    <div className="min-h-screen bg-background">
      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body {
            font-family: "Tahoma", Arial, sans-serif;
            font-size: 10px !important;
            direction: rtl;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.2 !important;
          }

          .no-print {
            display: none !important;
          }

          .print-break {
            page-break-after: always;
            break-after: page;
          }

          .print-avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .container {
            max-width: none !important;
            padding: 8px !important;
            margin: 0 !important;
          }

          /* Header optimization */
          .print-header {
            margin-bottom: 8px !important;
            text-align: center;
          }

          .print-header h1 {
            font-size: 16px !important;
            margin: 0 0 4px 0 !important;
            font-weight: bold;
          }

          .print-header p {
            font-size: 12px !important;
            margin: 0 0 6px 0 !important;
          }

          /* Info grid optimization */
          .print-info-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 10px !important;
            font-size: 9px !important;
          }

          .print-info-item {
            text-align: center;
            padding: 3px !important;
            border: 1px solid #ddd !important;
          }

          .print-info-item .label {
            font-weight: bold;
            display: block;
            margin-bottom: 2px;
          }

          /* Statistics optimization */
          .print-stats {
            display: grid !important;
            grid-template-columns: repeat(
              ${isNumerical ? "5" : "2"},
              1fr
            ) !important;
            gap: 4px !important;
            margin-bottom: 10px !important;
            font-size: 9px !important;
          }

          .print-stat-item {
            text-align: center;
            padding: 3px !important;
            border: 1px solid #ddd !important;
            background: #f8f9fa !important;
          }

          .print-stat-value {
            font-size: 11px !important;
            font-weight: bold;
            display: block;
          }

          /* Table optimization */
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 8px !important;
            margin-bottom: 10px !important;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #333 !important;
            padding: 2px 3px !important;
            text-align: center !important;
            vertical-align: middle !important;
          }

          .print-table th {
            background: #f0f0f0 !important;
            font-weight: bold;
            font-size: 9px !important;
          }

          .print-table .student-name {
            text-align: right !important;
            font-weight: bold;
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .print-table .rank {
            font-weight: bold;
            background: #f8f9fa !important;
          }

          .print-table .score {
            font-weight: bold;
          }

          .print-table .passing {
            background: #d4edda !important;
          }

          .print-table .failing {
            background: #f8d7da !important;
          }

          .print-table .descriptive-text {
            text-align: right !important;
            font-size: 7px !important;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /* Top performers section */
          .print-performers {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            margin-bottom: 10px !important;
          }

          .print-performer-section {
            border: 1px solid #ddd !important;
            padding: 6px !important;
          }

          .print-performer-section h3 {
            font-size: 10px !important;
            margin: 0 0 4px 0 !important;
            font-weight: bold;
            text-align: center;
          }

          .print-performer-list {
            font-size: 8px !important;
          }

          .print-performer-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            padding: 1px 2px;
          }

          /* Charts - simplified for print */
          .chart-container {
            display: none !important; /* Hide complex charts in print */
          }

          /* Simple grade distribution */
          .print-distribution {
            margin-bottom: 10px !important;
          }

          .print-distribution-grid {
            display: grid !important;
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 2px !important;
            font-size: 8px !important;
          }

          .print-distribution-item {
            text-align: center;
            padding: 3px 2px !important;
            border: 1px solid #ddd !important;
          }

          .print-distribution-count {
            font-weight: bold;
            display: block;
          }
        }
      `}</style>

      <div className="container mx-auto p-6" dir="rtl">
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.close()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              بازگشت
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {isNumerical ? (
                  <Hash className="h-6 w-6 text-blue-600" />
                ) : (
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                )}
                {isNumerical
                  ? "گزارش تفصیلی نمرات"
                  : "گزارش تفصیلی ارزیابی توصیفی"}
              </h1>
              <Badge variant="outline" className="mt-1">
                {isNumerical ? "نمره‌دهی عددی" : "ارزیابی توصیفی"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              چاپ گزارش
            </Button>
          </div>
        </div>

        {/* Report Header */}
        <Card className="mb-6 summary-card">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">
              {reportData.schoolName}
            </CardTitle>
            <CardDescription className="text-lg">
              {isNumerical
                ? "گزارش تفصیلی نمرات"
                : "گزارش تفصیلی ارزیابی توصیفی"}{" "}
              - {gradeList.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  کلاس
                </p>
                <p className="font-bold">{gradeList.className}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">درس</p>
                <p className="font-bold">{gradeList.courseName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  معلم
                </p>
                <p className="font-bold">{reportData.teacherName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  تاریخ
                </p>
                <p className="font-bold">
                  {gradeList.gradeDate
                    ? toPersianDigits(
                        new Date(gradeList.gradeDate).toLocaleDateString(
                          "fa-IR"
                        )
                      )
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print-optimized Header */}
        <div className="print-header hidden">
          <h1>{reportData.schoolName}</h1>
          <p>
            {isNumerical ? "گزارش نمرات" : "گزارش ارزیابی توصیفی"} -{" "}
            {gradeList.title}
          </p>
        </div>

        {/* Print-optimized Info Grid */}
        <div className="print-info-grid hidden">
          <div className="print-info-item">
            <span className="label">کلاس:</span>
            {gradeList.className}
          </div>
          <div className="print-info-item">
            <span className="label">درس:</span>
            {gradeList.courseName}
          </div>
          <div className="print-info-item">
            <span className="label">معلم:</span>
            {reportData.teacherName}
          </div>
          <div className="print-info-item">
            <span className="label">تاریخ:</span>
            {gradeList.gradeDate
              ? toPersianDigits(
                  new Date(gradeList.gradeDate).toLocaleDateString("fa-IR")
                )
              : "-"}
          </div>
        </div>

        {/* Quick Statistics */}
        {isNumerical ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="summary-card">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {toPersianDigits(gradeList.statistics.total)}
                </p>
                <p className="text-sm text-muted-foreground">
                  تعداد دانش‌آموزان
                </p>
              </CardContent>
            </Card>

            <Card className="summary-card">
              <CardContent className="p-4 text-center">
                <Calculator className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {toPersianDigits(
                    (gradeList.statistics.average || 0).toFixed(1)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">میانگین کلاس</p>
              </CardContent>
            </Card>

            <Card className="summary-card">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {toPersianDigits(gradeList.statistics.highest || 0)}
                </p>
                <p className="text-sm text-muted-foreground">بالاترین نمره</p>
              </CardContent>
            </Card>

            <Card className="summary-card">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {toPersianDigits(gradeList.statistics.passing || 0)}
                </p>
                <p className="text-sm text-muted-foreground">قبول</p>
              </CardContent>
            </Card>

            <Card className="summary-card">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {toPersianDigits(gradeList.statistics.failing || 0)}
                </p>
                <p className="text-sm text-muted-foreground">مردود</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="summary-card">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {toPersianDigits(gradeList.statistics.total)}
                </p>
                <p className="text-sm text-muted-foreground">
                  تعداد ارزیابی‌ها
                </p>
              </CardContent>
            </Card>

            <Card className="summary-card">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-xl font-bold">توصیفی</p>
                <p className="text-sm text-muted-foreground">نوع ارزیابی</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Print-optimized Statistics */}
        <div className="print-stats hidden">
          {isNumerical ? (
            <>
              <div className="print-stat-item">
                <span className="print-stat-value">
                  {toPersianDigits(gradeList.statistics.total)}
                </span>
                تعداد
              </div>
              <div className="print-stat-item">
                <span className="print-stat-value">
                  {toPersianDigits(
                    (gradeList.statistics.average || 0).toFixed(1)
                  )}
                </span>
                میانگین
              </div>
              <div className="print-stat-item">
                <span className="print-stat-value">
                  {toPersianDigits(gradeList.statistics.highest || 0)}
                </span>
                بالاترین
              </div>
              <div className="print-stat-item">
                <span className="print-stat-value">
                  {toPersianDigits(gradeList.statistics.passing || 0)}
                </span>
                قبول
              </div>
              <div className="print-stat-item">
                <span className="print-stat-value">
                  {toPersianDigits(gradeList.statistics.failing || 0)}
                </span>
                مردود
              </div>
            </>
          ) : (
            <>
              <div className="print-stat-item">
                <span className="print-stat-value">
                  {toPersianDigits(gradeList.statistics.total)}
                </span>
                تعداد ارزیابی‌ها
              </div>
              <div className="print-stat-item">
                <span className="print-stat-value">توصیفی</span>
                نوع ارزیابی
              </div>
            </>
          )}
        </div>

        {/* Top and Bottom Students - Only for numerical grades */}
        {isNumerical && topStudents.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="summary-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  برترین دانش‌آموزان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topStudents.map((student, index) => (
                    <div
                      key={student.studentCode}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                          {toPersianDigits(index + 1)}
                        </div>
                        <span className="font-medium">
                          {student.studentName}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {toPersianDigits(student.score!)}/۲۰
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="summary-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  نیازمند توجه بیشتر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bottomStudents.map((student) => (
                    <div
                      key={student.studentCode}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                      <span className="font-medium">{student.studentName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {toPersianDigits(student.score!)}/۲۰
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({(student.differenceFromAverage || 0) > 0 ? "+" : ""}
                          {toPersianDigits(
                            (student.differenceFromAverage || 0).toFixed(1)
                          )}{" "}
                          از میانگین)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Print-optimized Top Performers - Only for numerical grades */}
        {isNumerical && topStudents.length > 0 && (
          <div className="print-performers hidden">
            <div className="print-performer-section">
              <h3>برترین دانش‌آموزان</h3>
              <div className="print-performer-list">
                {topStudents.map((student, index) => (
                  <div
                    key={student.studentCode}
                    className="print-performer-item"
                  >
                    <span>
                      {toPersianDigits(index + 1)}. {student.studentName}
                    </span>
                    <span>{toPersianDigits(student.score!)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="print-performer-section">
              <h3>نیازمند توجه</h3>
              <div className="print-performer-list">
                {bottomStudents.map((student) => (
                  <div
                    key={student.studentCode}
                    className="print-performer-item"
                  >
                    <span>{student.studentName}</span>
                    <span>{toPersianDigits(student.score!)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {isNumerical
                ? "جدول تفصیلی نمرات"
                : "جدول تفصیلی ارزیابی‌های توصیفی"}
            </CardTitle>
            <CardDescription>
              {isNumerical
                ? "اطلاعات کامل نمرات و رتبه‌بندی دانش‌آموزان"
                : "اطلاعات کامل ارزیابی‌های توصیفی دانش‌آموزان"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isNumerical && (
                      <TableHead className="text-center">رتبه</TableHead>
                    )}
                    <TableHead>نام دانش‌آموز</TableHead>
                    <TableHead className="text-center">کد دانش‌آموزی</TableHead>
                    {isNumerical ? (
                      <>
                        <TableHead className="text-center">نمره</TableHead>
                        <TableHead className="text-center">نمره حرفی</TableHead>
                        <TableHead className="text-center">
                          تفاوت از میانگین
                        </TableHead>
                        <TableHead className="text-center">درصد رتبه</TableHead>
                        <TableHead className="text-center">وضعیت</TableHead>
                        <TableHead className="text-center">
                          تحلیل عملکرد
                        </TableHead>
                      </>
                    ) : (
                      <TableHead>ارزیابی توصیفی</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    if (isNumerical && student.score === undefined) return null;
                    if (
                      !isNumerical &&
                      (!student.descriptiveText ||
                        student.descriptiveText.trim() === "")
                    )
                      return null;

                    const trend =
                      isNumerical && student.score !== undefined
                        ? getPerformanceTrend(
                            student.score,
                            gradeList.statistics.average || 0
                          )
                        : null;

                    return (
                      <TableRow key={student.studentCode}>
                        {isNumerical && (
                          <TableCell className="text-center font-bold">
                            {toPersianDigits(student.rank || 0)}
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          {student.studentName}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {toPersianDigits(student.studentCode)}
                        </TableCell>
                        {isNumerical ? (
                          <>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  student.score! >= 10
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-base px-3 py-1"
                              >
                                {toPersianDigits(student.score!)}/۲۰
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className="font-bold text-lg"
                              >
                                {getGradeLetter(student.score!)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`font-medium ${
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
                                  (student.differenceFromAverage || 0).toFixed(
                                    1
                                  )
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {toPersianDigits(
                                (student.percentile || 0).toFixed(0)
                              )}
                              %
                            </TableCell>
                            <TableCell className="text-center">
                              {student.status && (
                                <Badge
                                  style={{
                                    backgroundColor:
                                      STATUS_COLORS[student.status],
                                  }}
                                  className="text-white"
                                >
                                  {STATUS_LABELS[student.status]}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {trend && (
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-lg">{trend.icon}</span>
                                  <span
                                    className={`text-xs font-medium ${trend.color}`}
                                  >
                                    {trend.text}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                          </>
                        ) : (
                          <TableCell className="max-w-md">
                            <div className="bg-purple-50 p-3 rounded border text-sm leading-relaxed">
                              {student.descriptiveText}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Print-optimized Table */}
        <table className="print-table hidden">
          <thead>
            <tr>
              {isNumerical && <th>رتبه</th>}
              <th>نام</th>
              <th>کد</th>
              {isNumerical ? (
                <>
                  <th>نمره</th>
                  <th>حرفی</th>
                  <th>±میانگین</th>
                  <th>وضعیت</th>
                </>
              ) : (
                <th>ارزیابی توصیفی</th>
              )}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              if (isNumerical && student.score === undefined) return null;
              if (
                !isNumerical &&
                (!student.descriptiveText ||
                  student.descriptiveText.trim() === "")
              )
                return null;

              return (
                <tr
                  key={student.studentCode}
                  className={
                    isNumerical && student.score! >= 10 ? "passing" : "failing"
                  }
                >
                  {isNumerical && (
                    <td className="rank">
                      {toPersianDigits(student.rank || 0)}
                    </td>
                  )}
                  <td className="student-name">{student.studentName}</td>
                  <td>{toPersianDigits(student.studentCode)}</td>
                  {isNumerical ? (
                    <>
                      <td className="score">
                        {toPersianDigits(student.score!)}
                      </td>
                      <td>{getGradeLetter(student.score!)}</td>
                      <td>
                        {(student.differenceFromAverage || 0) > 0 ? "+" : ""}
                        {toPersianDigits(
                          (student.differenceFromAverage || 0).toFixed(1)
                        )}
                      </td>
                      <td>
                        {student.status ? STATUS_LABELS[student.status] : ""}
                      </td>
                    </>
                  ) : (
                    <td className="descriptive-text">
                      {student.descriptiveText}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Print-optimized Grade Distribution - Only for numerical grades */}
        {isNumerical && (
          <div className="print-distribution hidden">
            <h3
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                marginBottom: "6px",
                textAlign: "center",
              }}
            >
              توزیع نمرات
            </h3>
            <div className="print-distribution-grid">
              {gradeDistribution.map((grade) => (
                <div key={grade.name} className="print-distribution-item">
                  <span className="print-distribution-count">
                    {toPersianDigits(grade.count)}
                  </span>
                  {grade.name.split(" ")[0]}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="print-break"></div>

        {/* Charts Section - Only for numerical grades */}
        {isNumerical && (
          <div className="space-y-6">
            {/* Grade Distribution Pie Chart */}
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>توزیع نمرات</CardTitle>
                <CardDescription>
                  نمایش درصد دانش‌آموزان در هر بازه نمره
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, count }) =>
                        `${name}: ${toPersianDigits(count)}`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score Frequency Bar Chart */}
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>پراکندگی نمرات</CardTitle>
                <CardDescription>تعداد دانش‌آموزان در هر نمره</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scoreFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="score" />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        `نمره: ${toPersianDigits(String(value))}`
                      }
                      formatter={(value) => [
                        `${toPersianDigits(String(value))} دانش‌آموز`,
                        "تعداد",
                      ]}
                    />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Analysis Line Chart */}
            <Card className="chart-container">
              <CardHeader>
                <CardTitle>تحلیل عملکرد</CardTitle>
                <CardDescription>نمایش نمرات به ترتیب رتبه</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={students.filter((s) => s.score !== undefined)}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rank" />
                    <YAxis domain={[0, 20]} />
                    <Tooltip
                      labelFormatter={(value) =>
                        `رتبه: ${toPersianDigits(String(value))}`
                      }
                      formatter={(value, name, props) => [
                        `${toPersianDigits(String(value))}/۲۰`,
                        props?.payload?.studentName || "",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground print-footer">
          <p>
            این گزارش در تاریخ{" "}
            {toPersianDigits(new Date().toLocaleDateString("fa-IR"))} تولید شده
            است
          </p>
          <p className="mt-1">{reportData.schoolName} - سیستم مدیریت نمرات</p>
        </div>
      </div>
    </div>
  );
}
