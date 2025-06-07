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

import { FileText, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GradeTitleStepProps {
  gradeTitle: string;
  onTitleChange: (title: string) => void;
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
  onTitleChange,
}: GradeTitleStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">عنوان ثبت نمره</h3>
        <p className="text-muted-foreground">
          عنوانی مناسب برای این مجموعه نمرات وارد کنید
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            اطلاعات ثبت نمره
          </CardTitle>
          <CardDescription>
            عنوان ثبت شده برای تمام نمرات این مجموعه استفاده خواهد شد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {gradeTitle.trim() && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>پیش‌نمایش:</strong> {gradeTitle}
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

      {gradeTitle.trim().length < 3 && gradeTitle.trim().length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">
              عنوان باید حداقل ۳ کاراکتر باشد
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
