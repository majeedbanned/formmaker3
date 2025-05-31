"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import StudentClassSheet from "./components/StudentClassSheet";

// Types
type GradeEntry = {
  value: number;
  description: string;
  date: string;
  totalPoints?: number;
};

type AssessmentEntry = {
  title: string;
  value: string;
  date: string;
  weight?: number;
};

type StudentGradeData = {
  _id: string;
  classCode: string;
  courseCode: string;
  courseName?: string;
  teacherCode: string;
  teacherName?: string;
  date: string;
  timeSlot: string;
  grades: GradeEntry[];
  assessments: AssessmentEntry[];
  presenceStatus: "present" | "absent" | "late" | null;
  note: string;
  persianDate: string;
  persianMonth: string;
};

export default function StudentClassSheetPage() {
  const [gradeData, setGradeData] = useState<StudentGradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading } = useAuth();

  const studentCode = user?.username;
  const schoolCode = user?.schoolCode;

  useEffect(() => {
    const fetchStudentGrades = async () => {
      if (isLoading) return;

      if (!studentCode || !schoolCode) {
        setError("دسترسی به اطلاعات دانش‌آموز موجود نیست.");
        setLoading(false);
        return;
      }

      if (user?.userType !== "student") {
        setError("این بخش فقط برای دانش‌آموزان قابل دسترسی است.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/studentgrades?studentCode=${studentCode}&schoolCode=${schoolCode}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `خطا در دریافت اطلاعات: ${response.status}`
          );
        }

        const data = await response.json();
        setGradeData(data);
      } catch (err) {
        console.error("خطا در بارگذاری نمرات:", err);
        setError(err instanceof Error ? err.message : "خطا در بارگذاری نمرات");
        toast.error("خطا در بارگذاری نمرات");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentGrades();
  }, [studentCode, schoolCode, user?.userType, isLoading]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">بارگذاری نمرات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center m-4">
        <h3 className="text-yellow-700 font-medium text-lg mb-2">
          دسترسی نامعتبر
        </h3>
        <p className="text-yellow-600">
          لطفا وارد حساب کاربری خود شوید تا بتوانید به نمرات دسترسی پیدا کنید.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center m-4">
        <h3 className="text-red-700 font-medium text-lg mb-2">
          خطا در بارگذاری نمرات
        </h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            کارنامه من
          </h1>
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <span className="flex items-center">
                <span className="font-medium text-gray-800">{user.name}</span>
              </span>
              <span className="text-gray-400">|</span>
              <span>کد دانش‌آموزی: {studentCode}</span>
            </div>
          </div>
        </div>

        <StudentClassSheet
          gradeData={gradeData}
          studentCode={studentCode}
          studentName={user.name}
        />
      </div>
    </div>
  );
}
