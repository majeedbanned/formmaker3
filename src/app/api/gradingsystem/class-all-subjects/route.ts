import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can access this endpoint (all subjects for a class)
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Access denied - Only school admins can view all class subjects" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classCode = searchParams.get("classCode");
    const schoolCode = searchParams.get("schoolCode");

    if (!classCode || !schoolCode) {
      return NextResponse.json(
        { error: "Class code and school code are required" },
        { status: 400 }
      );
    }

    // Additional authorization check
    if (user.schoolCode !== schoolCode) {
      return NextResponse.json(
        { error: "Unauthorized to access this school's data" },
        { status: 403 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Find the specific class
    const classData = await connection
      .collection("classes")
      .findOne({
        "data.classCode": classCode,
        "data.schoolCode": schoolCode
      });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Get all subjects taught in this class
    const allTeacherSubjects = classData.data.teachers || [];
    
    if (allTeacherSubjects.length === 0) {
      return NextResponse.json(
        { error: "No subjects found for this class" },
        { status: 404 }
      );
    }

    // Extract unique course codes and create a mapping of courseCode to teacher info
    const courseTeacherMap = new Map();
    const uniqueCourseCodes = new Set();

    allTeacherSubjects.forEach((teacher: any) => {
      const key = teacher.courseCode;
      uniqueCourseCodes.add(key);
      
      if (!courseTeacherMap.has(key)) {
        courseTeacherMap.set(key, {
          teacherCode: teacher.teacherCode,
          teacherName: teacher.teacherName,
          weeklySchedule: teacher.weeklySchedule || []
        });
      }
    });

    // Fetch course details for all subjects
    const courses = await connection
      .collection("courses")
      .find({
        "data.courseCode": { $in: Array.from(uniqueCourseCodes) },
        "data.schoolCode": schoolCode
      })
      .sort({ "data.courseName": 1 })
      .toArray();

    // Get teacher names for the teacher codes
    const teacherCodes = Array.from(new Set(allTeacherSubjects.map((t: any) => t.teacherCode)));
    const teachers = await connection
      .collection("teachers")
      .find({
        "data.teacherCode": { $in: teacherCodes },
        "data.schoolCode": schoolCode
      })
      .toArray();

    const teacherNameMap = new Map();
    teachers.forEach((teacher) => {
      teacherNameMap.set(teacher.data.teacherCode, teacher.data.name);
    });

    // Transform the data to match what we need
    const subjects = courses.map((course) => {
      const teacherInfo = courseTeacherMap.get(course.data.courseCode);
      const teacherName = teacherNameMap.get(teacherInfo?.teacherCode) || teacherInfo?.teacherName || "نامشخص";

      return {
        courseCode: course.data.courseCode,
        courseName: course.data.courseName,
        Grade: course.data.Grade,
        vahed: course.data.vahed,
        major: course.data.major,
        teacherCode: teacherInfo?.teacherCode,
        teacherName: teacherName,
        weeklySchedule: teacherInfo?.weeklySchedule || []
      };
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Error fetching all class subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
} 