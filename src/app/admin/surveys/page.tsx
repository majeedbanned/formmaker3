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
      // Optionally redirect to edit the duplicated survey
      router.push(`/admin/surveys/edit/${duplicatedSurvey._id}`);
    } catch (error) {
      console.error("Duplicate survey error:", error);
      toast.error("خطا در کپی کردن نظرسنجی");
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

  const getParticipateButtonText = (survey: Survey) => {
    if (survey.hasParticipated) {
      return "شرکت کرده‌اید";
    }
    if (!survey.isWithinDateRange) {
      return "خارج از زمان";
    }
    return user?.userType === "student" ? "پاسخ دادن" : "شرکت در نظرسنجی";
  };

  const getParticipateButtonVariant = (survey: Survey) => {
    if (!survey.canParticipate) {
      return "secondary" as const;
    }
    return user?.userType === "student"
      ? ("default" as const)
      : ("default" as const);
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
            className="flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="h-4 w-4" />
            <span>ایجاد نظرسنجی جدید</span>
          </Button>
        )}
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
      {user?.userType === "teacher" ? (
        <div className="space-y-8">
          {/* Created Surveys Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 ml-2" />
              نظرسنجی‌های ایجاد شده توسط شما ({createdSurveys.length})
            </h2>
            {createdSurveys.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  هنوز نظرسنجی‌ای ایجاد نکرده‌اید
                </h3>
                <p className="text-gray-500 mb-4">
                  اولین نظرسنجی خود را برای کلاس‌هایتان ایجاد کنید
                </p>
                <Button onClick={handleCreateSurvey}>
                  <Plus className="h-4 w-4 ml-2" />
                  ایجاد نظرسنجی جدید
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {createdSurveys.map((survey) => (
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
                            {survey.hasParticipated && (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                شرکت کرده‌اید
                              </Badge>
                            )}
                            {!survey.isWithinDateRange && (
                              <Badge
                                variant="outline"
                                className="bg-orange-50 text-orange-700 border-orange-200"
                              >
                                خارج از زمان
                              </Badge>
                            )}
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
                                handleDuplicateSurvey(survey._id!, survey.title)
                              }
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
                            {(survey.classTargets?.length || 0) +
                              (survey.teacherTargets?.length || 0)}{" "}
                            مخاطب
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDuplicateSurvey(survey._id!, survey.title)
                          }
                          className="flex-1"
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
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 ml-2" />
                نظرسنجی‌های قابل شرکت ({participableSurveys.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {participableSurveys.map((survey) => (
                  <Card
                    key={survey._id}
                    className="hover:shadow-lg transition-shadow border-green-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">
                            {survey.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2 space-x-reverse mt-2">
                            {getStatusBadge(survey.status)}
                            {survey.hasParticipated && (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                شرکت کرده‌اید
                              </Badge>
                            )}
                            {!survey.isWithinDateRange && (
                              <Badge
                                variant="outline"
                                className="bg-orange-50 text-orange-700 border-orange-200"
                              >
                                خارج از زمان
                              </Badge>
                            )}
                          </div>
                        </div>
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
                          <User className="h-4 w-4 text-gray-400" />
                          <span>توسط: {survey.creatorName}</span>
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

                      <div className="pt-2">
                        <Button
                          onClick={() =>
                            router.push(`/admin/surveys/answer/${survey._id}`)
                          }
                          disabled={!survey.canParticipate}
                          variant={getParticipateButtonVariant(survey)}
                          className={
                            survey.canParticipate
                              ? "w-full bg-blue-600 hover:bg-blue-700"
                              : "w-full bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                          }
                          size="sm"
                        >
                          <User className="h-4 w-4 ml-1" />
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
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              نظرسنجی‌ای در دسترس نیست
            </h3>
            <p className="text-gray-500 mb-6">
              در حال حاضر نظرسنجی‌ای برای کلاس شما تعریف نشده است
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSurveys.map((survey) => (
              <Card
                key={survey._id}
                className="hover:shadow-lg transition-shadow border-blue-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {survey.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 space-x-reverse mt-2">
                        {getStatusBadge(survey.status)}
                        {survey.hasParticipated && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            شرکت کرده‌اید
                          </Badge>
                        )}
                        {!survey.isWithinDateRange && (
                          <Badge
                            variant="outline"
                            className="bg-orange-50 text-orange-700 border-orange-200"
                          >
                            خارج از زمان
                          </Badge>
                        )}
                      </div>
                    </div>
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
                      <User className="h-4 w-4 text-gray-400" />
                      <span>توسط: {survey.creatorName}</span>
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

                  <div className="pt-2">
                    <Button
                      onClick={() =>
                        router.push(`/admin/surveys/answer/${survey._id}`)
                      }
                      disabled={!survey.canParticipate}
                      variant={getParticipateButtonVariant(survey)}
                      className={
                        survey.canParticipate
                          ? "w-full bg-blue-600 hover:bg-blue-700"
                          : "w-full bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                      }
                      size="sm"
                    >
                      <User className="h-4 w-4 ml-1" />
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
                      {survey.hasParticipated && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          شرکت کرده‌اید
                        </Badge>
                      )}
                      {!survey.isWithinDateRange && (
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-700 border-orange-200"
                        >
                          خارج از زمان
                        </Badge>
                      )}
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
                          handleDuplicateSurvey(survey._id!, survey.title)
                        }
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
                      {(survey.classTargets?.length || 0) +
                        (survey.teacherTargets?.length || 0)}{" "}
                      مخاطب
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDuplicateSurvey(survey._id!, survey.title)
                    }
                    className="flex-1"
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
  );
}
