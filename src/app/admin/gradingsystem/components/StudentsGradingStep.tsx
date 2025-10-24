"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Users,
  TrendingUp,
  Hash,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentsGradingStepProps {
  selectedClass: any | null;
  gradingType: "numerical" | "descriptive";
  studentGrades: {
    [studentCode: string]: {
      score?: number;
      descriptiveText?: string;
      studentName: string;
    };
  };
  onGradesChange: (grades: {
    [studentCode: string]: {
      score?: number;
      descriptiveText?: string;
      studentName: string;
    };
  }) => void;
}

export function StudentsGradingStep({
  selectedClass,
  gradingType,
  studentGrades,
  onGradesChange,
}: StudentsGradingStepProps) {
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const inputRefs = useRef<{
    [key: string]: HTMLInputElement | HTMLTextAreaElement | null;
  }>({});

  // Sort students by family name (studentlname)
  const students = (selectedClass?.data?.students || []).slice().sort((a: any, b: any) => {
    const nameA = (a.studentlname || '').toLowerCase();
    const nameB = (b.studentlname || '').toLowerCase();
    return nameA.localeCompare(nameB, 'fa');
  });

  useEffect(() => {
    // Focus first empty input only on mount or when students change
    const firstEmptyStudent = students.find(
      (student: any) => !studentGrades[student.studentCode]
    );
    if (firstEmptyStudent) {
      const input = inputRefs.current[firstEmptyStudent.studentCode];
      if (input) {
        input.focus();
      }
    }
  }, [students]); // Removed studentGrades dependency

  const handleScoreChange = (
    studentCode: string,
    studentName: string,
    value: string
  ) => {
    const numericValue = parseFloat(value);

    if (value === "" || (numericValue >= 0 && numericValue <= 20)) {
      const newGrades = { ...studentGrades };

      if (value === "") {
        delete newGrades[studentCode];
      } else {
        newGrades[studentCode] = {
          score: numericValue,
          studentName: studentName,
        };
      }

      onGradesChange(newGrades);
    }
  };

  const handleDescriptiveTextChange = (
    studentCode: string,
    studentName: string,
    value: string
  ) => {
    const newGrades = { ...studentGrades };

    if (value.trim() === "") {
      delete newGrades[studentCode];
    } else {
      newGrades[studentCode] = {
        descriptiveText: value,
        studentName: studentName,
      };
    }

    onGradesChange(newGrades);
  };

  const handleKeyDown = (event: React.KeyboardEvent, studentIndex: number) => {
    if (
      event.key === "Enter" ||
      (event.key === "Tab" && gradingType === "numerical")
    ) {
      event.preventDefault();

      // Move to next student
      const nextIndex = studentIndex + 1;
      if (nextIndex < students.length) {
        const nextStudent = students[nextIndex];
        const nextInput = inputRefs.current[nextStudent.studentCode];
        if (nextInput) {
          nextInput.focus();
          if (nextInput instanceof HTMLInputElement) {
            nextInput.select();
          }
        }
        setCurrentStudentIndex(nextIndex);
      }
    } else if (event.key === "ArrowUp" && studentIndex > 0) {
      event.preventDefault();
      const prevStudent = students[studentIndex - 1];
      const prevInput = inputRefs.current[prevStudent.studentCode];
      if (prevInput) {
        prevInput.focus();
        if (prevInput instanceof HTMLInputElement) {
          prevInput.select();
        }
      }
      setCurrentStudentIndex(studentIndex - 1);
    } else if (
      event.key === "ArrowDown" &&
      studentIndex < students.length - 1
    ) {
      event.preventDefault();
      const nextStudent = students[studentIndex + 1];
      const nextInput = inputRefs.current[nextStudent.studentCode];
      if (nextInput) {
        nextInput.focus();
        if (nextInput instanceof HTMLInputElement) {
          nextInput.select();
        }
      }
      setCurrentStudentIndex(studentIndex + 1);
    }
  };

  const clearAllGrades = () => {
    onGradesChange({});
  };

  const fillSampleGrades = () => {
    const sampleGrades: {
      [key: string]: {
        score?: number;
        descriptiveText?: string;
        studentName: string;
      };
    } = {};

    if (gradingType === "numerical") {
      students.forEach((student: any) => {
        const randomScore = Math.floor(Math.random() * 8) + 13; // Random score between 13-20
        sampleGrades[student.studentCode] = {
          score: randomScore,
          studentName: `${student.studentName} ${student.studentlname}`,
        };
      });
    } else {
      const sampleTexts = [
        "عملکرد فوق‌العاده و قابل تحسین",
        "نیاز به تمرین بیشتر دارد",
        "پیشرفت خوبی داشته است",
        "باید بر حل مسائل تمرکز کند",
        "درک مطالب خوب است",
        "نیاز به مطالعه بیشتر دارد",
      ];

      students.forEach((student: any, index: number) => {
        sampleGrades[student.studentCode] = {
          descriptiveText: sampleTexts[index % sampleTexts.length],
          studentName: `${student.studentName} ${student.studentlname}`,
        };
      });
    }

    onGradesChange(sampleGrades);
  };

  const completedCount = Object.keys(studentGrades).length;
  const totalCount = students.length;
  const completionPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const averageScore =
    gradingType === "numerical" && completedCount > 0
      ? Object.values(studentGrades)
          .filter((grade) => grade.score !== undefined)
          .reduce((sum, grade) => sum + (grade.score || 0), 0) / completedCount
      : 0;

  if (!selectedClass) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">ابتدا کلاس را انتخاب کنید</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          {gradingType === "numerical" ? (
            <Hash className="h-5 w-5" />
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
          {gradingType === "numerical"
            ? "ثبت نمرات دانش‌آموزان"
            : "ثبت ارزیابی توصیفی دانش‌آموزان"}
        </h3>
        <p className="text-muted-foreground">
          {gradingType === "numerical"
            ? "نمره هر دانش‌آموز را از ۰ تا ۲۰ وارد کنید. از کلیدهای Enter یا Tab برای انتقال سریع استفاده کنید."
            : "برای هر دانش‌آموز توضیح و ارزیابی توصیفی وارد کنید."}
        </p>
      </div>

      {/* Progress and Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">پیشرفت</p>
                <p className="text-2xl font-bold">
                  {completedCount}/{totalCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {completionPercentage.toFixed(0)}% تکمیل شده
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {gradingType === "numerical" && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">میانگین نمرات</p>
                  <p className="text-2xl font-bold">
                    {averageScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">از ۲۰</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllGrades}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              پاک کردن همه
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fillSampleGrades}
              className="w-full"
            >
              نمونه تست
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Students Grading List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            فهرست دانش‌آموزان
          </CardTitle>
          <CardDescription>
            کلاس {selectedClass.data.className} - {totalCount} دانش‌آموز
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {students.map((student: any, index: number) => {
                const studentFullName = `${student.studentName} ${student.studentlname}`;
                const currentGrade = studentGrades[student.studentCode];
                const hasGrade = currentGrade !== undefined;
                const isCurrentlyFocused = currentStudentIndex === index;

                return (
                  <div
                    key={student.studentCode}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border transition-all",
                      hasGrade ? "bg-green-50 border-green-200" : "bg-muted/30",
                      isCurrentlyFocused && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-8">
                      {hasGrade ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{studentFullName}</p>
                      <p className="text-sm text-muted-foreground">
                        کد: {student.studentCode}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      {gradingType === "numerical" ? (
                        <>
                          <Label
                            htmlFor={`score-${student.studentCode}`}
                            className="text-sm"
                          >
                            نمره:
                          </Label>
                          <div className="relative">
                            <Input
                              id={`score-${student.studentCode}`}
                              ref={(el) => {
                                inputRefs.current[student.studentCode] = el;
                              }}
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              placeholder="0-20"
                              value={currentGrade?.score?.toString() || ""}
                              onChange={(e) =>
                                handleScoreChange(
                                  student.studentCode,
                                  studentFullName,
                                  e.target.value
                                )
                              }
                              onKeyDown={(e) => handleKeyDown(e, index)}
                              onFocus={() => setCurrentStudentIndex(index)}
                              className="w-20 text-center"
                            />
                          </div>

                          {hasGrade && currentGrade.score !== undefined && (
                            <Badge
                              variant={
                                currentGrade.score >= 10
                                  ? "default"
                                  : "destructive"
                              }
                              className="min-w-12 justify-center"
                            >
                              {currentGrade.score}/20
                            </Badge>
                          )}
                        </>
                      ) : (
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`desc-${student.studentCode}`}
                            className="text-sm"
                          >
                            ارزیابی توصیفی:
                          </Label>
                          <Textarea
                            id={`desc-${student.studentCode}`}
                            ref={(el) => {
                              inputRefs.current[student.studentCode] = el;
                            }}
                            placeholder="توضیحات و ارزیابی دانش‌آموز..."
                            value={currentGrade?.descriptiveText || ""}
                            onChange={(e) =>
                              handleDescriptiveTextChange(
                                student.studentCode,
                                studentFullName,
                                e.target.value
                              )
                            }
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onFocus={() => setCurrentStudentIndex(index)}
                            className="min-h-[60px] resize-none"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">راهنمای سریع</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {gradingType === "numerical" ? (
                  <>
                    <li>
                      • از کلیدهای Enter یا Tab برای رفتن به دانش‌آموز بعدی
                      استفاده کنید
                    </li>
                    <li>
                      • از کلیدهای جهت‌دار (↑↓) برای حرکت بین ردیف‌ها استفاده
                      کنید
                    </li>
                    <li>• نمرات باید بین ۰ تا ۲۰ باشند</li>
                    <li>• نمرات اعشاری مجاز هستند (مثل ۱۵.۵)</li>
                  </>
                ) : (
                  <>
                    <li>
                      • از کلید Enter برای رفتن به دانش‌آموز بعدی استفاده کنید
                    </li>
                    <li>
                      • از کلیدهای جهت‌دار (↑↓) برای حرکت بین ردیف‌ها استفاده
                      کنید
                    </li>
                    <li>• توضیحات کامل و مفصل وارد کنید</li>
                    <li>• از الفاظ محترمانه و سازنده استفاده کنید</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
