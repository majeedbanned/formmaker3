"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  PencilIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface Question {
  _id: string;
  examId: string;
  category: string;
  score: number;
  question: {
    question: string;
    option1?: string;
    option2?: string;
    option3?: string;
    option4?: string;
    correctoption?: number;
  };
}

interface ManualExamResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  onSuccess?: () => void;
}

export default function ManualExamResultModal({
  isOpen,
  onClose,
  examId,
  onSuccess,
}: ManualExamResultModalProps) {
  const [studentCode, setStudentCode] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions when modal opens
  useEffect(() => {
    if (isOpen && examId) {
      fetchQuestions();
    } else {
      // Reset state when modal closes
      setStudentCode("");
      setAnswers({});
      setError(null);
    }
  }, [isOpen, examId]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/examquestions/${examId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch exam questions");
      }
      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(err instanceof Error ? err.message : "خطا در بارگذاری سوالات");
      toast.error("خطا در بارگذاری سوالات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const clearAnswer = (questionIndex: number) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionIndex];
      return newAnswers;
    });
  };

  const validateInput = (): boolean => {
    if (!studentCode.trim()) {
      setError("کد دانش‌آموز الزامی است");
      toast.error("کد دانش‌آموز الزامی است");
      return false;
    }

    if (questions.length === 0) {
      setError("هیچ سوالی برای این آزمون یافت نشد");
      toast.error("هیچ سوالی برای این آزمون یافت نشد");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateInput()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Build the scanResult structure
      const rightAnswers: number[] = [];
      const wrongAnswers: number[] = [];
      const multipleAnswers: number[] = [];
      const unAnswered: number[] = [];
      const userAnswers: number[] = [];

      questions.forEach((question, index) => {
        const questionNumber = index + 1;
        const userAnswer = answers[questionNumber];
        const correctAnswer = question.question.correctoption || 1;

        userAnswers.push(userAnswer || 0);

        if (!userAnswer || userAnswer === 0) {
          unAnswered.push(questionNumber);
        } else if (userAnswer === correctAnswer) {
          rightAnswers.push(questionNumber);
        } else {
          wrongAnswers.push(questionNumber);
        }
        // Note: multipleAnswers would require multiple selections, which we don't support in manual input
        // If needed, this could be added as a feature later
      });

      const scanResult = {
        qRCodeData: studentCode,
        rightAnswers,
        wrongAnswers,
        multipleAnswers,
        unAnswered,
        Useranswers: userAnswers,
        correctedImageUrl: "", // No image for manual input
        originalFilename: `manual-${studentCode}-${new Date().toISOString()}`,
        processedFilePath: "",
      };

      const response = await fetch("/api/scan/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          examId,
          studentCode,
          scanResult,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در ذخیره نتایج");
      }

      const data = await response.json();
      toast.success(data.message || "نتایج با موفقیت ذخیره شد");
      
      // Reset form
      setStudentCode("");
      setAnswers({});
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal
      onClose();
    } catch (err) {
      console.error("Error saving manual result:", err);
      const errorMessage = err instanceof Error ? err.message : "خطا در ذخیره نتایج";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <PencilIcon className="w-6 h-6 ml-2 text-blue-600" />
            ورود دستی نتایج آزمون
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Student Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              کد دانش‌آموز <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="کد دانش‌آموز را وارد کنید"
              disabled={isSaving}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <ExclamationCircleIcon className="w-5 h-5 ml-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner className="w-8 h-8" />
              <p className="mr-3 text-gray-600">در حال بارگذاری سوالات...</p>
            </div>
          )}

          {/* Questions and Answers */}
          {!isLoading && questions.length > 0 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
                <p>
                  <strong>راهنما:</strong> برای هر سوال، شماره گزینه انتخاب شده توسط دانش‌آموز را وارد کنید (1، 2، 3 یا 4). 
                  برای سوالات بدون پاسخ، هیچ گزینه‌ای انتخاب نکنید.
                </p>
              </div>

              <div className="max-h-[500px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
                <div className="grid grid-cols-1 gap-2">
                  {questions.map((question, index) => {
                    const questionNumber = index + 1;
                    const userAnswer = answers[questionNumber];

                    return (
                      <div
                        key={question._id}
                        className="flex items-center gap-3 p-2 bg-white border rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-16 text-center">
                          <span className="font-bold text-blue-600 text-sm">
                            سوال {questionNumber}
                          </span>
                        </div>
                        
                        <div className="flex-1 flex items-center gap-2">
                          {[1, 2, 3, 4].map((optionNumber) => {
                            const isSelected = userAnswer === optionNumber;

                            return (
                              <button
                                key={optionNumber}
                                onClick={() =>
                                  handleAnswerChange(
                                    questionNumber,
                                    isSelected ? 0 : optionNumber
                                  )
                                }
                                disabled={isSaving}
                                className={`
                                  w-10 h-10 flex items-center justify-center border rounded-lg text-sm font-bold transition-colors
                                  ${
                                    isSelected
                                      ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                                      : "bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                                  }
                                  ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                `}
                                title={`گزینه ${optionNumber}`}
                              >
                                {optionNumber}
                              </button>
                            );
                          })}
                        </div>

                        {userAnswer && (
                          <button
                            onClick={() => clearAnswer(questionNumber)}
                            className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                            disabled={isSaving}
                            title="پاک کردن پاسخ"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 border rounded-lg p-3">
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-gray-600 text-xs mb-1">کل سوالات</div>
                    <div className="font-bold text-lg">{questions.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs mb-1">پاسخ داده شده</div>
                    <div className="font-bold text-lg text-blue-600">
                      {Object.keys(answers).filter(
                        (k) => answers[parseInt(k)] > 0
                      ).length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs mb-1">بدون پاسخ</div>
                    <div className="font-bold text-lg text-gray-600">
                      {questions.length -
                        Object.keys(answers).filter(
                          (k) => answers[parseInt(k)] > 0
                        ).length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs mb-1">پاسخ صحیح</div>
                    <div className="font-bold text-lg text-green-600">
                      {questions.filter(
                        (q, i) =>
                          answers[i + 1] === (q.question.correctoption || 1)
                      ).length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Questions Message */}
          {!isLoading && questions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>هیچ سوالی برای این آزمون یافت نشد</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300"
              disabled={isSaving}
            >
              انصراف
            </Button>

            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSave}
              disabled={isSaving || isLoading || questions.length === 0}
            >
              {isSaving ? (
                <>
                  <Spinner className="w-4 h-4 ml-2" />
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 ml-2" />
                  ذخیره نتایج
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

