import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Types
interface GradeEntry {
  value: number;
  description: string;
  date: string;
  totalPoints?: number;
}

interface AssessmentEntry {
  title: string;
  value: string;
  date: string;
  weight?: number;
}

interface ClasssheetItem {
  _id: string;
  classCode: string;
  courseCode: string;
  date: string;
  schoolCode: string;
  studentCode: string;
  teacherCode: string;
  timeSlot: string;
  assessments: AssessmentEntry[];
  createdAt: string;
  descriptiveStatus: string;
  grades: GradeEntry[];
  note: string;
  persianDate: string;
  persianMonth: string;
  presenceStatus: "present" | "absent" | "late" | null;
  updatedAt: string;
}

interface Course {
  data: {
    courseCode: string;
    courseName: string;
    schoolCode: string;
  };
}

interface Teacher {
  data: {
    teacherCode: string;
    teacherName?: string;
    teacherFamily?: string;
    schoolCode: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentCode = searchParams.get("studentCode");
    const schoolCode = searchParams.get("schoolCode");

    if (!studentCode || !schoolCode) {
      return NextResponse.json(
        { error: "studentCode and schoolCode are required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Fetch classsheet data for the student
    const classheetData = (await connection
      .collection("classsheet")
      .find({
        studentCode: studentCode,
        schoolCode: schoolCode,
      })
      .sort({ date: -1 })
      .toArray()) as unknown as ClasssheetItem[];

    // Fetch course information to add course names
    const courseCodeSet = new Set(classheetData.map((item: ClasssheetItem) => item.courseCode));
    const courses = (await connection
      .collection("courses")
      .find({
        "data.courseCode": { $in: Array.from(courseCodeSet) },
        "data.schoolCode": schoolCode,
      })
      .toArray()) as unknown as Course[];

    // Create a map of courseCode to courseName
    const courseMap = new Map();
    courses.forEach((course: Course) => {
      courseMap.set(course.data.courseCode, course.data.courseName);
    });

    // Fetch teacher information
    const teacherCodeSet = new Set(classheetData.map((item: ClasssheetItem) => item.teacherCode));
    const teachers = (await connection
      .collection("teachers")
      .find({
        "data.teacherCode": { $in: Array.from(teacherCodeSet) },
        "data.schoolCode": schoolCode,
      })
      .toArray()) as unknown as Teacher[];

    // Create a map of teacherCode to teacherName
    const teacherMap = new Map();
    teachers.forEach((teacher: Teacher) => {
      const fullName = `${teacher.data.teacherName || ""} ${teacher.data.teacherFamily || ""}`.trim();
      teacherMap.set(teacher.data.teacherCode, fullName);
    });

    // Enrich the data with course and teacher names
    const enrichedData = classheetData.map((item: ClasssheetItem) => ({
      ...item,
      courseName: courseMap.get(item.courseCode) || item.courseCode,
      teacherName: teacherMap.get(item.teacherCode) || item.teacherCode,
    }));

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error("Error fetching student grades:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 