"use client";
import ClassSheet from "./component/ClassSheet";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export default function ClassSheetPage() {
  const [classDocuments, setClassDocuments] = useState<ClassDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hardcoded values for now, could be from authentication context
  const schoolCode = "2295566177";
  const teacherCode = "102";

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/classes?schoolCode=${schoolCode}&teacherCode=${teacherCode}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Server responded with status ${response.status}`
          );
        }

        const data = await response.json();
        console.log("data", data);
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

        //  console.log("Fetched class data:", data);
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
  }, [schoolCode, teacherCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center m-4">
        <h3 className="text-red-700 font-medium text-lg mb-2">
          Error Loading Classes
        </h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (classDocuments.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center m-4">
        <h3 className="text-yellow-700 font-medium text-lg mb-2">
          No Classes Found
        </h3>
        <p className="text-yellow-600">
          No classes were found for this teacher.
        </p>
      </div>
    );
  }

  // console.log("classDocuments", classDocuments);

  return (
    <div>
      <ClassSheet
        schoolCode={schoolCode}
        teacherCode={teacherCode}
        classDocuments={classDocuments}
      />
    </div>
  );
}
