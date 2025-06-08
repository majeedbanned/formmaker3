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
import {
  Printer,
  Download,
  AlertTriangle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
} from "lucide-react";

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
} {
  const statusMap = {
    excellent: {
      label: "عالی",
      color: "text-green-800",
      bgColor: "bg-green-100",
    },
    good: { label: "خوب", color: "text-blue-800", bgColor: "bg-blue-100" },
    average: {
      label: "متوسط",
      color: "text-yellow-800",
      bgColor: "bg-yellow-100",
    },
    poor: { label: "ضعیف", color: "text-orange-800", bgColor: "bg-orange-100" },
    failing: { label: "مردود", color: "text-red-800", bgColor: "bg-red-100" },
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
} {
  const diff = score - average;
  if (diff > 3)
    return {
      icon: <TrendingUp className="h-4 w-4" />,
      text: "عملکرد فوق‌العاده",
      color: "text-green-600",
    };
  if (diff > 0)
    return {
      icon: <Activity className="h-4 w-4" />,
      text: "عملکرد مطلوب",
      color: "text-blue-600",
    };
  if (diff > -3)
    return {
      icon: <BarChart3 className="h-4 w-4" />,
      text: "عملکرد معمولی",
      color: "text-yellow-600",
    };
  return {
    icon: <TrendingDown className="h-4 w-4" />,
    text: "نیاز به تلاش بیشتر",
    color: "text-red-600",
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
    window.print();
  };

  const handleDownload = () => {
    window.print();
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
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
            margin: 0 !important;
          }

          .grade-card {
            border: 2px solid #333 !important;
            padding: 6px !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: white !important;
            font-size: 8px !important;
          }

          .grade-card-header {
            text-align: center;
            margin-bottom: 4px !important;
            padding-bottom: 3px !important;
            border-bottom: 1px solid #ddd !important;
          }

          .student-name {
            font-size: 11px !important;
            font-weight: bold;
            margin: 0 0 2px 0 !important;
          }

          .student-code {
            font-size: 8px !important;
            margin: 0 !important;
            color: #666 !important;
          }

          .main-score {
            font-size: 18px !important;
            font-weight: bold;
            text-align: center;
            margin: 3px 0 !important;
            padding: 4px !important;
            border: 2px solid #333 !important;
            background: #f8f9fa !important;
          }

          .score-subtitle {
            font-size: 7px !important;
            color: #666 !important;
          }

          .stats-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 2px !important;
            margin: 4px 0 !important;
          }

          .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2px !important;
            border: 1px solid #eee !important;
            font-size: 7px !important;
          }

          .stat-label {
            font-weight: bold;
          }

          .stat-value {
            font-weight: bold;
            color: #333 !important;
          }

          .grade-badges {
            display: flex;
            justify-content: space-between;
            margin: 3px 0 !important;
          }

          .grade-badge {
            font-size: 7px !important;
            padding: 1px 4px !important;
            border: 1px solid #333 !important;
            text-align: center;
            font-weight: bold;
            border-radius: 0 !important;
          }

          .performance-section {
            text-align: center;
            padding-top: 3px !important;
            border-top: 1px solid #ddd !important;
            font-size: 7px !important;
          }

          .performance-text {
            font-weight: bold;
            margin: 2px 0 !important;
          }

          .rank-badge {
            font-size: 7px !important;
            padding: 1px 3px !important;
            background: #ffd700 !important;
            border: 1px solid #333 !important;
            margin: 2px 0 !important;
            display: inline-block;
          }

          .card-footer {
            font-size: 6px !important;
            color: #666 !important;
            text-align: center;
            margin-top: 2px !important;
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
            <h1 className="text-2xl font-bold">کارنامه‌های کلاس</h1>
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
              چاپ کارنامه‌ها
            </Button>
          </div>
        </div>

        {/* Page Header */}
        <Card className="mb-6 no-print">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{schoolName}</CardTitle>
            <CardDescription className="text-lg">
              کارنامه‌های {gradeList.title} - کلاس {gradeList.className}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">درس</p>
                <p className="font-bold">{gradeList.courseName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">معلم</p>
                <p className="font-bold">{teacherName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  تعداد دانش‌آموزان
                </p>
                <p className="font-bold">
                  {toPersianDigits(gradeList.statistics.total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">میانگین کلاس</p>
                <p className="font-bold">
                  {toPersianDigits(gradeList.statistics.average.toFixed(1))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade Cards Grid */}
        <div className="grade-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => {
            const statusInfo = getStatusInfo(student.status);
            const performance = getPerformanceLevel(
              student.score,
              gradeList.statistics.average
            );

            return (
              <Card key={student.studentCode} className="grade-card border-2">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="grade-card-header">
                    <h3 className="student-name">{student.studentName}</h3>
                    <p className="student-code">
                      کد: {toPersianDigits(student.studentCode)}
                    </p>
                  </div>

                  {/* Main Score */}
                  <div className="main-score">
                    <div>{toPersianDigits(student.score)}</div>
                    <div className="score-subtitle">از ۲۰</div>
                  </div>

                  {/* Grade Letter and Status */}
                  <div className="grade-badges">
                    <div className="grade-badge">
                      حرفی: {getGradeLetter(student.score)}
                    </div>
                    <div
                      className={`grade-badge ${statusInfo.bgColor} ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">رتبه:</span>
                      <span className="stat-value">
                        {toPersianDigits(student.rank)}
                      </span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-label">درصد:</span>
                      <span className="stat-value">
                        {toPersianDigits(student.percentile.toFixed(0))}%
                      </span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-label">از میانگین:</span>
                      <span
                        className={`stat-value ${
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
                      </span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-label">میانگین:</span>
                      <span className="stat-value">
                        {toPersianDigits(
                          gradeList.statistics.average.toFixed(1)
                        )}
                      </span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-label">بالاترین:</span>
                      <span className="stat-value">
                        {toPersianDigits(gradeList.statistics.highest)}
                      </span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-label">پایین‌ترین:</span>
                      <span className="stat-value">
                        {toPersianDigits(gradeList.statistics.lowest)}
                      </span>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="performance-section">
                    <div className={`performance-text ${performance.color}`}>
                      {performance.text}
                    </div>

                    {student.rank <= 3 && (
                      <div className="rank-badge">
                        {student.rank === 1
                          ? "رتبه اول"
                          : student.rank === 2
                          ? "رتبه دوم"
                          : "رتبه سوم"}{" "}
                        کلاس
                      </div>
                    )}

                    <div className="card-footer">
                      {gradeList.gradeDate
                        ? toPersianDigits(
                            new Date(gradeList.gradeDate).toLocaleDateString(
                              "fa-IR"
                            )
                          )
                        : toPersianDigits(
                            new Date().toLocaleDateString("fa-IR")
                          )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground no-print">
          <p>
            کارنامه‌ها در تاریخ{" "}
            {toPersianDigits(new Date().toLocaleDateString("fa-IR"))} تولید
            شده‌اند
          </p>
        </div>
      </div>
    </div>
  );
}
