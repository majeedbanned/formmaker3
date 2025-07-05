"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ReportCards from "./components/ReportCards";
import { useAuth } from "@/hooks/useAuth";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import PageHeader from "@/components/PageHeader";

// Define the types needed
type WeeklySchedule = {
  day: string;
  timeSlot: string;
};

type Student = {
  studentCode: string;
  studentName: string;
  studentlname: string;
  phone: string;
};

type TeacherCourse = {
  teacherCode: string;
  courseCode: string;
  weeklySchedule: WeeklySchedule[];
  weeklySchedule_expanded?: boolean;
};

type ClassData = {
  classCode: string;
  className: string;
  major: string;
  Grade: string;
  schoolCode: string;
  teachers: TeacherCourse[];
  teachers_expanded?: boolean;
  students: Student[];
};

type ClassDocument = {
  data: ClassData;
};

export default function ReportCardsPage() {
  const [classDocuments, setClassDocuments] = useState<ClassDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading } = useAuth();

  // Get schoolCode and teacherCode from authenticated user
  const schoolCode = user?.schoolCode;
  const teacherCode = user?.userType === "teacher" ? user.username : undefined;

  useEffect(() => {
    const fetchClassData = async () => {
      if (isLoading) return; // Wait for auth to complete
      if (!schoolCode) {
        setError(
          "کد مدرسه در دسترس نیست. لطفا مطمئن شوید که وارد حساب کاربری خود شده‌اید."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Build API URL based on available data
        let apiUrl = `/api/classes?schoolCode=${schoolCode}`;
        if (teacherCode) {
          apiUrl += `&teacherCode=${teacherCode}`;
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Server responded with status ${response.status}`
          );
        }

        const data = await response.json();

        // Validate data structure
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received from server");
        }

        // Check if the data has the expected structure
        const validData = data.every(
          (item) =>
            item &&
            typeof item === "object" &&
            item.data &&
            typeof item.data.classCode === "string" &&
            typeof item.data.className === "string"
        );

        if (!validData && data.length > 0) {
          console.warn("Some class documents have invalid format:", data);
          toast.warning("برخی از اطلاعات کلاس‌ها ناقص است");
        }

        setClassDocuments(data);
      } catch (err) {
        console.error("Error fetching class data:", err);
        setError(err instanceof Error ? err.message : "Failed to load classes");
        toast.error("خطا در بارگذاری کلاس‌ها");
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [schoolCode, teacherCode, isLoading]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>در حال بارگذاری کلاس‌ها...</p>
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
          لطفا وارد حساب کاربری خود شوید تا بتوانید به این بخش دسترسی پیدا کنید.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center m-4">
        <h3 className="text-red-700 font-medium text-lg mb-2">
          خطا در بارگذاری کلاس‌ها
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

  if (classDocuments.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center m-4">
        <h3 className="text-yellow-700 font-medium text-lg mb-2">
          کلاسی یافت نشد
        </h3>
        <p className="text-yellow-600">
          {user.userType === "teacher"
            ? "هیچ کلاسی برای شما یافت نشد."
            : "هیچ کلاسی در مدرسه یافت نشد."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* <h1 className="text-2xl font-bold mb-6 text-center">
        کارنامه تحصیلی دانش‌آموزان
      </h1> */}
      <PageHeader
        title="        کارنامه تحصیلی دانش‌آموزان"
        // subtitle="گزارش ماهانه نمرات"
        icon={<AcademicCapIcon className="w-6 h-6" />}
        gradient={true}
      />
      <ReportCards
        schoolCode={schoolCode || ""}
        teacherCode={teacherCode}
        classDocuments={classDocuments}
      />
    </div>
  );
}
