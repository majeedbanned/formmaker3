"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Save,
  Check,
  AlertTriangle,
  Eye,
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  Loader2,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReviewSaveStepProps {
  gradingData: {
    selectedClass: any | null;
    selectedSubject: any | null;
    gradeTitle: string;
    gradeDate: string;
    studentGrades: {
      [studentCode: string]: { score: number; studentName: string };
    };
    isEditing: boolean;
    editingGradeListId?: string;
  };
  onSaveSuccess: () => void;
  userCode: string;
  schoolCode: string;
}

export function ReviewSaveStep({
  gradingData,
  onSaveSuccess,
  userCode,
  schoolCode,
}: ReviewSaveStepProps) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const grades = Object.values(gradingData.studentGrades);
  const studentsWithGrades = grades.length;
  const totalStudents = gradingData.selectedClass?.data?.students?.length || 0;

  const averageScore =
    grades.length > 0
      ? grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length
      : 0;

  const highScores = grades.filter((g) => g.score >= 17).length;
  const passingScores = grades.filter((g) => g.score >= 10).length;
  const failingScores = grades.filter((g) => g.score < 10).length;

  const handleSave = async () => {
    try {
      setSaving(true);

      const saveData = {
        title: gradingData.gradeTitle,
        gradeDate: gradingData.gradeDate,
        classCode: gradingData.selectedClass.data.classCode,
        className: gradingData.selectedClass.data.className,
        courseCode: gradingData.selectedSubject.courseCode,
        courseName: gradingData.selectedSubject.courseName,
        teacherCode: userCode,
        schoolCode: schoolCode,
        grades: gradingData.studentGrades,
        isEditing: gradingData.isEditing,
        gradeListId: gradingData.editingGradeListId,
      };

      const response = await fetch("/api/gradingsystem/save-grades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        throw new Error("Failed to save grades");
      }

      await response.json();

      toast({
        title: gradingData.isEditing ? "نمرات ویرایش شد" : "نمرات ذخیره شد",
        description: gradingData.isEditing
          ? "تغییرات با موفقیت اعمال شد"
          : `${studentsWithGrades} نمره با موفقیت ذخیره شد`,
      });

      onSaveSuccess();
    } catch (error) {
      console.error("Error saving grades:", error);
      toast({
        title: "خطا در ذخیره",
        description: "مشکلی در ذخیره نمرات رخ داد. لطفاً مجدد تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h3 className="text-lg font-semibold mb-2">بررسی و ذخیره نمرات</h3>
        <p className="text-muted-foreground">
          لطفاً اطلاعات وارد شده را بررسی کنید و در صورت صحت، نمرات را ذخیره
          کنید
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">تعداد نمرات</p>
                <p className="text-2xl font-bold">{studentsWithGrades}</p>
                <p className="text-xs text-muted-foreground">
                  از {totalStudents} دانش‌آموز
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">میانگین کلاس</p>
                <p className="text-2xl font-bold">{averageScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">از ۲۰</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">قبول</p>
                <p className="text-2xl font-bold text-green-600">
                  {passingScores}
                </p>
                <p className="text-xs text-muted-foreground">نمره ≥ ۱۰</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">مردود</p>
                <p className="text-2xl font-bold text-red-600">
                  {failingScores}
                </p>
                <p className="text-xs text-muted-foreground">نمره &lt; ۱۰</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            مرور اطلاعات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">کلاس:</span>
                <Badge variant="outline">
                  {gradingData.selectedClass?.data.className}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">درس:</span>
                <Badge variant="outline">
                  {gradingData.selectedSubject?.courseName}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">عنوان:</span>
                <Badge variant="outline">{gradingData.gradeTitle}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">تاریخ:</span>
                <Badge variant="outline">
                  {gradingData.gradeDate
                    ? new Date(gradingData.gradeDate).toLocaleDateString(
                        "fa-IR"
                      )
                    : "-"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">نمرات بالا (≥۱۷):</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {highScores} نفر
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Preview */}
      <Card>
        <CardHeader>
          <CardTitle>پیش‌نمایش نمرات</CardTitle>
          <CardDescription>فهرست کامل نمرات ثبت شده</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {Object.entries(gradingData.studentGrades)
                .sort(([, a], [, b]) => b.score - a.score) // Sort by score descending
                .map(([studentCode, gradeData], index) => (
                  <div
                    key={studentCode}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-8">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{gradeData.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          کد: {studentCode}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        gradeData.score >= 10 ? "default" : "destructive"
                      }
                      className="text-lg px-3 py-1"
                    >
                      {gradeData.score}/20
                    </Badge>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Save Actions */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-primary">
                آماده {gradingData.isEditing ? "ویرایش" : "ذخیره"}؟
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {gradingData.isEditing
                  ? "تغییرات شما اعمال و ذخیره خواهد شد"
                  : `${studentsWithGrades} نمره ذخیره خواهد شد`}
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || studentsWithGrades === 0}
              size="lg"
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {saving
                ? "در حال ذخیره..."
                : gradingData.isEditing
                ? "ویرایش نمرات"
                : "ذخیره نمرات"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {studentsWithGrades === 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">
                هیچ نمره‌ای وارد نشده است. لطفاً حداقل یک نمره وارد کنید.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
