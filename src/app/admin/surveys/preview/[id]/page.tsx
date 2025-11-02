"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Calendar,
  User,
  Star,
  Eye,
  AlertCircle,
} from "lucide-react";
import { useSurvey } from "../../hooks/useSurveys";
import { SurveyQuestion, SurveyOption } from "../../types/survey";

interface QuestionResponse {
  questionId: string | number;
  questionText: string;
  questionType: string;
  answer: unknown;
}

export default function SurveyPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const { survey, loading, error } = useSurvey(surveyId);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>(
    {}
  );
  const [hasStarted, setHasStarted] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">
            در حال بارگذاری نظرسنجی...
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

  const currentQuestion = survey.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;

  const handleResponseChange = (
    questionId: string | number,
    answer: unknown
  ) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        questionText: currentQuestion.text,
        questionType: currentQuestion.type,
        answer,
      },
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleFinishPreview = () => {
    router.push("/admin/surveys");
  };

  const normalizeOption = (option: string | SurveyOption): SurveyOption => {
    if (typeof option === "string") {
      return { caption: option, image: "", description: "" };
    }
    return option;
  };

  const getOptionValue = (option: string | SurveyOption): string => {
    return typeof option === "string" ? option : option.caption;
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const questionId = question.id || currentQuestionIndex;
    const currentResponse = responses[questionId]?.answer;

    switch (question.type) {
      case "text":
        return (
          <Textarea
            placeholder="پاسخ خود را بنویسید..."
            value={(currentResponse as string) || ""}
            onChange={(e) => handleResponseChange(questionId, e.target.value)}
            className="min-h-[120px]"
            dir="rtl"
          />
        );

      case "radio":
        return (
          <RadioGroup
            value={(currentResponse as string) || ""}
            onValueChange={(value) => handleResponseChange(questionId, value)}
            className="space-y-3"
          >
            {question.options?.map((option, index) => {
              const normalizedOption = normalizeOption(option);
              const optionValue = getOptionValue(option);
              
              return (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <RadioGroupItem
                      value={optionValue}
                      id={`radio-${questionId}-${index}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`radio-${questionId}-${index}`}
                        className="cursor-pointer block"
                      >
                        <div className="flex items-start gap-3">
                          {normalizedOption.image && (
                            <img
                              src={normalizedOption.image}
                              alt={normalizedOption.caption}
                              className="h-16 w-16 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{normalizedOption.caption}</div>
                            {normalizedOption.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {normalizedOption.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        );

      case "checkbox":
        const selectedOptions = (currentResponse as string[]) || [];
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const normalizedOption = normalizeOption(option);
              const optionValue = getOptionValue(option);
              
              return (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <Checkbox
                      id={`checkbox-${questionId}-${index}`}
                      checked={selectedOptions.includes(optionValue)}
                      onCheckedChange={(checked) => {
                        const newSelection = checked
                          ? [...selectedOptions, optionValue]
                          : selectedOptions.filter((item) => item !== optionValue);
                        handleResponseChange(questionId, newSelection);
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`checkbox-${questionId}-${index}`}
                        className="cursor-pointer block"
                      >
                        <div className="flex items-start gap-3">
                          {normalizedOption.image && (
                            <img
                              src={normalizedOption.image}
                              alt={normalizedOption.caption}
                              className="h-16 w-16 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{normalizedOption.caption}</div>
                            {normalizedOption.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {normalizedOption.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "rating":
        const maxRating = question.maxRating || 5;
        const rating = (currentResponse as number) || 0;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-1 space-x-reverse">
              {[...Array(maxRating)].map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleResponseChange(questionId, index + 1)}
                  className={`p-1 transition-colors ${
                    index < rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500">
              {rating > 0
                ? `امتیاز شما: ${rating} از ${maxRating}`
                : "روی ستاره‌ها کلیک کنید"}
            </p>
          </div>
        );

      default:
        return (
          <Input
            placeholder="پاسخ خود را بنویسید..."
            value={(currentResponse as string) || ""}
            onChange={(e) => handleResponseChange(questionId, e.target.value)}
            dir="rtl"
          />
        );
    }
  };

  if (!hasStarted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl" dir="rtl">
        {/* Preview Mode Banner */}
        <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-indigo-800">
              <Eye className="h-6 w-6" />
              <div>
                <h3 className="font-bold text-lg">حالت پیش‌نمایش</h3>
                <p className="text-sm text-indigo-600">
                  شما در حال مشاهده پیش‌نمایش نظرسنجی هستید. پاسخ‌ها ذخیره نخواهند شد.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">{survey.title}</CardTitle>
            {survey.description && (
              <p className="text-gray-600 mt-2">{survey.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2 space-x-reverse">
                <FileText className="h-4 w-4 text-gray-400" />
                <span>{survey.questions.length} سوال</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <User className="h-4 w-4 text-gray-400" />
                <span>{survey.allowAnonymous ? "ناشناس" : "با نام"}</span>
              </div>
              {survey.endDate && (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    مهلت: {new Date(survey.endDate).toLocaleDateString("fa-IR")}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                حالت پیش‌نمایش
              </h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• این پیش‌نمایش نظرسنجی است</li>
                <li>• پاسخ‌های شما ذخیره نمی‌شوند</li>
                <li>• می‌توانید عملکرد نظرسنجی را تست کنید</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => router.push("/admin/surveys")}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                بازگشت
              </Button>
              <Button 
                onClick={() => setHasStarted(true)} 
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                شروع پیش‌نمایش
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl" dir="rtl">
      {/* Preview Mode Banner */}
      <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-indigo-800">
              <Eye className="h-5 w-5" />
              <div>
                <h3 className="font-bold">حالت پیش‌نمایش</h3>
                <p className="text-xs text-indigo-600">
                  پاسخ‌ها ذخیره نخواهند شد
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/surveys")}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              خروج از پیش‌نمایش
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
          <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700">
            {currentQuestionIndex + 1} از {survey.questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-start space-x-2 space-x-reverse">
            <span className="text-lg">
              {currentQuestionIndex + 1}. {currentQuestion.text}
            </span>
            {currentQuestion.required && (
              <span className="text-red-500 text-sm">*</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderQuestion(currentQuestion)}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>قبلی</span>
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleFinishPreview}
                className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <AlertCircle className="h-4 w-4" />
                <span>پایان پیش‌نمایش</span>
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <span>بعدی</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        پیشرفت: {Math.round(progress)}% تکمیل شده
      </div>
    </div>
  );
}

