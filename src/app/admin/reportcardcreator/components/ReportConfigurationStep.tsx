"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  FileText,
  TrendingUp,
  Trophy,
  MessageSquare,
  BarChart3,
  Image,
  Building,
  Type,
} from "lucide-react";

interface ReportData {
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

interface ReportConfigurationStepProps {
  reportData: ReportData;
  onConfigChange: (config: Partial<ReportData>) => void;
}

export function ReportConfigurationStep({
  reportData,
  onConfigChange,
}: ReportConfigurationStepProps) {
  const handleChange = (key: string, value: string | boolean) => {
    onConfigChange({ [key]: value });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Type className="h-5 w-5 ml-2" />
            تنظیمات عنوان
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="report-title">عنوان کارنامه</Label>
            <Input
              id="report-title"
              value={reportData.reportTitle}
              onChange={(e) => handleChange("reportTitle", e.target.value)}
              placeholder="عنوان کارنامه را وارد کنید"
              className="text-right"
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 ml-2" />
            قالب گزارش
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>نوع قالب</Label>
            <Select
              value={reportData.reportFormat}
              onValueChange={(value) => handleChange("reportFormat", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detailed">
                  تفصیلی - شامل تمام جزئیات
                </SelectItem>
                <SelectItem value="summary">خلاصه - اطلاعات کلیدی</SelectItem>
                <SelectItem value="minimal">مینیمال - فقط نمرات</SelectItem>
                <SelectItem value="statistical">
                  جدول آماری - تحلیل کامل عملکرد (فقط نمرات عددی)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 ml-2" />
            محتوای کارنامه
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>نمایش آمار و تحلیل</Label>
                <p className="text-sm text-muted-foreground">
                  میانگین، بالاترین و پایین‌ترین نمره کلاس
                </p>
              </div>
            </div>
            <Switch
              checked={reportData.includeStatistics}
              onCheckedChange={(checked) =>
                handleChange("includeStatistics", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Trophy className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>رتبه‌بندی کلاس</Label>
                <p className="text-sm text-muted-foreground">
                  نمایش رتبه دانش‌آموز در کلاس (فقط برای نمرات عددی)
                </p>
              </div>
            </div>
            <Switch
              checked={reportData.includeClassRanking}
              onCheckedChange={(checked) =>
                handleChange("includeClassRanking", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>نظرات استاد</Label>
                <p className="text-sm text-muted-foreground">
                  فضای مخصوص نظرات و توصیه‌های استاد
                </p>
              </div>
            </div>
            <Switch
              checked={reportData.includeTeacherComments}
              onCheckedChange={(checked) =>
                handleChange("includeTeacherComments", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>تفکیک نمرات</Label>
                <p className="text-sm text-muted-foreground">
                  نمایش جزئیات عملکرد هر دانش‌آموز
                </p>
              </div>
            </div>
            <Switch
              checked={reportData.showGradeBreakdown}
              onCheckedChange={(checked) =>
                handleChange("showGradeBreakdown", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Header and Footer Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Image className="h-5 w-5 ml-2" />
            ظاهر و قالب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Image className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>نمایش لوگوی مدرسه</Label>
                <p className="text-sm text-muted-foreground">
                  نمایش لوگو در بالای کارنامه
                </p>
              </div>
            </div>
            <Switch
              checked={reportData.headerLogo}
              onCheckedChange={(checked) => handleChange("headerLogo", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>اطلاعات مدرسه</Label>
                <p className="text-sm text-muted-foreground">
                  نام، آدرس و اطلاعات تماس مدرسه
                </p>
              </div>
            </div>
            <Switch
              checked={reportData.schoolInfo}
              onCheckedChange={(checked) => handleChange("schoolInfo", checked)}
            />
          </div>

          <div>
            <Label htmlFor="custom-footer">پاورقی سفارشی</Label>
            <Textarea
              id="custom-footer"
              value={reportData.customFooter}
              onChange={(e) => handleChange("customFooter", e.target.value)}
              placeholder="متن دلخواه برای نمایش در پایین کارنامه"
              className="text-right"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Configuration Summary */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-sm">خلاصه تنظیمات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>
              <span className="font-medium">عنوان:</span>{" "}
              {reportData.reportTitle}
            </p>
            <p>
              <span className="font-medium">قالب:</span>{" "}
              {reportData.reportFormat === "detailed"
                ? "تفصیلی"
                : reportData.reportFormat === "summary"
                ? "خلاصه"
                : reportData.reportFormat === "minimal"
                ? "مینیمال"
                : "جدول آماری"}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {reportData.includeStatistics && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  آمار
                </span>
              )}
              {reportData.includeClassRanking && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  رتبه‌بندی
                </span>
              )}
              {reportData.includeTeacherComments && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  نظرات استاد
                </span>
              )}
              {reportData.showGradeBreakdown && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  تفکیک نمرات
                </span>
              )}
              {reportData.headerLogo && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  لوگو
                </span>
              )}
              {reportData.schoolInfo && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  اطلاعات مدرسه
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
