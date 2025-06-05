"use client";

import React from "react";
import { Survey } from "../../types/survey";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  FileText,
  Users,
  Settings,
  Calendar,
  Eye,
  UserX,
} from "lucide-react";

interface ReviewStepProps {
  data: Partial<Survey>;
  onEdit: (stepIndex: number) => void;
}

export default function ReviewStep({ data, onEdit }: ReviewStepProps) {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "تعین نشده";
    const d = new Date(date);
    return d.toLocaleDateString("fa-IR");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">پیش‌نویس</Badge>;
      case "active":
        return <Badge variant="default">فعال</Badge>;
      case "closed":
        return <Badge variant="destructive">بسته شده</Badge>;
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">بررسی نهایی نظرسنجی</h3>
        <p className="text-sm text-gray-500">
          تمام اطلاعات را بررسی کنید و در صورت نیاز ویرایش کنید
        </p>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <FileText className="h-5 w-5" />
              <span>اطلاعات پایه</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(0)}
              className="flex items-center space-x-1 space-x-reverse"
            >
              <Edit className="h-4 w-4" />
              <span>ویرایش</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-medium text-gray-500">عنوان</div>
            <div className="text-lg font-medium">
              {data.title || "بدون عنوان"}
            </div>
          </div>
          {data.description && (
            <div>
              <div className="text-sm font-medium text-gray-500">توضیحات</div>
              <div className="text-gray-700">{data.description}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <FileText className="h-5 w-5" />
              <span>سوالات ({data.questions?.length || 0})</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(1)}
              className="flex items-center space-x-1 space-x-reverse"
            >
              <Edit className="h-4 w-4" />
              <span>ویرایش</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.questions && data.questions.length > 0 ? (
            <div className="space-y-3">
              {data.questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {index + 1}. {question.text}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        نوع:{" "}
                        {question.type === "text"
                          ? "متن آزاد"
                          : question.type === "radio"
                          ? "انتخاب یکی"
                          : question.type === "checkbox"
                          ? "انتخاب چندگانه"
                          : question.type === "rating"
                          ? "امتیازدهی"
                          : question.type}
                        {question.required && " • اجباری"}
                      </div>
                      {question.options && question.options.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          گزینه‌ها: {question.options.join("، ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              هیچ سوالی اضافه نشده
            </p>
          )}
        </CardContent>
      </Card>

      {/* Targeting */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Users className="h-5 w-5" />
              <span>هدف‌گذاری</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(2)}
              className="flex items-center space-x-1 space-x-reverse"
            >
              <Edit className="h-4 w-4" />
              <span>ویرایش</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-medium text-gray-500">
              کلاس‌های انتخاب شده
            </div>
            <div>{data.classTargets?.length || 0} کلاس</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              معلمان انتخاب شده
            </div>
            <div>{data.teacherTargets?.length || 0} معلم</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">
              مجموع مخاطبان
            </div>
            <div>
              {(data.classTargets?.length || 0) +
                (data.teacherTargets?.length || 0)}{" "}
              مورد
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Settings className="h-5 w-5" />
              <span>تنظیمات</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(3)}
              className="flex items-center space-x-1 space-x-reverse"
            >
              <Edit className="h-4 w-4" />
              <span>ویرایش</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">
                وضعیت
              </div>
              {getStatusBadge(data.status || "draft")}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">
                تاریخ شروع
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(data.startDate)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">
                تاریخ پایان
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(data.endDate)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">
                تنظیمات حریم خصوصی
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                <UserX className="h-4 w-4 text-gray-400" />
                <span>{data.allowAnonymous ? "ناشناس" : "با نام"}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">
                نمایش نتایج
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                <Eye className="h-4 w-4 text-gray-400" />
                <span>{data.showResults ? "قابل مشاهده" : "مخفی"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-medium text-green-900 mb-3">✅ خلاصه نظرسنجی</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {data.questions?.length || 0}
            </div>
            <div className="text-green-600">سوال</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {(data.classTargets?.length || 0) +
                (data.teacherTargets?.length || 0)}
            </div>
            <div className="text-green-600">مخاطب</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {data.status === "active" ? "فعال" : "غیرفعال"}
            </div>
            <div className="text-green-600">وضعیت</div>
          </div>
        </div>
        <div className="mt-4 text-center text-green-700">
          نظرسنجی شما آماده ایجاد است!
        </div>
      </div>
    </div>
  );
}
