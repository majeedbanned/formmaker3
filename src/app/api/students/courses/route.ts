import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentCode = searchParams.get("studentCode");

    if (!studentCode) {
      return NextResponse.json(
        { error: "کد دانش‌آموز الزامی است" },
        { status: 400 }
      );
    }

    // Get domain from headers
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    // Only school users can access this
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "فقط مدیران مدرسه می‌توانند به این اطلاعات دسترسی داشته باشند" },
        { status: 403 }
      );
    }

    // Connect to database
    const connection = await connectToDatabase(domain);

    // First, find the student to get their class code
    const student = await connection.collection("students").findOne({
      "data.schoolCode": user.schoolCode,
      "data.studentCode": studentCode
    });

    if (!student) {
      return NextResponse.json(
        { error: "دانش‌آموز یافت نشد" },
        { status: 404 }
      );
    }

    // Get the student's class code
    const classCode = student.data.classCode?.[0]?.value;
    
    if (!classCode) {
      return NextResponse.json(
        { error: "دانش‌آموز در هیچ کلاسی ثبت نشده است" },
        { status: 404 }
      );
    }

    // Find the class to get its teachers and course codes
    const classData = await connection.collection("classes").findOne({
      "data.schoolCode": user.schoolCode,
      "data.classCode": classCode
    });

    if (!classData) {
      return NextResponse.json(
        { error: "کلاس یافت نشد" },
        { status: 404 }
      );
    }

    // Extract unique course codes from teachers and filter out any undefined/null values
    const courseCodes = [...new Set(
      classData.data.teachers?.map((teacher: any) => teacher.courseCode).filter((code: string) => code && code.trim() !== '') || []
    )];

    if (courseCodes.length === 0) {
      return NextResponse.json({
        success: true,
        courses: [],
        message: "هیچ درسی برای این کلاس تعریف نشده است"
      });
    }

    // Fetch course details from courses table
    const courses = await connection.collection("courses").find({
      "data.schoolCode": user.schoolCode,
      "data.courseCode": { $in: courseCodes }
    })
    .project({
      "data.courseCode": 1,
      "data.courseName": 1,
      "data.vahed": 1,
      "data.major": 1,
      "data.Grade": 1
    })
    .toArray();

    // Format the response and ensure uniqueness by course code
    const courseMap = new Map();
    courses.forEach(course => {
      const courseCode = course.data.courseCode;
      if (!courseMap.has(courseCode)) {
        courseMap.set(courseCode, {
          courseCode: course.data.courseCode,
          courseName: course.data.courseName,
          vahed: course.data.vahed || 0,
          major: course.data.major,
          grade: course.data.Grade
        });
      }
    });
    
    const formattedCourses = Array.from(courseMap.values());

    return NextResponse.json({
      success: true,
      courses: formattedCourses,
      className: classData.data.className,
      classCode: classCode
    });

  } catch (error) {
    console.error("Error fetching student courses:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست دروس" },
      { status: 500 }
    );
  }
}
