"use client";
import ClassSheet from "./component/ClassSheet";
import { useEffect, useState } from "react";

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
        const response = await fetch(
          `/api/classes?schoolCode=${schoolCode}&teacherCode=${teacherCode}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch class data");
        }

        const data = await response.json();
        console.log("Fetched class data:", data);
        setClassDocuments(data);
      } catch (err) {
        console.error("Error fetching class data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [schoolCode, teacherCode]);

  if (loading) {
    return <div className="p-4 text-center">Loading classes...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (classDocuments.length === 0) {
    return (
      <div className="p-4 text-center">No classes found for this teacher.</div>
    );
  }

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
