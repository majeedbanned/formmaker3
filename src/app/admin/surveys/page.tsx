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
  User,
  Copy,
  AlertCircle,
  Activity,
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
import { Survey } from "./types/survey";

export default function SurveysPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { surveys, loading, error, deleteSurvey, duplicateSurvey } =
    useSurveys();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSurveys = surveys.filter(
    (survey) =>
      survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // For teachers, separate created surveys from participable surveys
  const createdSurveys =
    user?.userType === "teacher"
      ? filteredSurveys.filter((survey) => survey.creatorId === user.id)
      : filteredSurveys;

  const participableSurveys =
    user?.userType === "teacher"
      ? filteredSurveys.filter(
          (survey) => survey.creatorId !== user.id && survey.status === "active"
        )
      : [];

  const handleCreateSurvey = () => {
    router.push("/admin/surveys/create");
  };

  const handleEditSurvey = (surveyId: string) => {
    router.push(`/admin/surveys/edit/${surveyId}`);
  };

  const handleViewResponses = (surveyId: string) => {
    if (user?.userType === "student") {
      router.push(`/admin/surveys/answer/${surveyId}`);
    } else {
      router.push(`/admin/surveys/responses/${surveyId}`);
    }
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

  const handleDuplicateSurvey = async (surveyId: string, title: string) => {
    try {
      const duplicatedSurvey = await duplicateSurvey(surveyId);
      toast.success(`نظرسنجی "${title}" با موفقیت کپی شد`);
      router.push(`/admin/surveys/edit/${duplicatedSurvey._id}`);
    } catch (error) {
      console.error("Duplicate survey error:", error);
      toast.error("خطا در کپی کردن نظرسنجی");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <Edit className="h-3 w-3 ml-1" />
            پیش‌نویس
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <Activity className="h-3 w-3 ml-1" />
            فعال
          </Badge>
        );
      case "closed":
        return (
          <Badge
            variant="destructive"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <AlertCircle className="h-3 w-3 ml-1" />
            بسته شده
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-50 text-gray-700">
            نامشخص
          </Badge>
        );
    }
  };

  const getParticipateButtonText = (survey: Survey) => {
    if (survey.hasParticipated) {
      return "شرکت کرده‌اید";
    }
    if (!survey.isWithinDateRange) {
      return "خارج از زمان";
    }
    return user?.userType === "student" ? "پاسخ دادن" : "شرکت در نظرسنجی";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-xl font-medium text-gray-700">
              در حال بارگذاری نظرسنجی‌ها...
            </p>
            <p className="text-sm text-gray-500 mt-2">لطفاً صبر کنید</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="flex h-screen items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              خطا در بارگذاری
            </h2>
            <p className="text-lg text-red-600 mb-2">
              نظرسنجی‌ها بارگذاری نشدند
            </p>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              تلاش مجدد
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="container mx-auto px-4 py-8" dir="rtl">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                نظرسنجی‌ها
              </h1>
              <p className="text-lg text-gray-600">
                {user?.userType === "student"
                  ? "نظرسنجی‌های در دسترس برای شما"
                  : user?.userType === "teacher"
                  ? "نظرسنجی‌های خود را مدیریت کنید"
                  : "نظرسنجی‌های مدرسه را مدیریت کنید"}
              </p>
            </div>
            {user?.userType !== "student" && (
              <Button
                onClick={handleCreateSurvey}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
                size="lg"
              >
                <Plus className="h-5 w-5 ml-2" />
                ایجاد نظرسنجی جدید
              </Button>
            )}
          </div>

          {/* Enhanced Search */}
          <div className="mb-6">
            <div className="relative max-w-lg">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="جستجو در نظرسنجی‌ها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-12 pl-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl shadow-sm"
                dir="rtl"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      کل نظرسنجی‌ها
                    </p>
                    <p className="text-3xl font-bold">
                      {filteredSurveys.length}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">
                      نظرسنجی‌های فعال
                    </p>
                    <p className="text-3xl font-bold">
                      {
                        filteredSurveys.filter((s) => s.status === "active")
                          .length
                      }
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      کل پاسخ‌ها
                    </p>
                    <p className="text-3xl font-bold">
                      {filteredSurveys.reduce(
                        (sum, s) => sum + (s.responseCount || 0),
                        0
                      )}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Surveys Grid */}
        {user?.userType === "teacher" ? (
          <div className="space-y-12">
            {/* Created Surveys Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full ml-3"></div>
                  نظرسنجی‌های ایجاد شده توسط شما
                  <span className="mr-3 text-sm font-normal text-gray-500">
                    ({createdSurveys.length} نظرسنجی)
                  </span>
                </h2>
              </div>

              {createdSurveys.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-300">
                  <CardContent className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-12 w-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      هنوز نظرسنجی‌ای ایجاد نکرده‌اید
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      اولین نظرسنجی خود را برای کلاس‌هایتان ایجاد کنید و نظرات
                      دانش‌آموزان را جمع‌آوری کنید
                    </p>
                    <Button
                      onClick={handleCreateSurvey}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 ml-2" />
                      ایجاد اولین نظرسنجی
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {createdSurveys.map((survey) => (
                    <Card
                      key={survey._id}
                      className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white hover:-translate-y-1"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 mb-3">
                              {survey.title}
                            </CardTitle>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {getStatusBadge(survey.status)}
                              {survey.hasParticipated && (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  <User className="h-3 w-3 ml-1" />
                                  شرکت کرده‌اید
                                </Badge>
                              )}
                              {!survey.isWithinDateRange && (
                                <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                                  <Calendar className="h-3 w-3 ml-1" />
                                  خارج از زمان
                                </Badge>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleViewResponses(survey._id!)}
                                className="text-blue-600"
                              >
                                <BarChart3 className="h-4 w-4 ml-2" />
                                مشاهده پاسخ‌ها
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditSurvey(survey._id!)}
                                className="text-green-600"
                              >
                                <Edit className="h-4 w-4 ml-2" />
                                ویرایش
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDuplicateSurvey(
                                    survey._id!,
                                    survey.title
                                  )
                                }
                                className="text-purple-600"
                              >
                                <Copy className="h-4 w-4 ml-2" />
                                کپی کردن
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
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {survey.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <FileText className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                            <p className="text-sm font-medium text-blue-700">
                              {survey.questions.length}
                            </p>
                            <p className="text-xs text-blue-600">سوال</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
                            <p className="text-sm font-medium text-green-700">
                              {survey.responseCount}
                            </p>
                            <p className="text-xs text-green-600">پاسخ</p>
                          </div>
                        </div>

                        <div className="flex space-x-2 space-x-reverse pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResponses(survey._id!)}
                            className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <BarChart3 className="h-4 w-4 ml-1" />
                            پاسخ‌ها
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSurvey(survey._id!)}
                            className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4 ml-1" />
                            ویرایش
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDuplicateSurvey(survey._id!, survey.title)
                            }
                            className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            <Copy className="h-4 w-4 ml-1" />
                            کپی
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Participable Surveys Section */}
            {participableSurveys.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full ml-3"></div>
                    نظرسنجی‌های قابل شرکت
                    <span className="mr-3 text-sm font-normal text-gray-500">
                      ({participableSurveys.length} نظرسنجی)
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {participableSurveys.map((survey) => (
                    <Card
                      key={survey._id}
                      className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:-translate-y-1"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 mb-3">
                              {survey.title}
                            </CardTitle>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {getStatusBadge(survey.status)}
                              {survey.hasParticipated && (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                                  <User className="h-3 w-3 ml-1" />
                                  شرکت کرده‌اید
                                </Badge>
                              )}
                              {!survey.isWithinDateRange && (
                                <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                  <Calendar className="h-3 w-3 ml-1" />
                                  خارج از زمان
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {survey.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {survey.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/70 rounded-lg p-3 text-center">
                            <FileText className="h-5 w-5 text-green-600 mx-auto mb-1" />
                            <p className="text-sm font-medium text-green-700">
                              {survey.questions.length}
                            </p>
                            <p className="text-xs text-green-600">سوال</p>
                          </div>
                          <div className="bg-white/70 rounded-lg p-3 text-center">
                            <User className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {survey.creatorName}
                            </p>
                            <p className="text-xs text-gray-600">سازنده</p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button
                            onClick={() =>
                              router.push(`/admin/surveys/answer/${survey._id}`)
                            }
                            disabled={!survey.canParticipate}
                            className={
                              survey.canParticipate
                                ? "w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                                : "w-full bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-gray-600"
                            }
                            size="lg"
                          >
                            <User className="h-4 w-4 ml-2" />
                            {getParticipateButtonText(survey)}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : user?.userType === "student" ? (
          // Student view - only participable surveys
          filteredSurveys.length === 0 ? (
            <Card className="border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors duration-300">
              <CardContent className="text-center py-20">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <FileText className="h-16 w-16 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  نظرسنجی‌ای در دسترس نیست
                </h3>
                <p className="text-gray-600 mb-6 max-w-lg mx-auto text-lg">
                  در حال حاضر نظرسنجی‌ای برای کلاس شما تعریف نشده است. از معلمان
                  خود بخواهید تا نظرسنجی‌های جدید ایجاد کنند.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSurveys.map((survey) => (
                <Card
                  key={survey._id}
                  className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:-translate-y-1"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 mb-3">
                          {survey.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getStatusBadge(survey.status)}
                          {survey.hasParticipated && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                              <User className="h-3 w-3 ml-1" />
                              شرکت کرده‌اید
                            </Badge>
                          )}
                          {!survey.isWithinDateRange && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                              <Calendar className="h-3 w-3 ml-1" />
                              خارج از زمان
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {survey.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {survey.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/70 rounded-lg p-3 text-center">
                        <FileText className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-blue-700">
                          {survey.questions.length}
                        </p>
                        <p className="text-xs text-blue-600">سوال</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 text-center">
                        <User className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {survey.creatorName}
                        </p>
                        <p className="text-xs text-gray-600">معلم</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={() =>
                          router.push(`/admin/surveys/answer/${survey._id}`)
                        }
                        disabled={!survey.canParticipate}
                        className={
                          survey.canParticipate
                            ? "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                            : "w-full bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-gray-600"
                        }
                        size="lg"
                      >
                        <User className="h-4 w-4 ml-2" />
                        {getParticipateButtonText(survey)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : // School admin view - all surveys with full management
        filteredSurveys.length === 0 ? (
          <Card className="border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors duration-300">
            <CardContent className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <FileText className="h-16 w-16 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {searchTerm
                  ? "نظرسنجی‌ای یافت نشد"
                  : "هنوز نظرسنجی‌ای ایجاد نکرده‌اید"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto text-lg">
                {searchTerm
                  ? "عبارت جستجو را تغییر دهید یا فیلترها را پاک کنید"
                  : "اولین نظرسنجی مدرسه را ایجاد کنید و نظرات معلمان و دانش‌آموزان را جمع‌آوری کنید"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleCreateSurvey}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                  size="lg"
                >
                  <Plus className="h-5 w-5 ml-2" />
                  ایجاد اولین نظرسنجی
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSurveys.map((survey) => (
              <Card
                key={survey._id}
                className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white hover:-translate-y-1"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 mb-3">
                        {survey.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getStatusBadge(survey.status)}
                        {survey.hasParticipated && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <User className="h-3 w-3 ml-1" />
                            شرکت کرده‌اید
                          </Badge>
                        )}
                        {!survey.isWithinDateRange && (
                          <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                            <Calendar className="h-3 w-3 ml-1" />
                            خارج از زمان
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleViewResponses(survey._id!)}
                          className="text-blue-600"
                        >
                          <BarChart3 className="h-4 w-4 ml-2" />
                          مشاهده پاسخ‌ها
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditSurvey(survey._id!)}
                          className="text-green-600"
                        >
                          <Edit className="h-4 w-4 ml-2" />
                          ویرایش
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDuplicateSurvey(survey._id!, survey.title)
                          }
                          className="text-purple-600"
                        >
                          <Copy className="h-4 w-4 ml-2" />
                          کپی کردن
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
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {survey.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <FileText className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-blue-700">
                        {survey.questions.length}
                      </p>
                      <p className="text-xs text-blue-600">سوال</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <Users className="h-4 w-4 text-green-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-green-700">
                        {survey.responseCount}
                      </p>
                      <p className="text-xs text-green-600">پاسخ</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <Eye className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-purple-700">
                        {(survey.classTargets?.length || 0) +
                          (survey.teacherTargets?.length || 0)}
                      </p>
                      <p className="text-xs text-purple-600">مخاطب</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 space-x-reverse pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResponses(survey._id!)}
                      className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <BarChart3 className="h-4 w-4 ml-1" />
                      پاسخ‌ها
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSurvey(survey._id!)}
                      className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      ویرایش
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDuplicateSurvey(survey._id!, survey.title)
                      }
                      className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      <Copy className="h-4 w-4 ml-1" />
                      کپی
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
