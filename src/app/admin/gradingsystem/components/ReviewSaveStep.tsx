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
import { Label } from "@/components/ui/label";

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
  Hash,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReviewSaveStepProps {
  gradingData: {
    selectedClass: any | null;
    selectedSubject: any | null;
    gradeTitle: string;
    gradeDate: string;
    gradingType: "numerical" | "descriptive";
    studentGrades: {
      [studentCode: string]: {
        score?: number;
        descriptiveText?: string;
        studentName: string;
      };
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

  // Calculate statistics for numerical grades only
  const numericalGrades = grades.filter((grade) => grade.score !== undefined);
  const averageScore =
    numericalGrades.length > 0
      ? numericalGrades.reduce((sum, grade) => sum + (grade.score || 0), 0) /
        numericalGrades.length
      : 0;

  const highScores = numericalGrades.filter((g) => (g.score || 0) >= 17).length;
  const passingScores = numericalGrades.filter(
    (g) => (g.score || 0) >= 10
  ).length;
  const failingScores = numericalGrades.filter(
    (g) => (g.score || 0) < 10
  ).length;

  const handleSave = async () => {
    try {
      setSaving(true);

      const saveData = {
        title: gradingData.gradeTitle,
        gradeDate: gradingData.gradeDate,
        gradingType: gradingData.gradingType,
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
        title: gradingData.isEditing
          ? gradingData.gradingType === "descriptive"
            ? "ارزیابی‌ها ویرایش شد"
            : "نمرات ویرایش شد"
          : gradingData.gradingType === "descriptive"
          ? "ارزیابی‌ها ذخیره شد"
          : "نمرات ذخیره شد",
        description: gradingData.isEditing
          ? "تغییرات با موفقیت اعمال شد"
          : `${studentsWithGrades} ${
              gradingData.gradingType === "descriptive" ? "ارزیابی" : "نمره"
            } با موفقیت ذخیره شد`,
      });

      onSaveSuccess();
    } catch (error) {
      console.error("Error saving grades:", error);
      toast({
        title: "خطا در ذخیره",
        description: `مشکلی در ذخیره ${
          gradingData.gradingType === "descriptive" ? "ارزیابی‌ها" : "نمرات"
        } رخ داد. لطفاً مجدد تلاش کنید.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          {gradingData.gradingType === "numerical" ? (
            <Hash className="h-5 w-5" />
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
          {gradingData.gradingType === "descriptive"
            ? "بررسی و ذخیره ارزیابی‌های توصیفی"
            : "بررسی و ذخیره نمرات"}
        </h3>
        <p className="text-muted-foreground">
          لطفاً اطلاعات وارد شده را بررسی کنید و در صورت صحت،{" "}
          {gradingData.gradingType === "descriptive" ? "ارزیابی‌ها" : "نمرات"}{" "}
          را ذخیره کنید
        </p>
      </div>

      {/* Summary Cards */}
      <div
        className={`grid gap-4 ${
          gradingData.gradingType === "numerical"
            ? "md:grid-cols-2 lg:grid-cols-4"
            : "md:grid-cols-2"
        }`}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">
                  {gradingData.gradingType === "descriptive"
                    ? "تعداد ارزیابی‌ها"
                    : "تعداد نمرات"}
                </p>
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
              {gradingData.gradingType === "numerical" ? (
                <Hash className="h-5 w-5 text-purple-500" />
              ) : (
                <MessageSquare className="h-5 w-5 text-purple-500" />
              )}
              <div>
                <p className="text-sm font-medium">نوع ارزیابی</p>
                <p className="text-lg font-bold">
                  {gradingData.gradingType === "descriptive"
                    ? "توصیفی"
                    : "عددی"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {gradingData.gradingType === "descriptive"
                    ? "متن توضیحی"
                    : "نمره ۰-۲۰"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {gradingData.gradingType === "numerical" && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">میانگین کلاس</p>
                    <p className="text-2xl font-bold">
                      {averageScore.toFixed(1)}
                    </p>
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
          </>
        )}
      </div>

      {gradingData.gradingType === "numerical" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">نمرات بالا</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {highScores}
                  </p>
                  <p className="text-xs text-muted-foreground">نمره ≥ ۱۷</p>
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
      )}

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
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                کلاس
              </Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">
                  {gradingData.selectedClass?.data?.className}
                </p>
                <p className="text-sm text-muted-foreground">
                  کد: {gradingData.selectedClass?.data?.classCode}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                درس
              </Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">
                  {gradingData.selectedSubject?.courseName}
                </p>
                <p className="text-sm text-muted-foreground">
                  کد: {gradingData.selectedSubject?.courseCode}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                عنوان
              </Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{gradingData.gradeTitle}</p>
                <Badge variant="outline" className="mt-1">
                  {gradingData.gradingType === "descriptive"
                    ? "توصیفی"
                    : "عددی"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                تاریخ
              </Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">
                  {new Date(gradingData.gradeDate).toLocaleDateString("fa-IR")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {gradingData.gradingType === "descriptive"
              ? "پیش‌نمایش ارزیابی‌ها"
              : "پیش‌نمایش نمرات"}
          </CardTitle>
          <CardDescription>
            {studentsWithGrades}{" "}
            {gradingData.gradingType === "descriptive" ? "ارزیابی" : "نمره"}{" "}
            وارد شده
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {Object.entries(gradingData.studentGrades).map(
                ([studentCode, gradeData]) => (
                  <div
                    key={studentCode}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{gradeData.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        کد: {studentCode}
                      </p>
                    </div>
                    <div className="text-left">
                      {gradingData.gradingType === "numerical" ? (
                        <Badge
                          variant={
                            (gradeData.score || 0) >= 10
                              ? "default"
                              : "destructive"
                          }
                          className="text-base px-3 py-1"
                        >
                          {gradeData.score}/20
                        </Badge>
                      ) : (
                        <div className="max-w-xs text-right">
                          <p className="text-sm bg-blue-50 p-2 rounded text-blue-900">
                            {gradeData.descriptiveText}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={handleSave}
          disabled={saving || studentsWithGrades === 0}
          size="lg"
          className="min-w-48 gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              {gradingData.isEditing
                ? gradingData.gradingType === "descriptive"
                  ? "ویرایش ارزیابی‌ها"
                  : "ویرایش نمرات"
                : gradingData.gradingType === "descriptive"
                ? "ذخیره ارزیابی‌ها"
                : "ذخیره نمرات"}
            </>
          )}
        </Button>
      </div>

      {studentsWithGrades === 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>
                {gradingData.gradingType === "descriptive"
                  ? "هیچ ارزیابی توصیفی وارد نشده است"
                  : "هیچ نمره‌ای وارد نشده است"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

