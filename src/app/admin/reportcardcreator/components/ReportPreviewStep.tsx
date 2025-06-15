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
  Table,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import { TeacherStatistics } from "./TeacherStatistics";

// Persian date utility function - converts Gregorian to Persian (Shamsi) calendar
const formatPersianDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);

    // Persian month names
    const persianMonths = [
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

    // Get Gregorian date components
    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth() + 1;
    const gregorianDay = date.getDate();

    // Simple Gregorian to Persian conversion algorithm
    let persianYear = gregorianYear - 621;
    let persianMonth = gregorianMonth;
    const persianDay = gregorianDay;

    // Adjust for Persian calendar start (simplified approximation)
    if (gregorianMonth <= 3) {
      // January to March maps to Dey to Esfand of previous Persian year
      persianMonth = gregorianMonth + 9;
      persianYear--;
    } else {
      // April to December maps to Farvardin to Azar
      persianMonth = gregorianMonth - 3;
    }

    // Ensure month is within valid range
    if (persianMonth < 1) persianMonth = 1;
    if (persianMonth > 12) persianMonth = 12;

    return `${persianDay} ${persianMonths[persianMonth - 1]} ${persianYear}`;
  } catch {
    // Fallback to Gregorian format if conversion fails
    return format(new Date(dateString), "yyyy/MM/dd", { locale: faIR });
  }
};

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
    courseCode?: string;
    courseName?: string;
    Grade?: string;
    vahed?: number;
    major?: string;
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
  reportFormat: "detailed" | "summary" | "minimal" | "statistical";
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
    progressInfo?: {
      scoreDiff: number;
      rankDiff: number;
      hasProgress: boolean;
      previousScore: number;
      previousRank: number;
    };
  }[];
  overallAverage?: number;
  overallProgress?: {
    totalScoreChange: number;
    totalRankChange: number;
    progressCount: number;
    declineCount: number;
    noChangeCount: number;
    overallTrend: "improvement" | "decline" | "stable";
    progressPercentage: number;
  };
  descriptiveGrades?: {
    subjectName: string;
    gradingTitle: string;
    gradingDate: string;
    descriptiveText: string;
    courseCode: string;
    courseGrade: string;
    courseVahed: number;
  }[];
}

export function ReportPreviewStep({
  reportData,
  userInfo,
}: ReportPreviewStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Sort selected gradings by date to ensure chronological processing
  const selectedGradings = [...reportData.selectedGradings].sort((a, b) => {
    const dateA = new Date(a.date || "1900-01-01").getTime();
    const dateB = new Date(b.date || "1900-01-01").getTime();
    return dateA - dateB;
  });

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
          .filter(([, gradeData]) => gradeData.score !== undefined)
          .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0));
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
          progressInfo: undefined,
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

  // Statistical table rendering for numerical grades with descriptive grades section
  const renderStatisticalTable = () => {
    const numericalGradings = selectedGradings.filter(
      (g) => g.gradingType === "numerical"
    );

    const descriptiveGradings = selectedGradings.filter(
      (g) => g.gradingType === "descriptive"
    );

    if (numericalGradings.length === 0 && descriptiveGradings.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Table className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">هیچ نمره‌دهی انتخاب نشده است</h3>
              <p className="text-sm text-muted-foreground">
                لطفاً نمره‌دهی‌های مورد نظر را انتخاب کنید.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Show message if only descriptive grades are available
    if (numericalGradings.length === 0 && descriptiveGradings.length > 0) {
      // Process only descriptive grades
      const allStudentData = new Map<
        string,
        {
          studentName: string;
          className?: string;
          descriptiveGrades: {
            subjectName: string;
            gradingTitle: string;
            gradingDate: string;
            descriptiveText: string;
            courseCode: string;
            courseGrade: string;
            courseVahed: number;
          }[];
        }
      >();

      descriptiveGradings.forEach((grading) => {
        const gradingStudents = Object.entries(grading.grades || {}).filter(
          ([, gradeData]) => {
            // More robust check for descriptive text
            return (
              gradeData &&
              typeof gradeData === "object" &&
              "descriptiveText" in gradeData &&
              gradeData.descriptiveText &&
              gradeData.descriptiveText.toString().trim() !== ""
            );
          }
        );

        gradingStudents.forEach(([studentCode, gradeData]) => {
          if (!allStudentData.has(studentCode)) {
            allStudentData.set(studentCode, {
              studentName: gradeData.studentName,
              className: grading.classData?.data?.className,
              descriptiveGrades: [],
            });
          }

          const student = allStudentData.get(studentCode)!;
          student.descriptiveGrades.push({
            subjectName: grading.subjectData?.courseName || "نامشخص",
            gradingTitle: grading.title,
            gradingDate: grading.date || new Date().toISOString(),
            descriptiveText: gradeData.descriptiveText?.toString() || "",
            courseCode: grading.subjectData?.courseCode || "",
            courseGrade: grading.subjectData?.Grade || "",
            courseVahed: grading.subjectData?.vahed || 1,
          });
        });
      });

      const studentsArray = Array.from(allStudentData.entries()).map(
        ([code, data]) => ({
          studentCode: code,
          ...data,
        })
      );

      studentsArray.sort((a, b) =>
        a.studentName.localeCompare(b.studentName, "fa")
      );

      return (
        <div className="space-y-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center py-4">
                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-medium mb-2 text-blue-800">
                  ارزیابی‌های توصیفی
                </h3>
                <p className="text-sm text-blue-600">
                  فقط ارزیابی‌های توصیفی انتخاب شده است. جدول آماری برای نمرات
                  عددی قابل نمایش است.
                </p>
              </div>
            </CardContent>
          </Card>

          {studentsArray.map((student) => (
            <Card
              key={student.studentCode}
              className="print:shadow-none print:border"
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
                  <h1 className="text-2xl font-bold mb-2">
                    {reportData.reportTitle}
                  </h1>
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
                    <h3 className="font-semibold mb-3 text-lg">
                      اطلاعات دانش‌آموز
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">نام:</span>{" "}
                        {student.studentName}
                      </p>
                      <p>
                        <span className="font-medium">کد دانش‌آموزی:</span>{" "}
                        {student.studentCode}
                      </p>
                      <p>
                        <span className="font-medium">کلاس:</span>{" "}
                        {student.className}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">
                      خلاصه ارزیابی
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">تعداد ارزیابی‌ها:</span>{" "}
                        {student.descriptiveGrades.length}
                      </p>
                      <p>
                        <span className="font-medium">تاریخ تولید:</span>{" "}
                        {format(new Date(), "yyyy/MM/dd", { locale: faIR })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Descriptive Grades */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-lg flex items-center">
                    <FileText className="h-5 w-5 ml-2" />
                    ارزیابی‌های توصیفی
                  </h3>
                  <div className="grid gap-3">
                    {student.descriptiveGrades
                      .sort(
                        (a, b) =>
                          new Date(a.gradingDate).getTime() -
                          new Date(b.gradingDate).getTime()
                      )
                      .map((grade, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg bg-blue-50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {grade.courseCode && (
                                  <span className="text-blue-600 font-mono ml-1">
                                    [{grade.courseCode}]
                                  </span>
                                )}
                                {grade.subjectName}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {grade.gradingTitle}
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="text-sm text-gray-500">
                                {formatPersianDate(grade.gradingDate)}
                              </div>
                              {grade.courseVahed && (
                                <div className="text-xs text-gray-400">
                                  {grade.courseVahed} واحد
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-400">
                            <div className="text-sm font-medium text-gray-700 mb-1">
                              ارزیابی:
                            </div>
                            <div className="text-gray-800">
                              {grade.descriptiveText}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

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
          ))}
        </div>
      );
    }

    // Calculate overall statistics for numerical grades
    const allStudentData = new Map<
      string,
      {
        studentName: string;
        className?: string;
        subjects: {
          subjectName: string;
          gradingTitle: string;
          gradingDate: string;
          score: number;
          classAverage: number;
          rank: number;
          totalStudents: number;
          percentile: number;
          diffFromAvg: number;
          performance: string;
          courseCode: string;
          courseGrade: string;
          courseVahed: number;
          progressInfo?: {
            scoreDiff: number;
            rankDiff: number;
            hasProgress: boolean;
            previousScore: number;
            previousRank: number;
          };
        }[];
        descriptiveGrades: {
          subjectName: string;
          gradingTitle: string;
          gradingDate: string;
          descriptiveText: string;
          courseCode: string;
          courseGrade: string;
          courseVahed: number;
        }[];
        overallAverage: number;
        overallRank: number;
        overallDiffFromAvg: number;
        overallProgress?: {
          totalScoreChange: number;
          totalRankChange: number;
          progressCount: number;
          declineCount: number;
          noChangeCount: number;
          overallTrend: "improvement" | "decline" | "stable";
          progressPercentage: number;
        };
      }
    >();

    numericalGradings.forEach((grading) => {
      const gradingStudents = Object.entries(grading.grades || {}).filter(
        ([, gradeData]) => gradeData.score !== undefined
      );

      const rankedStudents = gradingStudents.sort(
        ([, a], [, b]) => (b.score || 0) - (a.score || 0)
      );

      const classAverage = grading.statistics?.average || 0;

      gradingStudents.forEach(([studentCode, gradeData]) => {
        if (!allStudentData.has(studentCode)) {
          allStudentData.set(studentCode, {
            studentName: gradeData.studentName,
            className: grading.classData?.data?.className,
            subjects: [],
            descriptiveGrades: [],
            overallAverage: 0,
            overallRank: 0,
            overallDiffFromAvg: 0,
          });
        }

        const student = allStudentData.get(studentCode)!;
        const rank =
          rankedStudents.findIndex(([code]) => code === studentCode) + 1;
        const percentile =
          ((rankedStudents.length - rank + 1) / rankedStudents.length) * 100;
        const diffFromAvg = (gradeData.score || 0) - classAverage;

        let performance = "متوسط";
        if (percentile >= 90) performance = "عالی";
        else if (percentile >= 75) performance = "خوب";
        else if (percentile >= 50) performance = "متوسط";
        else if (percentile >= 25) performance = "ضعیف";
        else performance = "نیازمند تقویت";

        student.subjects.push({
          subjectName: grading.subjectData?.courseName || "نامشخص",
          gradingTitle: grading.title,
          gradingDate: grading.date || new Date().toISOString(),
          score: gradeData.score || 0,
          classAverage,
          rank,
          totalStudents: rankedStudents.length,
          percentile: Math.round(percentile),
          diffFromAvg: Math.round(diffFromAvg * 10) / 10,
          performance,
          courseCode: grading.subjectData?.courseCode || "",
          courseGrade: grading.subjectData?.Grade || "",
          courseVahed: grading.subjectData?.vahed || 1,
        });
      });
    });

    // Process descriptive grades
    descriptiveGradings.forEach((grading) => {
      const gradingStudents = Object.entries(grading.grades || {}).filter(
        ([, gradeData]) => {
          // More robust check for descriptive text
          return (
            gradeData &&
            typeof gradeData === "object" &&
            "descriptiveText" in gradeData &&
            gradeData.descriptiveText &&
            gradeData.descriptiveText.toString().trim() !== ""
          );
        }
      );

      gradingStudents.forEach(([studentCode, gradeData]) => {
        if (!allStudentData.has(studentCode)) {
          allStudentData.set(studentCode, {
            studentName: gradeData.studentName,
            className: grading.classData?.data?.className,
            subjects: [],
            descriptiveGrades: [],
            overallAverage: 0,
            overallRank: 0,
            overallDiffFromAvg: 0,
          });
        }

        const student = allStudentData.get(studentCode)!;
        student.descriptiveGrades.push({
          subjectName: grading.subjectData?.courseName || "نامشخص",
          gradingTitle: grading.title,
          gradingDate: grading.date || new Date().toISOString(),
          descriptiveText: gradeData.descriptiveText?.toString() || "",
          courseCode: grading.subjectData?.courseCode || "",
          courseGrade: grading.subjectData?.Grade || "",
          courseVahed: grading.subjectData?.vahed || 1,
        });
      });
    });

    // Calculate overall statistics for each student
    allStudentData.forEach((student) => {
      if (student.subjects.length > 0) {
        student.overallAverage =
          student.subjects.reduce((sum, subject) => sum + subject.score, 0) /
          student.subjects.length;
      } else {
        student.overallAverage = 0;
      }
    });

    const studentsArray = Array.from(allStudentData.entries()).map(
      ([code, data]) => ({
        studentCode: code,
        ...data,
      })
    );

    // Calculate overall ranks
    studentsArray.sort((a, b) => b.overallAverage - a.overallAverage);
    studentsArray.forEach((student, index) => {
      student.overallRank = index + 1;
      const overallClassAverage =
        studentsArray.reduce((sum, s) => sum + s.overallAverage, 0) /
        studentsArray.length;
      student.overallDiffFromAvg =
        Math.round((student.overallAverage - overallClassAverage) * 10) / 10;
    });

    studentsArray.sort((a, b) =>
      a.studentName.localeCompare(b.studentName, "fa")
    );

    // Debug: Log final student data
    console.log(
      "Final students array:",
      studentsArray.map((s) => ({
        name: s.studentName,
        descriptiveGradesCount: s.descriptiveGrades?.length || 0,
        descriptiveGrades: s.descriptiveGrades,
      }))
    );

    // Ensure all grades are sorted by date before processing
    studentsArray.forEach((student) => {
      // Sort all subjects by date first
      student.subjects.sort(
        (a, b) =>
          new Date(a.gradingDate).getTime() - new Date(b.gradingDate).getTime()
      );
    });

    // Calculate progress for each student's subjects
    studentsArray.forEach((student) => {
      // Group subjects by course code and subject name for more accurate tracking
      const subjectGroups = student.subjects.reduce((groups, subject) => {
        // Create a unique key using course code and subject name for better accuracy
        const key = subject.courseCode
          ? `${subject.courseCode}-${subject.subjectName}`
          : subject.subjectName;
        if (!groups[key]) groups[key] = [];
        groups[key].push(subject);
        return groups;
      }, {} as Record<string, typeof student.subjects>);

      // Sort each group by date chronologically and calculate progress
      Object.values(subjectGroups).forEach((subjects) => {
        subjects.sort(
          (a, b) =>
            new Date(a.gradingDate).getTime() -
            new Date(b.gradingDate).getTime()
        );

        subjects.forEach((subject, index) => {
          if (index > 0) {
            const previousSubject = subjects[index - 1];
            const scoreDiff = subject.score - previousSubject.score;
            const rankDiff = previousSubject.rank - subject.rank; // Lower rank number is better

            subject.progressInfo = {
              scoreDiff: Math.round(scoreDiff * 10) / 10,
              rankDiff,
              hasProgress: scoreDiff > 0 || rankDiff > 0,
              previousScore: previousSubject.score,
              previousRank: previousSubject.rank,
            };
          }
        });
      });
    });

    // Calculate overall progress for each student
    studentsArray.forEach((student) => {
      const subjectsWithProgress = student.subjects.filter(
        (s) => s.progressInfo
      );

      if (subjectsWithProgress.length > 0) {
        const totalScoreChange = subjectsWithProgress.reduce(
          (sum, s) => sum + (s.progressInfo?.scoreDiff || 0),
          0
        );
        const totalRankChange = subjectsWithProgress.reduce(
          (sum, s) => sum + (s.progressInfo?.rankDiff || 0),
          0
        );
        const progressCount = subjectsWithProgress.filter(
          (s) => s.progressInfo?.hasProgress
        ).length;
        const declineCount = subjectsWithProgress.filter(
          (s) => !s.progressInfo?.hasProgress
        ).length;
        const noChangeCount = subjectsWithProgress.filter(
          (s) =>
            s.progressInfo?.scoreDiff === 0 && s.progressInfo?.rankDiff === 0
        ).length;

        const progressPercentage = Math.round(
          (progressCount / subjectsWithProgress.length) * 100
        );

        let overallTrend: "improvement" | "decline" | "stable" = "stable";
        if (progressCount > declineCount) {
          overallTrend = "improvement";
        } else if (declineCount > progressCount) {
          overallTrend = "decline";
        }

        student.overallProgress = {
          totalScoreChange: Math.round(totalScoreChange * 10) / 10,
          totalRankChange,
          progressCount,
          declineCount,
          noChangeCount,
          overallTrend,
          progressPercentage,
        };
      }
    });

    return (
      <div className="space-y-6">
        {/* Teacher Statistics Overview */}
        <TeacherStatistics studentsArray={studentsArray} />

        {studentsArray.map((student) => (
          <Card
            key={student.studentCode}
            className="print:shadow-none print:border"
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
                <h1 className="text-2xl font-bold mb-2">
                  {reportData.reportTitle}
                </h1>
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
                  <h3 className="font-semibold mb-3 text-lg">
                    اطلاعات دانش‌آموز
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">نام:</span>{" "}
                      {student.studentName}
                    </p>
                    <p>
                      <span className="font-medium">کد دانش‌آموزی:</span>{" "}
                      {student.studentCode}
                    </p>
                    <p>
                      <span className="font-medium">کلاس:</span>{" "}
                      {student.className}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-lg">عملکرد کلی</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">میانگین کلی:</span>{" "}
                      {student.overallAverage.toFixed(1)}
                    </p>
                    <p>
                      <span className="font-medium">رتبه کلی:</span>{" "}
                      {student.overallRank} از {studentsArray.length}
                    </p>
                    <p>
                      <span className="font-medium">
                        اختلاف از میانگین کلی:
                      </span>
                      <span
                        className={
                          student.overallDiffFromAvg >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {student.overallDiffFromAvg >= 0 ? "+" : ""}
                        {student.overallDiffFromAvg}
                      </span>
                    </p>
                    {student.overallProgress && (
                      <div className="mt-3 p-3 rounded-lg border bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-gray-800">
                            روند کلی عملکرد:
                          </span>
                          <div
                            className={`flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                              student.overallProgress.overallTrend ===
                              "improvement"
                                ? "bg-green-100 text-green-700"
                                : student.overallProgress.overallTrend ===
                                  "decline"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {student.overallProgress.overallTrend ===
                            "improvement" ? (
                              <TrendingUp className="h-3 w-3 ml-1" />
                            ) : student.overallProgress.overallTrend ===
                              "decline" ? (
                              <TrendingDown className="h-3 w-3 ml-1 transform rotate-180" />
                            ) : (
                              <Target className="h-3 w-3 ml-1" />
                            )}
                            {student.overallProgress.overallTrend ===
                            "improvement"
                              ? "در حال پیشرفت"
                              : student.overallProgress.overallTrend ===
                                "decline"
                              ? "نیاز به توجه"
                              : "عملکرد ثابت"}
                          </div>
                        </div>

                        {/* Progress Summary */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <div className="text-lg font-bold text-green-600">
                              {student.overallProgress.progressCount}
                            </div>
                            <div className="text-xs text-gray-600">
                              درس بهبود یافته
                            </div>
                          </div>
                          <div className="text-center p-2 bg-white rounded border">
                            <div className="text-lg font-bold text-red-600">
                              {student.overallProgress.declineCount}
                            </div>
                            <div className="text-xs text-gray-600">
                              درس کاهش یافته
                            </div>
                          </div>
                          <div className="text-center p-2 bg-white rounded border">
                            <div className="text-lg font-bold text-yellow-600">
                              {student.overallProgress.noChangeCount}
                            </div>
                            <div className="text-xs text-gray-600">
                              درس بدون تغییر
                            </div>
                          </div>
                        </div>

                        {/* Detailed Course Progress */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            تحلیل پیشرفت بر اساس کد درس:
                          </div>
                          {(() => {
                            // Group subjects by course code for better analysis
                            const courseGroups = student.subjects.reduce(
                              (groups, subject) => {
                                // Extract course code from subject name or use a default grouping
                                const courseKey = `${subject.courseCode}-${subject.subjectName}`;
                                if (!groups[courseKey]) {
                                  groups[courseKey] = [];
                                }
                                groups[courseKey].push(subject);
                                return groups;
                              },
                              {} as Record<string, typeof student.subjects>
                            );

                            return Object.entries(courseGroups)
                              .map(([courseKey, subjects]) => {
                                // Sort subjects by date to show progression
                                const sortedSubjects = subjects.sort(
                                  (a, b) =>
                                    new Date(a.gradingDate).getTime() -
                                    new Date(b.gradingDate).getTime()
                                );

                                const hasProgress = sortedSubjects.some(
                                  (s) => s.progressInfo
                                );
                                if (!hasProgress) return null;

                                const latestSubject =
                                  sortedSubjects[sortedSubjects.length - 1];
                                const progressInfo = latestSubject.progressInfo;

                                return (
                                  <div
                                    key={courseKey}
                                    className="flex items-center justify-between p-2 bg-white rounded border text-xs"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-800">
                                        {latestSubject.courseCode && (
                                          <span className="text-blue-600 font-mono ml-1">
                                            [{latestSubject.courseCode}]
                                          </span>
                                        )}
                                        {latestSubject.subjectName}
                                      </div>
                                      <div className="text-gray-500">
                                        {sortedSubjects.length} ارزیابی • آخرین:{" "}
                                        {formatPersianDate(
                                          latestSubject.gradingDate
                                        )}
                                        {latestSubject.courseVahed && (
                                          <span className="mr-2">
                                            • {latestSubject.courseVahed} واحد
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {progressInfo && (
                                      <div
                                        className={`flex items-center ${
                                          progressInfo.hasProgress
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {progressInfo.hasProgress ? (
                                          <TrendingUp className="h-3 w-3 ml-1" />
                                        ) : (
                                          <TrendingDown className="h-3 w-3 ml-1 transform rotate-180" />
                                        )}
                                        <span className="font-bold">
                                          {progressInfo.scoreDiff >= 0
                                            ? "+"
                                            : ""}
                                          {progressInfo.scoreDiff}
                                        </span>
                                        <span className="text-gray-400 mr-1">
                                          ({progressInfo.previousScore} →{" "}
                                          {latestSubject.score})
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                              .filter(Boolean);
                          })()}
                        </div>

                        {/* Overall Statistics */}
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                مجموع تغییر نمرات:
                              </span>
                              <span
                                className={`font-bold ${
                                  student.overallProgress.totalScoreChange >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {student.overallProgress.totalScoreChange >= 0
                                  ? "+"
                                  : ""}
                                {student.overallProgress.totalScoreChange}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                درصد موفقیت:
                              </span>
                              <span className="font-bold text-blue-600">
                                {student.overallProgress.progressPercentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistical Table */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 ml-2" />
                  جدول تحلیلی عملکرد
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-center font-medium">
                          درس
                        </th>
                        <th className="border border-gray-300 p-2 text-center font-medium">
                          نمره
                        </th>
                        <th className="border border-gray-300 p-2 text-center font-medium">
                          میانگین کلاس
                        </th>
                        <th className="border border-gray-300 p-2 text-center font-medium">
                          اختلاف از میانگین
                        </th>
                        <th className="border border-gray-300 p-2 text-center font-medium">
                          رتبه
                        </th>
                        <th className="border border-gray-300 p-2 text-center font-medium">
                          درصد رتبه
                        </th>
                        <th className="border border-gray-300 p-2 text-center font-medium">
                          عملکرد
                        </th>
                        <th className="border border-gray-300 p-2 text-center font-medium">
                          پیشرفت
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.subjects.map((subject, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 font-medium">
                            <div>
                              <div className="font-medium">
                                {subject.subjectName}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {subject.gradingTitle}
                                {subject.gradingDate && (
                                  <span className="block text-gray-400 mt-1">
                                    {formatPersianDate(subject.gradingDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <span
                              className={`font-bold ${
                                subject.score >= 17
                                  ? "text-green-600"
                                  : subject.score >= 14
                                  ? "text-blue-600"
                                  : subject.score >= 10
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {subject.score.toFixed(1)}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-gray-600">
                            {subject.classAverage.toFixed(1)}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <span
                              className={
                                subject.diffFromAvg >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {subject.diffFromAvg >= 0 ? "+" : ""}
                              {subject.diffFromAvg}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <div className="flex items-center justify-center">
                              {subject.rank <= 3 && (
                                <Trophy className="h-4 w-4 text-yellow-500 ml-1" />
                              )}
                              {subject.rank}/{subject.totalStudents}
                            </div>
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <div className="flex items-center justify-center">
                              <div className="w-12 bg-gray-200 rounded-full h-2 ml-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    subject.percentile >= 90
                                      ? "bg-green-500"
                                      : subject.percentile >= 75
                                      ? "bg-blue-500"
                                      : subject.percentile >= 50
                                      ? "bg-yellow-500"
                                      : subject.percentile >= 25
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${subject.percentile}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">
                                {subject.percentile}%
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                subject.performance === "عالی"
                                  ? "bg-green-100 text-green-800"
                                  : subject.performance === "خوب"
                                  ? "bg-blue-100 text-blue-800"
                                  : subject.performance === "متوسط"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : subject.performance === "ضعیف"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {subject.performance}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <div className="flex items-center justify-center">
                              {subject.progressInfo ? (
                                <div className="text-center">
                                  <div
                                    className={`flex items-center justify-center ${
                                      subject.progressInfo.hasProgress
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {subject.progressInfo.hasProgress ? (
                                      <TrendingUp className="h-4 w-4" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 transform rotate-180" />
                                    )}
                                    <span className="text-xs font-bold ml-1">
                                      {subject.progressInfo.scoreDiff >= 0
                                        ? "+"
                                        : ""}
                                      {subject.progressInfo.scoreDiff}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {subject.progressInfo.previousScore} →{" "}
                                    {subject.score}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <div className="text-gray-400">
                                    <Target className="h-4 w-4 mx-auto" />
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    اولین نمره
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-medium">
                        <td className="border border-gray-300 p-2 font-bold text-center">
                          خلاصه کلی
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <span className="font-bold text-blue-600">
                            {student.overallAverage.toFixed(1)}
                          </span>
                          <div className="text-xs text-gray-500">میانگین</div>
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-gray-600">
                          {(
                            studentsArray.reduce(
                              (sum, s) => sum + s.overallAverage,
                              0
                            ) / studentsArray.length
                          ).toFixed(1)}
                          <div className="text-xs text-gray-500">
                            میانگین کلی
                          </div>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <span
                            className={
                              student.overallDiffFromAvg >= 0
                                ? "text-green-600 font-bold"
                                : "text-red-600 font-bold"
                            }
                          >
                            {student.overallDiffFromAvg >= 0 ? "+" : ""}
                            {student.overallDiffFromAvg}
                          </span>
                          <div className="text-xs text-gray-500">کل اختلاف</div>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <div className="flex items-center justify-center">
                            {student.overallRank <= 3 && (
                              <Trophy className="h-4 w-4 text-yellow-500 ml-1" />
                            )}
                            <span className="font-bold">
                              {student.overallRank}/{studentsArray.length}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">رتبه کلی</div>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-12 bg-gray-200 rounded-full h-2 ml-2">
                              <div
                                className={`h-2 rounded-full ${
                                  ((studentsArray.length -
                                    student.overallRank +
                                    1) /
                                    studentsArray.length) *
                                    100 >=
                                  90
                                    ? "bg-green-500"
                                    : ((studentsArray.length -
                                        student.overallRank +
                                        1) /
                                        studentsArray.length) *
                                        100 >=
                                      75
                                    ? "bg-blue-500"
                                    : ((studentsArray.length -
                                        student.overallRank +
                                        1) /
                                        studentsArray.length) *
                                        100 >=
                                      50
                                    ? "bg-yellow-500"
                                    : ((studentsArray.length -
                                        student.overallRank +
                                        1) /
                                        studentsArray.length) *
                                        100 >=
                                      25
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width: `${
                                    ((studentsArray.length -
                                      student.overallRank +
                                      1) /
                                      studentsArray.length) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold">
                              {Math.round(
                                ((studentsArray.length -
                                  student.overallRank +
                                  1) /
                                  studentsArray.length) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">درصد کلی</div>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              student.overallAverage >= 17
                                ? "bg-green-100 text-green-800"
                                : student.overallAverage >= 14
                                ? "bg-blue-100 text-blue-800"
                                : student.overallAverage >= 10
                                ? "bg-yellow-100 text-yellow-800"
                                : student.overallAverage >= 7
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {student.overallAverage >= 17
                              ? "عالی"
                              : student.overallAverage >= 14
                              ? "خوب"
                              : student.overallAverage >= 10
                              ? "متوسط"
                              : student.overallAverage >= 7
                              ? "ضعیف"
                              : "نیازمند تقویت"}
                          </span>
                          <div className="text-xs text-gray-500">
                            عملکرد کلی
                          </div>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <div className="flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {student.subjects.length}
                              </div>
                              <div className="text-xs text-gray-500">
                                تعداد دروس
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-lg">خلاصه عملکرد</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-lg font-semibold text-green-600">
                      {
                        student.subjects.filter((s) => s.performance === "عالی")
                          .length
                      }
                    </div>
                    <div className="text-xs text-green-600">درس عالی</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-lg font-semibold text-blue-600">
                      {
                        student.subjects.filter((s) => s.performance === "خوب")
                          .length
                      }
                    </div>
                    <div className="text-xs text-blue-600">درس خوب</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-lg font-semibold text-yellow-600">
                      {
                        student.subjects.filter(
                          (s) => s.performance === "متوسط"
                        ).length
                      }
                    </div>
                    <div className="text-xs text-yellow-600">درس متوسط</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-lg font-semibold text-red-600">
                      {
                        student.subjects.filter(
                          (s) =>
                            s.performance === "ضعیف" ||
                            s.performance === "نیازمند تقویت"
                        ).length
                      }
                    </div>
                    <div className="text-xs text-red-600">نیاز به تقویت</div>
                  </div>
                </div>
              </div>

              {/* Descriptive Grades Section */}
              {student.descriptiveGrades &&
                student.descriptiveGrades.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-lg flex items-center">
                      <FileText className="h-5 w-5 ml-2" />
                      ارزیابی‌های توصیفی
                    </h3>
                    <div className="grid gap-3">
                      {student.descriptiveGrades
                        .sort(
                          (a, b) =>
                            new Date(a.gradingDate).getTime() -
                            new Date(b.gradingDate).getTime()
                        )
                        .map((grade, index) => (
                          <div
                            key={index}
                            className="p-4 border rounded-lg bg-blue-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-gray-800">
                                  {grade.courseCode && (
                                    <span className="text-blue-600 font-mono ml-1">
                                      [{grade.courseCode}]
                                    </span>
                                  )}
                                  {grade.subjectName}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {grade.gradingTitle}
                                </div>
                              </div>
                              <div className="text-left">
                                <div className="text-sm text-gray-500">
                                  {formatPersianDate(grade.gradingDate)}
                                </div>
                                {grade.courseVahed && (
                                  <div className="text-xs text-gray-400">
                                    {grade.courseVahed} واحد
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-400">
                              <div className="text-sm font-medium text-gray-700 mb-1">
                                ارزیابی:
                              </div>
                              <div className="text-gray-800">
                                {grade.descriptiveText}
                              </div>
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
        ))}
      </div>
    );
  };

  const renderStudentCard = (student: StudentReport) => (
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
      <div className="space-y-8">
        {reportData.reportFormat === "statistical"
          ? renderStatisticalTable()
          : studentReports.map(renderStudentCard)}
      </div>

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
