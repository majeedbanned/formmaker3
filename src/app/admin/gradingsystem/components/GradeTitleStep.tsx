"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FileText, Lightbulb, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { Value } from "react-multi-date-picker";

interface GradeTitleStepProps {
  gradeTitle: string;
  gradeDate: string;
  onTitleChange: (title: string) => void;
  onDateChange: (date: string) => void;
}

const SAMPLE_TITLES = [
  "آزمون میان‌ترم",
  "آزمون پایان‌ترم",
  "تکلیف شماره ۱",
  "پروژه نهایی",
  "آزمون کتبی ماهانه",
  "ارزیابی شفاهی",
  "تمرین کلاسی",
  "کار عملی آزمایشگاه",
];

export function GradeTitleStep({
  gradeTitle,
  gradeDate,
  onTitleChange,
  onDateChange,
}: GradeTitleStepProps) {
  // Handle date change from Persian calendar
  const handleDateChange = (date: Value) => {
    // Convert to JavaScript Date object and then to ISO string
    if (date) {
      const dateObj = date as unknown as { toDate: () => Date };
      if (dateObj.toDate) {
        const jsDate = dateObj.toDate();
        // Format as ISO string and extract the date part (YYYY-MM-DD)
        onDateChange(jsDate.toISOString().split("T")[0]);
      }
    } else {
      onDateChange("");
    }
  };

  // Convert gradeDate back to Date object for the Persian calendar
  const persianDateValue = gradeDate ? new Date(gradeDate) : null;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h3 className="text-lg font-semibold mb-2">عنوان و تاریخ ثبت نمره</h3>
        <p className="text-muted-foreground">
          عنوان و تاریخ مناسب برای این مجموعه نمرات وارد کنید
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            اطلاعات ثبت نمره
          </CardTitle>
          <CardDescription>
            عنوان و تاریخ ثبت شده برای تمام نمرات این مجموعه استفاده خواهد شد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gradeTitle">عنوان *</Label>
              <Input
                id="gradeTitle"
                placeholder="مثال: آزمون میان‌ترم"
                value={gradeTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-right"
              />
              <p className="text-sm text-muted-foreground">
                حداقل ۳ کاراکتر وارد کنید
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                تاریخ آزمون/ارزیابی *
              </Label>
              <div className="relative">
                <DatePicker
                  id="gradeDate"
                  calendar={persian}
                  locale={persian_fa}
                  value={persianDateValue}
                  onChange={handleDateChange}
                  format="YYYY/MM/DD"
                  className="w-full rounded-md border border-input"
                  inputClass="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  calendarPosition="bottom-right"
                  containerClassName="rmdp-container"
                  placeholder="تاریخ را انتخاب کنید"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                تاریخ برگزاری آزمون یا ارزیابی
              </p>
            </div>
          </div>

          {(gradeTitle.trim() || gradeDate) && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>پیش‌نمایش:</strong>
                {gradeTitle && ` ${gradeTitle}`}
                {gradeDate && (
                  <span className="text-muted-foreground">
                    {gradeTitle ? " - " : ""}
                    {new Date(gradeDate).toLocaleDateString("fa-IR")}
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            پیشنهادات
          </CardTitle>
          <CardDescription>
            می‌توانید از یکی از عناوین زیر استفاده کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TITLES.map((title) => (
              <Badge
                key={title}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => onTitleChange(title)}
              >
                {title}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {((gradeTitle.trim().length < 3 && gradeTitle.trim().length > 0) ||
        !gradeDate) && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="space-y-1">
              {gradeTitle.trim().length < 3 && gradeTitle.trim().length > 0 && (
                <p className="text-destructive text-sm">
                  عنوان باید حداقل ۳ کاراکتر باشد
                </p>
              )}
              {!gradeDate && (
                <p className="text-destructive text-sm">
                  انتخاب تاریخ الزامی است
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
