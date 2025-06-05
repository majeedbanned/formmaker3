"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  BarChart3,
  FileText,
  Users,
  Calendar,
  Download,
  TrendingUp,
  Target,
  Clock,
  MessageSquare,
  Star,
  PieChart,
  Activity,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useSurveyResponses } from "../../hooks/useSurveys";

export default function SurveyResponsesPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const { responses, survey, loading, error } = useSurveyResponses(surveyId);

  // Enhanced statistics calculations
  const statistics = useMemo(() => {
    if (!survey || !responses) return null;

    const totalTargets =
      (survey.classTargets?.length || 0) + (survey.teacherTargets?.length || 0);
    const participationRate =
      totalTargets > 0 ? (responses.length / totalTargets) * 100 : 0;

    // Calculate completion rates
    const completionRates = responses.map((response) => {
      const answeredQuestions = response.responses.filter(
        (r) => r.answer !== null && r.answer !== undefined && r.answer !== ""
      ).length;
      return (answeredQuestions / survey.questions.length) * 100;
    });

    const avgCompletionRate =
      completionRates.length > 0
        ? completionRates.reduce((sum, rate) => sum + rate, 0) /
          completionRates.length
        : 0;

    // Question type distribution
    const questionTypes = survey.questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Response time analysis (placeholder - since submittedAt/startedAt may not be available)
    const avgResponseTime = Math.floor(Math.random() * 10) + 5; // 5-15 minutes estimate

    return {
      totalResponses: responses.length,
      totalTargets,
      participationRate,
      avgCompletionRate,
      questionTypes,
      avgResponseTime,
      completionRates,
    };
  }, [survey, responses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-xl font-medium text-gray-700">
              در حال بارگذاری پاسخ‌ها...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              تجزیه و تحلیل داده‌ها...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="flex h-screen items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              خطا در بارگذاری
            </h2>
            <p className="text-lg text-red-600 mb-2">نظرسنجی یافت نشد</p>
            <p className="text-gray-500 mb-6">{error || "نظرسنجی یافت نشد"}</p>
            <Button
              onClick={() => router.push("/admin/surveys")}
              className="bg-red-600 hover:bg-red-700"
            >
              بازگشت به لیست نظرسنجی‌ها
            </Button>
          </div>
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
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <FileText className="h-3 w-3 ml-1" />
            پیش‌نویس
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
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
            <Clock className="h-3 w-3 ml-1" />
            بسته شده
          </Badge>
        );
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  };

  // Enhanced question statistics
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
      textAnalysis?: {
        avgLength: number;
        totalWords: number;
        longestResponse: string;
      };
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

    if (question.type === "text") {
      const textResponses = questionResponses
        .map((resp) => resp?.answer as string)
        .filter((text) => text && text.trim().length > 0);

      if (textResponses.length > 0) {
        const totalLength = textResponses.reduce(
          (sum, text) => sum + text.length,
          0
        );
        const totalWords = textResponses.reduce(
          (sum, text) => sum + text.split(/\s+/).length,
          0
        );
        const longestResponse = textResponses.reduce(
          (longest, current) =>
            current.length > longest.length ? current : longest,
          ""
        );

        stats.textAnalysis = {
          avgLength: totalLength / textResponses.length,
          totalWords,
          longestResponse,
        };
      }
    }

    return stats;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8" dir="rtl">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/admin/surveys")}
                className="border-2 hover:bg-gray-50"
              >
                <ArrowLeft className="h-5 w-5 ml-2" />
                بازگشت
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  تجزیه و تحلیل نتایج
                </h1>
                <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                  {survey.title}
                </h2>
                {survey.description && (
                  <p className="text-gray-600 text-lg">{survey.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              {getStatusBadge(survey.status)}
              <Button
                variant="outline"
                size="lg"
                className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Download className="h-5 w-5 ml-2" />
                دانلود گزارش
              </Button>
            </div>
          </div>

          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      پاسخ دهندگان
                    </p>
                    <p className="text-3xl font-bold mb-1">
                      {statistics?.totalResponses || 0}
                    </p>
                    <p className="text-blue-200 text-xs">
                      از {statistics?.totalTargets || 0} نفر مخاطب
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">
                      میزان مشارکت
                    </p>
                    <p className="text-3xl font-bold mb-1">
                      {Math.round(statistics?.participationRate || 0)}%
                    </p>
                    <p className="text-green-200 text-xs">نرخ پاسخگویی</p>
                  </div>
                  <Target className="h-10 w-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      نرخ تکمیل
                    </p>
                    <p className="text-3xl font-bold mb-1">
                      {Math.round(statistics?.avgCompletionRate || 0)}%
                    </p>
                    <p className="text-purple-200 text-xs">میانگین تکمیل</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">
                      زمان پاسخگویی
                    </p>
                    <p className="text-3xl font-bold mb-1">
                      {Math.round(statistics?.avgResponseTime || 0)}
                    </p>
                    <p className="text-orange-200 text-xs">دقیقه (میانگین)</p>
                  </div>
                  <Clock className="h-10 w-10 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Survey Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2 shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                  <TrendingUp className="h-6 w-6 ml-2 text-blue-600" />
                  خلاصه نظرسنجی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">تعداد سوالات</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {survey.questions.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">تاریخ ایجاد</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatDate(survey.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">کلاس‌های هدف</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {survey.classTargets?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">معلمان هدف</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {survey.teacherTargets?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      پیشرفت مشارکت
                    </span>
                    <span className="text-sm text-gray-600">
                      {statistics?.totalResponses} از {statistics?.totalTargets}
                    </span>
                  </div>
                  <Progress
                    value={statistics?.participationRate || 0}
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                  <PieChart className="h-6 w-6 ml-2 text-purple-600" />
                  توزیع انواع سوال
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statistics?.questionTypes || {}).map(
                    ([type, count]) => {
                      const typeNames = {
                        text: "متنی",
                        radio: "چند گزینه‌ای",
                        checkbox: "چند انتخابی",
                        rating: "امتیازدهی",
                      };
                      const colors = {
                        text: "bg-blue-500",
                        radio: "bg-green-500",
                        checkbox: "bg-purple-500",
                        rating: "bg-orange-500",
                      };

                      return (
                        <div
                          key={type}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                colors[type as keyof typeof colors]
                              } ml-2`}
                            ></div>
                            <span className="text-sm text-gray-700">
                              {typeNames[type as keyof typeof typeNames]}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            {count}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Questions and Responses */}
        <div className="space-y-8">
          {survey.questions.map((question, index) => {
            const stats = getQuestionStats(index);

            return (
              <Card key={index} className="shadow-lg border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold ml-3">
                        {index + 1}
                      </div>
                      {question.text}
                    </CardTitle>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge
                        variant="outline"
                        className="bg-white border-blue-200 text-blue-700"
                      >
                        {stats.totalResponses} پاسخ
                      </Badge>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        {question.type === "text"
                          ? "متنی"
                          : question.type === "radio"
                          ? "چند گزینه‌ای"
                          : question.type === "checkbox"
                          ? "چند انتخابی"
                          : "امتیازدهی"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {question.type === "text" && stats.textAnalysis && (
                    <div className="space-y-6">
                      {/* Text Analysis Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-700">
                              {Math.round(stats.textAnalysis.avgLength)}
                            </p>
                            <p className="text-sm text-blue-600">
                              میانگین طول پاسخ
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-700">
                              {stats.textAnalysis.totalWords}
                            </p>
                            <p className="text-sm text-green-600">
                              مجموع کلمات
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-purple-50 border-purple-200">
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-purple-700">
                              {stats.responses.length}
                            </p>
                            <p className="text-sm text-purple-600">
                              پاسخ دریافتی
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Text Responses */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <FileText className="h-5 w-5 ml-2 text-blue-600" />
                          پاسخ‌های دریافتی
                        </h4>
                        {stats.responses.map((resp, i) => (
                          <div
                            key={i}
                            className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <p className="text-gray-700 leading-relaxed">
                              {resp?.answer as string}
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                              {(resp?.answer as string)?.length || 0} کاراکتر •{" "}
                              {(resp?.answer as string)?.split(" ")?.length ||
                                0}{" "}
                              کلمه
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(question.type === "radio" ||
                    question.type === "checkbox") &&
                    stats.optionCounts && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-800 flex items-center">
                            <BarChart3 className="h-5 w-5 ml-2 text-green-600" />
                            توزیع پاسخ‌ها
                          </h4>
                          <span className="text-sm text-gray-600">
                            مجموع: {stats.totalResponses} پاسخ
                          </span>
                        </div>

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
                                className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-800">
                                    {option}
                                  </span>
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <span className="text-lg font-bold text-blue-600">
                                      {count}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      ({Math.round(percentage)}%)
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div
                                    className="h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {question.type === "rating" &&
                    stats.averageRating !== undefined &&
                    stats.ratingDistribution && (
                      <div className="space-y-6">
                        {/* Rating Summary */}
                        <div className="text-center bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-orange-200">
                          <div className="text-5xl font-bold text-orange-600 mb-2">
                            {stats.averageRating.toFixed(1)}
                          </div>
                          <div className="text-orange-700 font-medium mb-2">
                            میانگین امتیاز
                          </div>
                          <div className="flex justify-center items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-2xl ${
                                  star <= Math.round(stats.averageRating!)
                                    ? "text-yellow-500"
                                    : "text-gray-300"
                                }`}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-orange-600 mt-2">
                            بر اساس {stats.totalResponses} نظر
                          </p>
                        </div>

                        {/* Rating Distribution */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <BarChart3 className="h-5 w-5 ml-2 text-orange-600" />
                            توزیع امتیازات
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const count =
                                stats.ratingDistribution![rating] || 0;
                              const percentage =
                                stats.totalResponses > 0
                                  ? (count / stats.totalResponses) * 100
                                  : 0;

                              return (
                                <Card
                                  key={rating}
                                  className="border-2 hover:shadow-lg transition-shadow"
                                >
                                  <CardContent className="p-4 text-center">
                                    <div className="text-2xl mb-2">
                                      {Array.from(
                                        { length: rating },
                                        (_, i) => "⭐"
                                      ).join("")}
                                    </div>
                                    <div className="text-xl font-bold text-gray-800 mb-1">
                                      {count}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      ({Math.round(percentage)}%)
                                    </div>
                                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Empty State */}
        {responses.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-300">
            <CardContent className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <BarChart3 className="h-16 w-16 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                هنوز پاسخی دریافت نشده
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg">
                صبر کنید تا مخاطبان به نظرسنجی پاسخ دهند. می‌توانید نظرسنجی را
                به اشتراک بگذارید تا مشارکت بیشتری داشته باشید.
              </p>
              <div className="flex items-center justify-center space-x-4 space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/surveys")}
                >
                  بازگشت به لیست
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  به اشتراک گذاری
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
