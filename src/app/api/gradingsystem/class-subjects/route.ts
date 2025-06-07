import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and school admins can access this endpoint
    if (user.userType !== "teacher" && user.userType !== "school") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classCode = searchParams.get("classCode");
    const teacherCode = searchParams.get("teacherCode");
    const schoolCode = searchParams.get("schoolCode");

    if (!classCode || !teacherCode || !schoolCode) {
      return NextResponse.json(
        { error: "Class code, teacher code, and school code are required" },
        { status: 400 }
      );
    }

    // Additional authorization check
    if (user.userType === "teacher" && user.username !== teacherCode) {
      return NextResponse.json(
        { error: "Unauthorized to access other teacher's subjects" },
        { status: 403 }
      );
    }

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

    // Get subjects that this teacher teaches in this class
    const teacherSubjects = classData.data.teachers
      .filter((teacher: any) => teacher.teacherCode === teacherCode)
      .map((teacher: any) => teacher.courseCode);

    if (teacherSubjects.length === 0) {
      return NextResponse.json(
        { error: "No subjects found for this teacher in this class" },
        { status: 404 }
      );
    }

    // Fetch course details for these subjects
    const courses = await connection
      .collection("courses")
      .find({
        "data.courseCode": { $in: teacherSubjects },
        "data.schoolCode": schoolCode
      })
      .sort({ "data.courseName": 1 })
      .toArray();

    // Transform the data to match what we need
    const subjects = courses.map((course) => ({
      courseCode: course.data.courseCode,
      courseName: course.data.courseName,
      Grade: course.data.Grade,
      vahed: course.data.vahed,
      major: course.data.major,
      // Add weekly schedule info if available
      weeklySchedule: classData.data.teachers
        .find((teacher: any) => 
          teacher.teacherCode === teacherCode && 
          teacher.courseCode === course.data.courseCode
        )?.weeklySchedule || []
    }));

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Error fetching class subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
} 
 