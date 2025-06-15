"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Download,
  Eye,
  FileText,
  BookOpen,
  Trophy,
} from "lucide-react";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";

interface GradeData {
  score?: number;
  descriptiveText?: string;
  studentName: string;
}

interface SelectedGrading {
  _id: string;
  title: string;
  date?: string;
  gradingType: "numerical" | "descriptive";
  grades: { [studentCode: string]: GradeData };
  statistics?: {
    average?: number;
    highest?: number;
    lowest?: number;
    total: number;
  };
  classData?: {
    data?: {
      className?: string;
    };
  };
  subjectData?: {
    courseName?: string;
  };
}

interface UserInfo {
  schoolName?: string;
  schoolCode?: string;
}

interface ReportData {
  selectedGradings: SelectedGrading[];
  reportTitle: string;
  includeStatistics: boolean;
  includeClassRanking: boolean;
  includeTeacherComments: boolean;
  showGradeBreakdown: boolean;
  reportFormat: "detailed" | "summary" | "minimal";
  headerLogo: boolean;
  schoolInfo: boolean;
  customFooter: string;
}

interface ReportPreviewStepProps {
  reportData: ReportData;
  userInfo: UserInfo;
}

interface StudentReport {
  studentCode: string;
  studentName: string;
  className?: string;
  grades: {
    gradingId: string;
    title: string;
    subject: string;
    gradingType: "numerical" | "descriptive";
    score?: number;
    descriptiveText?: string;
    rank?: number;
    totalStudents?: number;
  }[];
  overallAverage?: number;
}

export function ReportPreviewStep({
  reportData,
  userInfo,
}: ReportPreviewStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { selectedGradings } = reportData;

  if (!selectedGradings || selectedGradings.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">نمره‌دهی انتخاب نشده است</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // Here you would implement PDF generation
      // For now, we'll just simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("قابلیت دانلود PDF به زودی اضافه خواهد شد");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Combine all students from all selected gradings
  const getStudentReports = (): StudentReport[] => {
    const studentMap = new Map<string, StudentReport>();

    selectedGradings.forEach((grading) => {
      const gradingStudents = Object.entries(grading.grades || {});

      // Calculate ranks for numerical grades
      let rankedStudents: [string, GradeData][] = [];
      if (grading.gradingType === "numerical") {
        rankedStudents = gradingStudents
          .filter(([_, gradeData]) => gradeData.score !== undefined)
          .sort(([_, a], [__, b]) => (b.score || 0) - (a.score || 0));
      }

      gradingStudents.forEach(([studentCode, gradeData]) => {
        if (!studentMap.has(studentCode)) {
          studentMap.set(studentCode, {
            studentCode,
            studentName: gradeData.studentName,
            className: grading.classData?.data?.className,
            grades: [],
          });
        }

        const student = studentMap.get(studentCode)!;
        const rank =
          grading.gradingType === "numerical"
            ? rankedStudents.findIndex(([code]) => code === studentCode) + 1
            : undefined;

        student.grades.push({
          gradingId: grading._id,
          title: grading.title,
          subject: grading.subjectData?.courseName || "نامشخص",
          gradingType: grading.gradingType,
          score: gradeData.score,
          descriptiveText: gradeData.descriptiveText,
          rank: rank || undefined,
          totalStudents: rankedStudents.length || undefined,
        });
      });
    });

    // Calculate overall average for each student (only for numerical grades)
    studentMap.forEach((student) => {
      const numericalGrades = student.grades.filter(
        (g) => g.gradingType === "numerical" && g.score !== undefined
      );
      if (numericalGrades.length > 0) {
        const sum = numericalGrades.reduce(
          (acc, grade) => acc + (grade.score || 0),
          0
        );
        student.overallAverage = sum / numericalGrades.length;
      }
    });

    return Array.from(studentMap.values()).sort((a, b) =>
      a.studentName.localeCompare(b.studentName, "fa")
    );
  };

  const studentReports = getStudentReports();

  const renderStudentCard = (student: StudentReport, index: number) => (
    <Card
      key={student.studentCode}
      className="mb-4 print:shadow-none print:border"
    >
      <CardContent className="p-6">
        {/* Header */}
        {reportData.headerLogo && (
          <div className="text-center mb-6 print:mb-4">
            <div className="h-16 w-16 bg-muted rounded-full mx-auto mb-2 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        )}

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">{reportData.reportTitle}</h1>
          {reportData.schoolInfo && (
            <div className="text-sm text-muted-foreground">
              <p>مدرسه: {userInfo.schoolName || "نام مدرسه"}</p>
              <p>کد مدرسه: {userInfo.schoolCode}</p>
            </div>
          )}
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold mb-3 text-lg">اطلاعات دانش‌آموز</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">نام:</span> {student.studentName}
              </p>
              <p>
                <span className="font-medium">کد دانش‌آموزی:</span>{" "}
                {student.studentCode}
              </p>
              <p>
                <span className="font-medium">کلاس:</span> {student.className}
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-lg">خلاصه عملکرد</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">تعداد دروس:</span>{" "}
                {student.grades.length}
              </p>
              {student.overallAverage && (
                <p>
                  <span className="font-medium">میانگین کلی:</span>{" "}
                  {student.overallAverage.toFixed(1)}
                </p>
              )}
              <p>
                <span className="font-medium">تاریخ تولید:</span>{" "}
                {format(new Date(), "yyyy/MM/dd", { locale: faIR })}
              </p>
            </div>
          </div>
        </div>

        {/* Grades Display */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-lg">نتایج ارزیابی‌ها</h3>
          <div className="grid gap-4">
            {student.grades.map((grade) => (
              <div key={grade.gradingId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{grade.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {grade.subject}
                    </p>
                  </div>
                  <Badge
                    variant={
                      grade.gradingType === "descriptive"
                        ? "secondary"
                        : "default"
                    }
                  >
                    {grade.gradingType === "descriptive" ? "توصیفی" : "نمره‌ای"}
                  </Badge>
                </div>

                {grade.gradingType === "numerical" ? (
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary">
                      {grade.score || "—"}
                    </div>
                    {reportData.includeClassRanking && grade.rank && (
                      <div className="text-sm text-muted-foreground">
                        <Trophy className="h-4 w-4 inline ml-1" />
                        رتبه {grade.rank} از {grade.totalStudents}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm">
                    {grade.descriptiveText || "ارزیابی توصیفی ثبت نشده است"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Overall Statistics */}
        {reportData.includeStatistics &&
          selectedGradings.some((g) => g.gradingType === "numerical") && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-lg">آمار کلی</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedGradings
                  .filter((g) => g.gradingType === "numerical" && g.statistics)
                  .map((grading) => (
                    <div
                      key={grading._id}
                      className="text-center p-3 bg-muted rounded"
                    >
                      <div className="text-sm font-medium mb-1">
                        {grading.subjectData?.courseName}
                      </div>
                      <div className="text-lg font-semibold">
                        {grading.statistics?.average?.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        میانگین کلاس
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Teacher Comments */}
        {reportData.includeTeacherComments && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-lg">
              نظرات و توصیه‌های اساتید
            </h3>
            <div className="p-4 border-2 border-dashed border-muted rounded-lg min-h-24">
              <p className="text-sm text-muted-foreground text-center">
                فضای مخصوص نظرات اساتید
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        {reportData.customFooter && (
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            {reportData.customFooter}
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground mt-6">
          تاریخ تولید کارنامه:{" "}
          {format(new Date(), "yyyy/MM/dd - HH:mm", { locale: faIR })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-6 print:hidden">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          چاپ کارنامه‌ها
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isGenerating ? "در حال تولید..." : "دانلود PDF"}
        </Button>
      </div>

      {/* Preview Notice */}
      <div className="text-center p-4 bg-blue-50 rounded-lg mb-6 print:hidden">
        <p className="text-sm text-blue-700">
          <Eye className="h-4 w-4 inline ml-1" />
          پیش‌نمایش کارنامه‌ها - برای چاپ یا دانلود از دکمه‌های بالا استفاده
          کنید
        </p>
      </div>

      {/* Summary Stats */}
      <Card className="mb-6 print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">خلاصه آمار</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {studentReports.length}
              </div>
              <div className="text-sm text-muted-foreground">تعداد کارنامه</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedGradings.length}
              </div>
              <div className="text-sm text-muted-foreground">
                نمره‌دهی انتخاب شده
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {
                  [
                    ...new Set(
                      selectedGradings.map((g) => g.subjectData?.courseName)
                    ),
                  ].length
                }
              </div>
              <div className="text-sm text-muted-foreground">درس</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {
                  selectedGradings.filter((g) => g.gradingType === "numerical")
                    .length
                }{" "}
                /{" "}
                {
                  selectedGradings.filter(
                    (g) => g.gradingType === "descriptive"
                  ).length
                }
              </div>
              <div className="text-xs text-muted-foreground">
                نمره‌ای / توصیفی
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Gradings Overview */}
      <Card className="mb-6 print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">نمره‌دهی‌های انتخاب شده</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {selectedGradings.map((grading) => (
              <div
                key={grading._id}
                className="flex items-center justify-between p-2 bg-muted rounded"
              >
                <div>
                  <span className="font-medium">{grading.title}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({grading.subjectData?.courseName})
                  </span>
                </div>
                <Badge
                  variant={
                    grading.gradingType === "descriptive"
                      ? "secondary"
                      : "default"
                  }
                >
                  {grading.gradingType === "descriptive" ? "توصیفی" : "نمره‌ای"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Cards Preview */}
      <div className="space-y-8">{studentReports.map(renderStudentCard)}</div>

      {studentReports.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">دانش‌آموزی یافت نشد</h3>
              <p className="text-sm text-muted-foreground">
                هیچ دانش‌آموزی در نمره‌دهی‌های انتخاب شده یافت نشد.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
