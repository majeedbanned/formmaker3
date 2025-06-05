"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SurveyWizard from "../../components/wizard/SurveyWizard";
import { useSurvey } from "../../hooks/useSurveys";
import { toast } from "sonner";

export default function EditSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const { survey, loading, error } = useSurvey(surveyId);

  useEffect(() => {
    if (error) {
      toast.error(error);

      // Redirect back to surveys list if unauthorized or survey not found
      if (error.includes("Unauthorized") || error.includes("not found")) {
        router.push("/admin/surveys");
      }
    }
  }, [error, router]);

  const handleComplete = () => {
    toast.success("نظرسنجی با موفقیت به‌روزرسانی شد");
    router.push("/admin/surveys");
  };

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
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <SurveyWizard
      initialSurvey={survey}
      mode="edit"
      onComplete={handleComplete}
    />
  );
}
