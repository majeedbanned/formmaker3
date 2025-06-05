"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BarChart3,
  FileText,
  Users,
  Calendar,
  Download,
} from "lucide-react";
import { useSurveyResponses } from "../../hooks/useSurveys";

export default function SurveyResponsesPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const { responses, survey, loading, error } = useSurveyResponses(surveyId);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">
            در حال بارگذاری پاسخ‌ها...
          </p>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">خطا در بارگذاری نظرسنجی</p>
          <p className="text-gray-500 mt-2">{error || "نظرسنجی یافت نشد"}</p>
          <Button
            onClick={() => router.push("/admin/surveys")}
            className="mt-4"
          >
            بازگشت به لیست نظرسنجی‌ها
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fa-IR");
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

  // Calculate response statistics
  const getQuestionStats = (questionIndex: number) => {
    const question = survey.questions[questionIndex];
    const questionResponses = responses
      .map((r) =>
        r.responses.find(
          (resp) => resp.questionId === (question.id || questionIndex)
        )
      )
      .filter(
        (
          resp
        ): resp is {
          questionId: string | number;
          questionText: string;
          questionType: string;
          answer: unknown;
        } => resp !== undefined
      );

    const stats: {
      totalResponses: number;
      responses: Array<{
        questionId: string | number;
        questionText: string;
        questionType: string;
        answer: unknown;
      }>;
      optionCounts?: Record<string, number>;
      averageRating?: number;
      ratingDistribution?: Record<number, number>;
    } = {
      totalResponses: questionResponses.length,
      responses: questionResponses,
    };

    if (question.type === "radio" || question.type === "checkbox") {
      const optionCounts: Record<string, number> = {};
      questionResponses.forEach((resp) => {
        if (Array.isArray(resp?.answer)) {
          resp.answer.forEach((option: string) => {
            optionCounts[option] = (optionCounts[option] || 0) + 1;
          });
        } else if (resp?.answer) {
          const option = resp.answer as string;
          optionCounts[option] = (optionCounts[option] || 0) + 1;
        }
      });
      stats.optionCounts = optionCounts;
    }

    if (question.type === "rating") {
      const ratings = questionResponses
        .map((resp) => resp?.answer as number)
        .filter((rating) => rating);
      stats.averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : 0;
      stats.ratingDistribution = {};
      ratings.forEach((rating) => {
        stats.ratingDistribution![rating] =
          (stats.ratingDistribution![rating] || 0) + 1;
      });
    }

    return stats;
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/surveys")}
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              بازگشت
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {survey.title}
              </h1>
              <p className="text-gray-600">{survey.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            {getStatusBadge(survey.status)}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 ml-2" />
              دانلود گزارش
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="mr-4">
                  <p className="text-2xl font-bold">{responses.length}</p>
                  <p className="text-gray-600">پاسخ دهنده</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="mr-4">
                  <p className="text-2xl font-bold">
                    {survey.questions.length}
                  </p>
                  <p className="text-gray-600">سوال</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div className="mr-4">
                  <p className="text-2xl font-bold">
                    {responses.length > 0
                      ? Math.round(
                          (responses.length /
                            ((survey.classTargets?.length || 0) +
                              (survey.teacherTargets?.length || 0))) *
                            100
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-gray-600">میزان مشارکت</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-500" />
                <div className="mr-4">
                  <p className="text-sm font-bold">
                    {formatDate(survey.createdAt)}
                  </p>
                  <p className="text-gray-600">تاریخ ایجاد</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Questions and Responses */}
      <div className="space-y-6">
        {survey.questions.map((question, index) => {
          const stats = getQuestionStats(index);

          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle>
                  {index + 1}. {question.text}
                  <Badge variant="outline" className="mr-2">
                    {stats.totalResponses} پاسخ
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {question.type === "text" && (
                  <div className="space-y-3">
                    {stats.responses.map((resp, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <p>{resp?.answer as string}</p>
                      </div>
                    ))}
                  </div>
                )}

                {(question.type === "radio" || question.type === "checkbox") &&
                  stats.optionCounts && (
                    <div className="space-y-3">
                      {question.options?.map((option) => {
                        const count = stats.optionCounts![option] || 0;
                        const percentage =
                          stats.totalResponses > 0
                            ? (count / stats.totalResponses) * 100
                            : 0;

                        return (
                          <div
                            key={option}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span>{option}</span>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="text-sm font-medium">
                                {count} ({Math.round(percentage)}%)
                              </span>
                              <div className="w-24 h-2 bg-gray-200 rounded-full">
                                <div
                                  className="h-2 bg-blue-500 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {question.type === "rating" &&
                  stats.averageRating !== undefined &&
                  stats.ratingDistribution && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {stats.averageRating.toFixed(1)}
                        </div>
                        <div className="text-gray-600">میانگین امتیاز</div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => {
                          const count = stats.ratingDistribution![rating] || 0;
                          const percentage =
                            stats.totalResponses > 0
                              ? (count / stats.totalResponses) * 100
                              : 0;

                          return (
                            <div key={rating} className="text-center">
                              <div className="text-sm font-medium">
                                {rating} ⭐
                              </div>
                              <div className="text-xs text-gray-600">
                                {count} ({Math.round(percentage)}%)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {responses.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            هنوز پاسخی دریافت نشده
          </h3>
          <p className="text-gray-500">
            صبر کنید تا افراد به نظرسنجی پاسخ دهند
          </p>
        </div>
      )}
    </div>
  );
}
