import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "احراز هویت مورد نیاز است" }, { status: 401 });
    }

    if (user.userType !== "school" && user.userType !== "teacher") {
      return NextResponse.json({ error: "دسترسی محدود شده است" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "شناسه دانش‌آموز مورد نیاز است" }, { status: 400 });
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const dbConnection = await connectToDatabase(domain);
    
    if (!dbConnection?.db) {
      return NextResponse.json({ error: "خطا در اتصال به پایگاه داده" }, { status: 500 });
    }

    const { db } = dbConnection;

    // Get student data
    const studentData = await db.collection("students").findOne({ _id: new ObjectId(studentId) });

    if (!studentData) {
      return NextResponse.json({ error: "دانش‌آموز یافت نشد" }, { status: 404 });
    }

    const studentCode = studentData.data.studentCode;

    // Check teacher access
    if (user.userType === "teacher") {
      const studentClassCodes = studentData.data.classCode?.map((c: { value: string }) => c.value) || [];
      const teacherClassCodes = user.classCode?.map((c: { value: string }) => c.value) || [];
      
      const hasAccess = studentClassCodes.some((classCode: string) => 
        teacherClassCodes.includes(classCode)
      );

      if (!hasAccess) {
        return NextResponse.json({ error: "دسترسی به این دانش‌آموز محدود شده است" }, { status: 403 });
      }
    }

    // Fetch records with grades or assessments
    const records = await db
      .collection("classsheet")
      .find({
        studentCode: studentCode,
        $or: [
          { "grades.0": { $exists: true } },
          { "assessments.0": { $exists: true } }
        ]
      })
      .sort({ date: -1 })
      .limit(200)
      .toArray();

    // Get course names
    const courseCodes = [...new Set(records.map(record => record.courseCode))];
    const courses = await db
      .collection("courses")
      .find({ "data.courseCode": { $in: courseCodes } })
      .toArray();

    const courseMap = new Map();
    courses.forEach(course => {
      courseMap.set(course.data.courseCode, course.data.courseName);
    });

    // Enrich records
    const enrichedRecords = records.map(record => ({
      _id: record._id.toString(),
      courseCode: record.courseCode,
      courseName: courseMap.get(record.courseCode) || record.courseCode,
      date: record.date,
      persianDate: record.persianDate,
      timeSlot: record.timeSlot,
      presenceStatus: record.presenceStatus,
      grades: record.grades || [],
      assessments: record.assessments || [],
    }));

    // Calculate statistics
    let totalGrades = 0;
    let totalAssessments = 0;
    let totalPoints = 0;
    let totalMaxPoints = 0;

    enrichedRecords.forEach(record => {
      totalGrades += record.grades?.length || 0;
      totalAssessments += record.assessments?.length || 0;
      
      record.grades?.forEach((grade: { value: number; totalPoints: number }) => {
        totalPoints += grade.value;
        totalMaxPoints += grade.totalPoints;
      });
    });

    const averageGrade = totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 100 : 0;

    return NextResponse.json({
      success: true,
      records: enrichedRecords,
      statistics: {
        totalRecords: enrichedRecords.length,
        totalGrades,
        totalAssessments,
        averageGrade: Math.round(averageGrade * 10) / 10,
      },
    });

  } catch (error) {
    console.error("Error fetching grades data:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات نمرات" },
      { status: 500 }
    );
  }
} 