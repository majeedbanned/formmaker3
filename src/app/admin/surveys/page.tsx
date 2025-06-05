"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Calendar,
  Users,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSurveys } from "./hooks/useSurveys";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SurveysPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { surveys, loading, error, deleteSurvey } = useSurveys();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSurveys = surveys.filter(
    (survey) =>
      survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSurvey = () => {
    router.push("/admin/surveys/create");
  };

  const handleEditSurvey = (surveyId: string) => {
    router.push(`/admin/surveys/edit/${surveyId}`);
  };

  const handleViewResponses = (surveyId: string) => {
    router.push(`/admin/surveys/responses/${surveyId}`);
  };

  const handleDeleteSurvey = async (surveyId: string, title: string) => {
    if (window.confirm(`آیا از حذف نظرسنجی "${title}" اطمینان دارید؟`)) {
      try {
        await deleteSurvey(surveyId);
        toast.success("نظرسنجی با موفقیت حذف شد");
      } catch (error) {
        console.error("Delete survey error:", error);
        toast.error("خطا در حذف نظرسنجی");
      }
    }
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fa-IR");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">خطا در بارگذاری نظرسنجی‌ها</p>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">نظرسنجی‌ها</h1>
          <p className="text-gray-600 mt-2">
            {user?.userType === "teacher"
              ? "نظرسنجی‌های خود را مدیریت کنید"
              : "نظرسنجی‌های مدرسه را مدیریت کنید"}
          </p>
        </div>
        <Button
          onClick={handleCreateSurvey}
          className="flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="h-4 w-4" />
          <span>ایجاد نظرسنجی جدید</span>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="جستجو در نظرسنجی‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
            dir="rtl"
          />
        </div>
      </div>

      {/* Surveys Grid */}
      {filteredSurveys.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchTerm
              ? "نظرسنجی‌ای یافت نشد"
              : "هنوز نظرسنجی‌ای ایجاد نکرده‌اید"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? "عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید"
              : "اولین نظرسنجی خود را ایجاد کنید و نظرات مخاطبان را جمع‌آوری کنید"}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateSurvey}>
              <Plus className="h-4 w-4 ml-2" />
              ایجاد اولین نظرسنجی
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSurveys.map((survey) => (
            <Card
              key={survey._id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {survey.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 space-x-reverse mt-2">
                      {getStatusBadge(survey.status)}
                      <span className="text-xs text-gray-500">
                        {formatDate(survey.createdAt)}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewResponses(survey._id!)}
                      >
                        <BarChart3 className="h-4 w-4 ml-2" />
                        مشاهده پاسخ‌ها
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditSurvey(survey._id!)}
                      >
                        <Edit className="h-4 w-4 ml-2" />
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleDeleteSurvey(survey._id!, survey.title)
                        }
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {survey.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {survey.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>{survey.questions.length} سوال</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{survey.responseCount} پاسخ</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span>
                      {survey.targetType === "classes" ? "کلاس‌ها" : "معلمان"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      {survey.endDate
                        ? formatDate(survey.endDate)
                        : "بدون مهلت"}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 space-x-reverse pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewResponses(survey._id!)}
                    className="flex-1"
                  >
                    <BarChart3 className="h-4 w-4 ml-1" />
                    پاسخ‌ها
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSurvey(survey._id!)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 ml-1" />
                    ویرایش
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
