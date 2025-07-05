"use client";
import ClassSheet from "./component/ClassSheet";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import HelpPanel from "@/components/ui/HelpPanel";
import { classSheetHelpSections } from "./ClassSheetHelpContent";

// Define the types needed
type WeeklySchedule = {
  day: string;
  timeSlot: string;
};

type Student = {
  studentCode: string; // Changed from number to string to match ClassSheet component
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

export default function ClassSheetPage() {
  const [classDocuments, setClassDocuments] = useState<ClassDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const { user, isLoading } = useAuth();

  // Get schoolCode and teacherCode from authenticated user
  // If user is a teacher, use their ID as teacherCode
  // If user is a school admin, they'll see all classes for the school
  const schoolCode = user?.schoolCode;
  const teacherCode = user?.userType === "teacher" ? user.username : undefined;

  console.log("user", user);
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
  }, [schoolCode, teacherCode, isLoading]);

  // Help keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        setShowHelp(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>بارگذاری کلاس ها...</p>
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
    <div className="relative">
      {/* Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed top-4 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
        title="راهنما (F1)"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="hidden sm:inline">راهنما</span>
      </button>

      <ClassSheet
        schoolCode={schoolCode}
        teacherCode={teacherCode}
        classDocuments={classDocuments}
      />

      {/* Help Panel */}
      <HelpPanel
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="راهنمای سیستم کلاس‌برگ"
        sections={classSheetHelpSections}
      />
    </div>
  );
}
