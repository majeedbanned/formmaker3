"use client";

import React, { useState, useEffect } from "react";
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
  Send,
  FileText,
  Calendar,
  User,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSurvey } from "../../hooks/useSurveys";
import { SurveyQuestion } from "../../types/survey";
import { toast } from "sonner";

interface QuestionResponse {
  questionId: string | number;
  questionText: string;
  questionType: string;
  answer: unknown;
}

export default function SurveyAnswerPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const surveyId = params.id as string;

  const { survey, loading, error } = useSurvey(surveyId);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Check if user has access to this survey
  useEffect(() => {
    if (survey && user) {
      // For students, check if the survey targets their classes or them directly
      if (user.userType === "student") {
        const userClasses =
          (user as { classCode?: { value: string }[] })?.classCode?.map(
            (c: { value: string }) => c.value
          ) || [];

        const hasClassAccess = survey.classTargets?.some((classCode: string) =>
          userClasses.includes(classCode)
        );

        const hasDirectAccess = survey.teacherTargets?.includes(
          user.username || ""
        );

        if (!hasClassAccess && !hasDirectAccess) {
          toast.error("شما دسترسی به این نظرسنجی ندارید");
          router.push("/admin/surveys");
          return;
        }
      }

      // For teachers, check if the survey targets their classes or them directly
      if (user.userType === "teacher") {
        const userClasses =
          (user as { classCode?: { value: string }[] })?.classCode?.map(
            (c: { value: string }) => c.value
          ) || [];

        const hasClassAccess = survey.classTargets?.some((classCode: string) =>
          userClasses.includes(classCode)
        );

        const hasDirectAccess = survey.teacherTargets?.includes(
          user.username || ""
        );

        // Teachers can participate in surveys that target their classes or them directly
        if (!hasClassAccess && !hasDirectAccess) {
          toast.error("شما دسترسی به این نظرسنجی ندارید");
          router.push("/admin/surveys");
          return;
        }
      }

      // Check if survey is active
      if (survey.status !== "active") {
        toast.error("این نظرسنجی فعال نیست");
        router.push("/admin/surveys");
        return;
      }
    }
  }, [survey, user, router]);

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
    if (
      currentQuestion.required &&
      !responses[currentQuestion.id || currentQuestionIndex]
    ) {
      toast.error("لطفاً به این سوال پاسخ دهید");
      return;
    }

    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Check required questions
    const unansweredRequired = survey.questions.filter(
      (question, index) => question.required && !responses[question.id || index]
    );

    if (unansweredRequired.length > 0) {
      toast.error("لطفاً به تمام سوالات اجباری پاسخ دهید");
      return;
    }

    setIsSubmitting(true);
    try {
      const responseData = {
        surveyId,
        responses: Object.values(responses),
        schoolCode: user?.schoolCode,
      };

      const response = await fetch("/api/surveys/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify(responseData),
      });

      if (response.ok) {
        toast.success("پاسخ شما با موفقیت ثبت شد");
        router.push("/admin/surveys");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در ثبت پاسخ");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("خطا در ارسال پاسخ");
    } finally {
      setIsSubmitting(false);
    }
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
            {question.options?.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <RadioGroupItem
                  value={option}
                  id={`radio-${questionId}-${index}`}
                />
                <Label
                  htmlFor={`radio-${questionId}-${index}`}
                  className="cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        const selectedOptions = (currentResponse as string[]) || [];
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Checkbox
                  id={`checkbox-${questionId}-${index}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    const newSelection = checked
                      ? [...selectedOptions, option]
                      : selectedOptions.filter((item) => item !== option);
                    handleResponseChange(questionId, newSelection);
                  }}
                />
                <Label
                  htmlFor={`checkbox-${questionId}-${index}`}
                  className="cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                📝 راهنمای شرکت در نظرسنجی
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• سوالات با علامت * اجباری هستند</li>
                <li>• می‌توانید بین سوالات جابجا شوید</li>
                <li>• پاسخ‌های شما ذخیره خواهد شد</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => setHasStarted(true)} size="lg">
                شروع نظرسنجی
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
          <Badge variant="outline">
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
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Send className="h-4 w-4" />
                <span>
                  {isSubmitting ? "در حال ارسال..." : "ارسال پاسخ‌ها"}
                </span>
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
