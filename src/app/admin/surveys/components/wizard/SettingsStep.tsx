"use client";

import React from "react";
import { Survey } from "../../types/survey";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Eye, UserX } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface SettingsStepProps {
  data: Partial<Survey>;
  onUpdate: (updates: Partial<Survey>) => void;
}

export default function SettingsStep({ data, onUpdate }: SettingsStepProps) {
  const handleDateChange = (
    field: "startDate" | "endDate",
    date: { toDate: () => Date } | null
  ) => {
    if (date) {
      onUpdate({ [field]: new Date(date.toDate()) });
    } else {
      onUpdate({ [field]: null });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">تنظیمات نظرسنجی</h3>
        <p className="text-sm text-gray-500">
          تنظیمات زمان‌بندی، دسترسی و نمایش نتایج را مشخص کنید
        </p>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Clock className="h-5 w-5" />
            <span>وضعیت نظرسنجی</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>وضعیت</Label>
            <Select
              value={data.status || "draft"}
              onValueChange={(value: "draft" | "active" | "closed") =>
                onUpdate({ status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">پیش‌نویس</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="closed">بسته شده</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              نظرسنجی‌های پیش‌نویس قابل مشاهده نیستند. فقط نظرسنجی‌های فعال قابل
              پاسخ‌دهی هستند.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Date Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Calendar className="h-5 w-5" />
            <span>زمان‌بندی</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاریخ شروع (اختیاری)</Label>
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={data.startDate ? new Date(data.startDate) : null}
                onChange={(date) => handleDateChange("startDate", date)}
                format="YYYY/MM/DD"
                placeholder="انتخاب تاریخ شروع"
                className="w-full"
                inputClass="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                containerStyle={{ width: "100%" }}
              />
              <p className="text-xs text-gray-500">
                اگر تعین نشود، نظرسنجی بلافاصله قابل دسترسی خواهد بود
              </p>
            </div>

            <div className="space-y-2">
              <Label>تاریخ پایان (اختیاری)</Label>
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={data.endDate ? new Date(data.endDate) : null}
                onChange={(date) => handleDateChange("endDate", date)}
                format="YYYY/MM/DD"
                placeholder="انتخاب تاریخ پایان"
                className="w-full"
                inputClass="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                containerStyle={{ width: "100%" }}
              />
              <p className="text-xs text-gray-500">
                اگر تعین نشود، نظرسنجی تا زمان بسته شدن دستی فعال خواهد بود
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <UserX className="h-5 w-5" />
            <span>تنظیمات حریم خصوصی</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="font-medium">پاسخ‌دهی ناشناس</div>
              <div className="text-sm text-gray-500">
                اگر فعال باشد، نام پاسخ‌دهندگان ثبت نخواهد شد
              </div>
            </div>
            <Switch
              checked={data.allowAnonymous || false}
              onCheckedChange={(checked) =>
                onUpdate({ allowAnonymous: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Eye className="h-5 w-5" />
            <span>نمایش نتایج</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="font-medium">نمایش نتایج برای شرکت‌کنندگان</div>
              <div className="text-sm text-gray-500">
                آیا شرکت‌کنندگان بتوانند نتایج کلی نظرسنجی را ببینند؟
              </div>
            </div>
            <Switch
              checked={data.showResults || false}
              onCheckedChange={(checked) => onUpdate({ showResults: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 نکات مهم</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• نظرسنجی‌های پیش‌نویس را می‌توانید بعداً ویرایش کنید</li>
          <li>• پس از فعال شدن نظرسنجی، تغییر سوالات محدود خواهد شد</li>
          <li>• پاسخ‌دهی ناشناس باعث افزایش صداقت پاسخ‌ها می‌شود</li>
        </ul>
      </div>
    </div>
  );
}
