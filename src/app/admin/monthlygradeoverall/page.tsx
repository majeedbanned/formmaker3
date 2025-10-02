"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import MonthlyGradeOverallReport from "./components/MonthlyGradeOverallReport";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

// Define the types needed
type WeeklySchedule = {
  day: string;
  timeSlot: string;
};

type Student = {
  studentCode: number;
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

export default function MonthlyGradeOverallPage() {
  const [classDocuments, setClassDocuments] = useState<ClassDocument[]>([]);
  const [filteredClassDocuments, setFilteredClassDocuments] = useState<
    ClassDocument[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading } = useAuth();

  // Get schoolCode from authenticated user
  const schoolCode = user?.schoolCode;

  useEffect(() => {
    const fetchClassData = async () => {
      if (isLoading) return; // Wait for auth to complete
      if (!schoolCode) {
        setError(
          "No school code available. Please make sure you're logged in."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/classes?schoolCode=${schoolCode}`);

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
          toast.warning("Some class data may be incomplete");
        }

        setClassDocuments(data);
      } catch (err) {
        console.error("Error fetching class data:", err);
        setError(err instanceof Error ? err.message : "Failed to load classes");
        toast.error("Failed to load classes");
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [schoolCode, isLoading]);

  // Filter classes based on user type
  useEffect(() => {
    if (!user || !classDocuments.length) return;

    // For teacher users, filter to only show their classes
    if (user.userType === "teacher" && user.username) {
      const teacherClasses = classDocuments.filter((doc) =>
        doc.data.teachers.some(
          (teacher) => teacher.teacherCode === user.username
        )
      );
      setFilteredClassDocuments(teacherClasses);
    }
    // For school users, show all classes
    else if (user.userType === "school") {
      setFilteredClassDocuments(classDocuments);
    }
    // Default - just in case
    else {
      setFilteredClassDocuments(classDocuments);
    }
  }, [user, classDocuments]);

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

  if(user?.userType === "student"){
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">شما دسترسی به این صفحه را ندارید</div>
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

  if (filteredClassDocuments.length === 0) {
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
        گزارش نمرات تمام دروس
      </h1> */}
      <PageHeader
        title="گزارش نمرات تمام دروس"
        subtitle="گزارش نمرات تمام دروس"
        icon={<AcademicCapIcon className="w-6 h-6" />}
        gradient={true}
      />
      <MonthlyGradeOverallReport
        schoolCode={schoolCode || ""}
        classDocuments={filteredClassDocuments}
      />
    </div>
  );
}
