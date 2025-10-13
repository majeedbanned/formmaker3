"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  Calendar,
  ArrowRight,
  CheckCircle,
  Clock,
  Activity,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useSurveys } from "../../surveys/hooks/useSurveys";
import { useAuth } from "@/hooks/useAuth";
import { Survey } from "../../surveys/types/survey";

export default function SurveyWidget() {
  const { user, isLoading: userLoading } = useAuth();
  const { surveys, loading, error } = useSurveys();

  // Don't render surveys until user data is loaded to prevent flash of unauthorized content
  const isInitializing = userLoading || !user;

  // Filter surveys based on user type
  const availableSurveys = surveys.filter((survey) => {
    // If user is not loaded yet, return empty array
    if (!user) {
      return false;
    }
    
    if (user.userType === "student") {
      // Students see surveys they can participate in
      return survey.status === "active" && survey.canParticipate;
    } else if (user.userType === "teacher") {
      // Teachers see surveys they can participate in (not created by them)
      return (
        survey.status === "active" &&
        survey.creatorId !== user.id &&
        survey.canParticipate
      );
    }
    return false;
  });

  // Get recent surveys for display (max 4)
  const recentSurveys = availableSurveys.slice(0, 4);

  const getStatusBadge = (survey: Survey) => {
    if (survey.hasParticipated) {
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 ml-1" />
          شرکت کرده‌اید
        </Badge>
      );
    }
    if (!survey.isWithinDateRange) {
      return (
        <Badge className="bg-orange-50 text-orange-700 border-orange-200">
          <Clock className="h-3 w-3 ml-1" />
          خارج از زمان
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
        <Activity className="h-3 w-3 ml-1" />
        قابل شرکت
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fa-IR");
  };

  // Show loading state while user or surveys are loading
  if (loading || isInitializing) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-bold text-gray-800">
            <FileText className="h-5 w-5 ml-2 text-blue-600" />
            نظرسنجی‌های در دسترس
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-bold text-gray-800">
            <AlertCircle className="h-5 w-5 ml-2 text-red-600" />
            نظرسنجی‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-2">خطا در بارگذاری نظرسنجی‌ها</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safety check - this should never happen due to isInitializing check above
  if (!user) {
    return null;
  }

  if (recentSurveys.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg font-bold text-gray-800">
              <FileText className="h-5 w-5 ml-2 text-blue-600" />
              نظرسنجی‌های در دسترس
            </CardTitle>
            {user.userType !== "student" && (
              <Link href="/admin/surveys/create">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 ml-1" />
                  ایجاد نظرسنجی
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              نظرسنجی‌ای در دسترس نیست
            </h3>
            <p className="text-gray-600 mb-4">
              {user.userType === "student"
                ? "در حال حاضر نظرسنجی‌ای برای شما تعریف نشده است"
                : "نظرسنجی‌ای برای شرکت در دسترس نیست"}
            </p>
            <Link href="/admin/surveys">
              <Button variant="outline" size="sm">
                مشاهده همه نظرسنجی‌ها
                <ArrowRight className="h-4 w-4 mr-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg font-bold text-gray-800">
            <FileText className="h-5 w-5 ml-2 text-blue-600" />
            نظرسنجی‌های در دسترس
            <span className="mr-2 text-sm font-normal text-gray-500">
              ({availableSurveys.length})
            </span>
          </CardTitle>
          <Link href="/admin/surveys">
            <Button variant="outline" size="sm">
              مشاهده همه
              <ArrowRight className="h-4 w-4 mr-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentSurveys.map((survey) => (
          <div
            key={survey._id}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-gradient-to-r from-white to-blue-50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                  {survey.title}
                </h4>
                {survey.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {survey.description}
                  </p>
                )}
              </div>
              {getStatusBadge(survey)}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <div className="flex items-center space-x-4 space-x-reverse">
                <span className="flex items-center">
                  <FileText className="h-3 w-3 ml-1" />
                  {survey.questions.length} سوال
                </span>
                <span className="flex items-center">
                  <Users className="h-3 w-3 ml-1" />
                  {survey.creatorName}
                </span>
                {survey.endDate && (
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 ml-1" />
                    تا {formatDate(survey.endDate)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                ایجاد شده: {formatDate(survey.createdAt)}
              </div>
              <Link href={`/admin/surveys/answer/${survey._id}`}>
                <Button
                  size="sm"
                  disabled={!survey.canParticipate}
                  className={
                    survey.canParticipate
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs px-3 py-1"
                      : "bg-gray-400 text-gray-600 cursor-not-allowed text-xs px-3 py-1"
                  }
                >
                  {survey.hasParticipated
                    ? "شرکت کرده‌اید"
                    : survey.canParticipate
                    ? "شرکت در نظرسنجی"
                    : "غیرفعال"}
                  {survey.canParticipate && !survey.hasParticipated && (
                    <ArrowRight className="h-3 w-3 mr-1" />
                  )}
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {availableSurveys.length > 4 && (
          <div className="pt-2 border-t border-gray-200">
            <Link href="/admin/surveys">
              <Button variant="outline" className="w-full" size="sm">
                مشاهده {availableSurveys.length - 4} نظرسنجی دیگر
                <ArrowRight className="h-4 w-4 mr-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
