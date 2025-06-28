import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    // Check if user has permission to view student data
    if (user.userType !== "school" && user.userType !== "teacher") {
      return NextResponse.json(
        { error: "شما مجوز دسترسی به این اطلاعات را ندارید" },
        { status: 403 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!studentId) {
      return NextResponse.json(
        { error: "شناسه دانش‌آموز الزامی است" },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { error: "شناسه دانش‌آموز نامعتبر است" },
        { status: 400 }
      );
    }

    // First, get the student to verify permissions and get student code
    const student = await connection.collection("students").findOne({
      _id: new ObjectId(studentId),
      "data.schoolCode": user.schoolCode,
    });

    if (!student) {
      return NextResponse.json(
        { error: "دانش‌آموز یافت نشد" },
        { status: 404 }
      );
    }

    // For teachers, check if they have access to this student's classes
    if (user.userType === "teacher") {
      const studentClassCodes = student.data.classCode?.map((c: { value: string }) => c.value) || [];
      
      // Get teacher's classes from teachers collection
      const teacher = await connection.collection("teachers").findOne({
        "data.teacherCode": user.username,
        "data.schoolCode": user.schoolCode,
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "اطلاعات معلم یافت نشد" },
          { status: 403 }
        );
      }

      const teacherClassCodes = teacher.data.classCode?.map((c: { value: string }) => c.value) || [];
      
      // Check if teacher has access to any of student's classes
      const hasAccess = studentClassCodes.some((classCode: string) => 
        teacherClassCodes.includes(classCode)
      );

      if (!hasAccess) {
        return NextResponse.json(
          { error: "شما مجوز دسترسی به اطلاعات این دانش‌آموز را ندارید" },
          { status: 403 }
        );
      }
    }

    // Build query for classsheet collection
    const query: Record<string, any> = {
      studentCode: student.data.studentCode,
      schoolCode: user.schoolCode,
    };

    // Add date range if provided
    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Fetch presence records from classsheet collection
    const records = await connection
      .collection("classsheet")
      .find(query)
      .sort({ date: -1 }) // Sort by date, newest first
      .limit(200) // Limit to prevent excessive data
      .toArray();

    // Get unique course codes to fetch course names
    const courseCodes = [...new Set(records.map((r: any) => r.courseCode))];
    const courses = await connection
      .collection("courses")
      .find({
        "data.courseCode": { $in: courseCodes },
        "data.schoolCode": user.schoolCode,
      })
      .toArray();

    // Create a map of course codes to course names
    const courseMap = courses.reduce((map: Record<string, string>, course: any) => {
      map[course.data.courseCode] = course.data.courseName;
      return map;
    }, {} as Record<string, string>);

    // Get unique class codes to fetch class names
    const classCodes = [...new Set(records.map((r: any) => r.classCode))];
    const classes = await connection
      .collection("classes")
      .find({
        "data.classCode": { $in: classCodes },
        "data.schoolCode": user.schoolCode,
      })
      .toArray();

    // Create a map of class codes to class names
    const classMap = classes.reduce((map: Record<string, string>, classItem: any) => {
      map[classItem.data.classCode] = classItem.data.className;
      return map;
    }, {} as Record<string, string>);

    // Enrich records with course and class names
    const enrichedRecords = records.map(record => ({
      ...record,
      courseName: courseMap[record.courseCode] || record.courseCode,
      className: classMap[record.classCode] || record.classCode,
    }));

    // Calculate statistics
    const totalSessions = records.length;
    const presentCount = records.filter(r => r.presenceStatus === "present").length;
    const absentCount = records.filter(r => r.presenceStatus === "absent").length;
    const lateCount = records.filter(r => r.presenceStatus === "late").length;
    const excusedCount = records.filter(r => r.presenceStatus === "excused").length;
    const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

    const stats = {
      totalSessions,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate,
    };

    return NextResponse.json({
      success: true,
      records: enrichedRecords,
      stats,
      student: {
        _id: student._id,
        name: `${student.data.studentName} ${student.data.studentFamily}`,
        studentCode: student.data.studentCode,
      },
    });

  } catch (error) {
    console.error("Error fetching presence data:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات حضور و غیاب" },
      { status: 500 }
    );
  }
} 