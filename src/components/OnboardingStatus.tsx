"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UsersIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";
import Link from "next/link";

interface OnboardingStatus {
  hasTeachers: boolean;
  hasClasses: boolean;
  hasStudents: boolean;
  teachersCount: number;
  classesCount: number;
  studentsCount: number;
  weeklyProgramsCount: number;
  completedSteps: number;
  totalSteps: number;
  nextStep: string | null;
}

interface OnboardingStatusProps {
  onClose?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const steps = [
  {
    key: "teachers",
    title: "تعریف معلمان",
    description: "ابتدا معلمان مدرسه را در سیستم تعریف کنید",
    icon: AcademicCapIcon,
    link: "/admin/teachers",
    priority: 1,
  },
  {
    key: "classes",
    title: "تعریف کلاس‌ها و برنامه هفتگی",
    description: "کلاس‌ها و برنامه هفتگی درسی را تعریف کنید",
    icon: BookOpenIcon,
    link: "/admin/classes",
    priority: 2,
  },
  {
    key: "students",
    title: "ورود دانش‌آموزان",
    description: "دانش‌آموزان را از فایل اکسل وارد کنید",
    icon: UsersIcon,
    link: "/admin/classes",
    priority: 3,
  },
];

export default function OnboardingStatus({
  onClose,
  isMinimized = false,
  onToggleMinimize,
}: OnboardingStatusProps) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOnboardingStatus();
  }, []);

  const fetchOnboardingStatus = async () => {
    try {
      setLoading(true);
      console.log("Fetching onboarding status...");
      const response = await fetch("/api/onboarding/status", {
        headers: {
          "x-domain": window.location.host,
        },
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Failed to fetch onboarding status: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Onboarding status data:", data);
      setStatus(data);
    } catch (err) {
      console.error("Error fetching onboarding status:", err);
      setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-0">
        <div className="flex items-center justify-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          <span className="mr-3 text-gray-600">در حال بارگذاری وضعیت راه‌اندازی...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-red-600">
            <ExclamationCircleIcon className="w-5 h-5 ml-2" />
            <span>خطا: {error}</span>
          </div>
          <button
            onClick={fetchOnboardingStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (!status) {
    console.log("No status data, returning null");
    return null;
  }

  console.log("Status check:", {
    completedSteps: status.completedSteps,
    totalSteps: status.totalSteps,
    hasTeachers: status.hasTeachers,
    hasClasses: status.hasClasses,
    hasStudents: status.hasStudents
  });

  // If all steps are completed, show a completion report
  if (status.completedSteps >= status.totalSteps) {
    console.log("All steps completed, showing completion report");
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg p-6 mb-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircleIconSolid className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-xl">🎉 تبریک! راه‌اندازی کامل شد</h3>
              <p className="opacity-90 text-sm">
                سیستم مدرسه شما با موفقیت راه‌اندازی شده است
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Statistics Report */}
        <div className="bg-white/10 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            📊 گزارش خلاصه سیستم
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Teachers */}
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <AcademicCapIcon className="w-6 h-6 mx-auto mb-2 opacity-90" />
              <div className="font-bold text-2xl">{status.teachersCount}</div>
              <div className="text-sm opacity-90">معلم</div>
            </div>

            {/* Classes */}
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <BookOpenIcon className="w-6 h-6 mx-auto mb-2 opacity-90" />
              <div className="font-bold text-2xl">{status.classesCount}</div>
              <div className="text-sm opacity-90">کلاس</div>
            </div>

            {/* Students */}
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <UsersIcon className="w-6 h-6 mx-auto mb-2 opacity-90" />
              <div className="font-bold text-2xl">{status.studentsCount}</div>
              <div className="text-sm opacity-90">دانش‌آموز</div>
            </div>

            {/* Weekly Programs */}
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="w-6 h-6 mx-auto mb-2 opacity-90 flex items-center justify-center">
                📅
              </div>
              <div className="font-bold text-2xl">{status.weeklyProgramsCount}</div>
              <div className="text-sm opacity-90">برنامه هفتگی</div>
            </div>
          </div>
        </div>

        {/* Summary Information */}
        <div className="bg-white/10 rounded-lg p-3 mb-4">
          <h5 className="font-medium text-sm mb-2 opacity-90">خلاصه راه‌اندازی:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircleIconSolid className="w-4 h-4" />
              <span>تعریف {status.teachersCount} معلم</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIconSolid className="w-4 h-4" />
              <span>ایجاد {status.classesCount} کلاس</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIconSolid className="w-4 h-4" />
              <span>ثبت {status.studentsCount} دانش‌آموز</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIconSolid className="w-4 h-4" />
              <span>تنظیم {status.weeklyProgramsCount} برنامه هفتگی</span>
            </div>
          </div>
        </div>

        {/* Completion Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircleIconSolid className="w-5 h-5" />
            <span className="font-medium">همه مراحل تکمیل شده</span>
          </div>
          <div className="text-sm opacity-90">
            آماده برای استفاده کامل از سیستم
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/teachers">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <AcademicCapIcon className="w-4 h-4" />
              مدیریت معلمان
            </motion.button>
          </Link>
          <Link href="/admin/classes">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <BookOpenIcon className="w-4 h-4" />
              مدیریت کلاس‌ها
            </motion.button>
          </Link>
          <Link href="/admin/students">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <UsersIcon className="w-4 h-4" />
              مدیریت دانش‌آموزان
            </motion.button>
          </Link>
        </div>
      </motion.div>
    );
  }

  const progressPercentage = (status.completedSteps / status.totalSteps) * 100;

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-4 mb-6 cursor-pointer"
        onClick={onToggleMinimize}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">
                {status.completedSteps}/{status.totalSteps}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">راه‌اندازی سیستم</h3>
              <p className="text-sm opacity-90">
                {status.completedSteps} از {status.totalSteps} مرحله تکمیل شده
              </p>
            </div>
          </div>
          <ChevronRightIcon className="w-5 h-5 transform rotate-90" />
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6 border-0 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <CheckCircleIconSolid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                راه‌اندازی سیستم مدرسه
              </h2>
              <p className="text-gray-600 text-sm">
                برای استفاده کامل از سیستم، مراحل زیر را تکمیل کنید
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              پیشرفت کلی
            </span>
            <span className="text-sm font-medium text-gray-700">
              {status.completedSteps} از {status.totalSteps} مرحله
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = 
              (step.key === "teachers" && status.hasTeachers) ||
              (step.key === "classes" && status.hasClasses) ||
              (step.key === "students" && status.hasStudents);
            
            const isNext = step.key === status.nextStep;
            const count = 
              step.key === "teachers" ? status.teachersCount :
              step.key === "classes" ? status.classesCount :
              step.key === "students" ? status.studentsCount : 0;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200
                  ${isCompleted 
                    ? "bg-green-50 border-green-200" 
                    : isNext 
                    ? "bg-blue-50 border-blue-300 border-dashed" 
                    : "bg-gray-50 border-gray-200"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Step Icon */}
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        ${isCompleted 
                          ? "bg-green-500 text-white" 
                          : isNext 
                          ? "bg-blue-500 text-white" 
                          : "bg-gray-300 text-gray-600"
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircleIconSolid className="w-6 h-6" />
                      ) : (
                        <step.icon className="w-6 h-6" />
                      )}
                    </div>

                    {/* Step Content */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {step.title}
                        {isNext && (
                          <span className="mr-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                            بعدی
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {step.description}
                      </p>
                      {isCompleted && count > 0 && (
                        <p className="text-sm text-green-600 font-medium">
                          ✓ {count} مورد تعریف شده
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {!isCompleted && (
                      <Link href={step.link}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                            ${isNext
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            }
                          `}
                        >
                          {isNext ? "شروع کنید" : "انجام دهید"}
                          <ArrowRightIcon className="w-4 h-4" />
                        </motion.button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Priority Indicator */}
                <div className="absolute top-2 left-2">
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    مرحله {step.priority}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Message */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">نکته مهم:</p>
              <p>
                لطفاً مراحل را به ترتیب اولویت انجام دهید. ابتدا معلمان را تعریف کنید، 
                سپس کلاس‌ها و برنامه هفتگی، و در نهایت دانش‌آموزان را از طریق فایل اکسل 
                در بخش کلاس‌ها وارد کنید.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
