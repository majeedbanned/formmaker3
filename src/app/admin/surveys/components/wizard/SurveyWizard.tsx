"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Survey, WizardStep, SurveyQuestion } from "../../types/survey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import BasicInfoStep from "./BasicInfoStep";
import QuestionsStep from "./QuestionsStep";
import TargetingStep from "./TargetingStep";
import SettingsStep from "./SettingsStep";
import ReviewStep from "./ReviewStep";
import { useSurveys } from "../../hooks/useSurveys";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SurveyWizardProps {
  initialSurvey?: Partial<Survey>;
  mode?: "create" | "edit";
  onComplete?: (survey: Survey) => void;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "basic-info",
    title: "اطلاعات پایه",
    description: "عنوان و توضیحات نظرسنجی",
    isCompleted: false,
    isActive: true,
  },
  {
    id: "questions",
    title: "سوالات",
    description: "ایجاد سوالات نظرسنجی",
    isCompleted: false,
    isActive: false,
  },
  {
    id: "targeting",
    title: "هدف‌گذاری",
    description: "انتخاب کلاس‌ها یا معلمان",
    isCompleted: false,
    isActive: false,
  },
  {
    id: "settings",
    title: "تنظیمات",
    description: "تاریخ، دسترسی و تنظیمات",
    isCompleted: false,
    isActive: false,
  },
  {
    id: "review",
    title: "بررسی نهایی",
    description: "بررسی و تایید نظرسنجی",
    isCompleted: false,
    isActive: false,
  },
];

export default function SurveyWizard({
  initialSurvey,
  mode = "create",
  onComplete,
}: SurveyWizardProps) {
  const router = useRouter();
  const { createSurvey, updateSurvey } = useSurveys();
  const { user } = useAuth();

  const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [surveyData, setSurveyData] = useState<Partial<Survey>>({
    title: "",
    description: "",
    questions: [],
    classTargets: [],
    teacherTargets: [],
    status: "draft",
    allowAnonymous: false,
    showResults: false,
    ...initialSurvey,
  });

  // Update survey data when initialSurvey changes (for edit mode)
  useEffect(() => {
    if (initialSurvey && mode === "edit") {
      setSurveyData({
        title: "",
        description: "",
        questions: [],
        classTargets: [],
        teacherTargets: [],
        status: "draft",
        allowAnonymous: false,
        showResults: false,
        ...initialSurvey,
      });
    }
  }, [initialSurvey, mode]);

  // Ensure teacher users always target classes
  useEffect(() => {
    if (
      user?.userType === "teacher" &&
      (surveyData.teacherTargets?.length || 0) > 0
    ) {
      setSurveyData((prev) => ({ ...prev, teacherTargets: [] }));
    }
  }, [user?.userType, surveyData.teacherTargets]);

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const updateSurveyData = useCallback((updates: Partial<Survey>) => {
    setSurveyData((prev) => ({ ...prev, ...updates }));
  }, []);

  const validateCurrentStep = useCallback(() => {
    switch (currentStep.id) {
      case "basic-info":
        return !!surveyData.title?.trim();
      case "questions":
        return !!(
          surveyData.questions?.length && surveyData.questions.length > 0
        );
      case "targeting":
        return !!(
          (surveyData.classTargets?.length &&
            surveyData.classTargets.length > 0) ||
          (surveyData.teacherTargets?.length &&
            surveyData.teacherTargets.length > 0)
        );
      case "settings":
        return true; // Settings are optional
      case "review":
        return true;
      default:
        return false;
    }
  }, [currentStep.id, surveyData]);

  const markStepAsCompleted = useCallback((stepId: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, isCompleted: true } : step
      )
    );
  }, []);

  const goToNextStep = useCallback(() => {
    if (validateCurrentStep()) {
      markStepAsCompleted(currentStep.id);

      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
        setSteps((prev) =>
          prev.map((step, index) => ({
            ...step,
            isActive: index === currentStepIndex + 1,
          }))
        );
      }
    } else {
      toast.error("لطفاً تمام فیلدهای ضروری را تکمیل کنید");
    }
  }, [
    currentStepIndex,
    currentStep.id,
    steps.length,
    validateCurrentStep,
    markStepAsCompleted,
  ]);

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          isActive: index === currentStepIndex - 1,
        }))
      );
    }
  }, [currentStepIndex]);

  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
    setSteps((prev) =>
      prev.map((step, index) => ({
        ...step,
        isActive: index === stepIndex,
      }))
    );
  }, []);

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast.error("لطفاً تمام فیلدهای ضروری را تکمیل کنید");
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (mode === "edit" && initialSurvey?._id) {
        await updateSurvey(initialSurvey._id, surveyData);
        result = { ...initialSurvey, ...surveyData };
      } else {
        result = await createSurvey(surveyData);
      }

      toast.success(
        mode === "edit"
          ? "نظرسنجی با موفقیت به‌روزرسانی شد"
          : "نظرسنجی با موفقیت ایجاد شد"
      );

      if (onComplete) {
        onComplete(result);
      } else {
        router.push("/admin/surveys");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "خطا در ذخیره نظرسنجی"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case "basic-info":
        return <BasicInfoStep data={surveyData} onUpdate={updateSurveyData} />;
      case "questions":
        return (
          <QuestionsStep
            questions={surveyData.questions || []}
            onUpdate={(questions: SurveyQuestion[]) =>
              updateSurveyData({ questions })
            }
          />
        );
      case "targeting":
        return (
          <TargetingStep
            classTargets={surveyData.classTargets || []}
            teacherTargets={surveyData.teacherTargets || []}
            onUpdate={(classTargets: string[], teacherTargets: string[]) =>
              updateSurveyData({ classTargets, teacherTargets })
            }
          />
        );
      case "settings":
        return <SettingsStep data={surveyData} onUpdate={updateSurveyData} />;
      case "review":
        return <ReviewStep data={surveyData} onEdit={goToStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {mode === "edit" ? "ویرایش نظرسنجی" : "ایجاد نظرسنجی جدید"}
        </h1>
        <p className="text-gray-600">
          با استفاده از این ابزار می‌توانید به راحتی نظرسنجی ایجاد کنید
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">
            پیشرفت: {Math.round(progress)}%
          </span>
          <span className="text-sm text-gray-500">
            مرحله {currentStepIndex + 1} از {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 text-left" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Steps Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مراحل ایجاد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-start space-x-3 space-x-reverse p-3 rounded-lg cursor-pointer transition-colors",
                    step.isActive && "bg-blue-50 border border-blue-200",
                    step.isCompleted && "bg-green-50 border border-green-200",
                    !step.isActive && !step.isCompleted && "hover:bg-gray-50"
                  )}
                  onClick={() => goToStep(index)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {step.isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle
                        className={cn(
                          "h-5 w-5",
                          step.isActive ? "text-blue-500" : "text-gray-400"
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={cn(
                        "font-medium text-sm",
                        step.isActive && "text-blue-700",
                        step.isCompleted && "text-green-700",
                        !step.isActive && !step.isCompleted && "text-gray-700"
                      )}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{currentStep.title}</span>
                <span className="text-sm font-normal text-gray-500">
                  {currentStep.description}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[400px]">{renderStepContent()}</div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={currentStepIndex === 0}
                  className="flex items-center space-x-2 space-x-reverse"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>مرحله قبل</span>
                </Button>

                <div className="flex space-x-2 space-x-reverse">
                  {currentStepIndex === steps.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!validateCurrentStep() || isSubmitting}
                      className="flex items-center space-x-2 space-x-reverse"
                    >
                      <span>
                        {isSubmitting
                          ? "در حال ذخیره..."
                          : mode === "edit"
                          ? "به‌روزرسانی"
                          : "ایجاد نظرسنجی"}
                      </span>
                    </Button>
                  ) : (
                    <Button
                      onClick={goToNextStep}
                      disabled={!validateCurrentStep()}
                      className="flex items-center space-x-2 space-x-reverse"
                    >
                      <span>مرحله بعد</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
