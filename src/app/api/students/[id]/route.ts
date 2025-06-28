import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const studentId = params.id;

    // Validate ObjectId
    if (!ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { error: "شناسه دانش‌آموز نامعتبر است" },
        { status: 400 }
      );
    }

    // Find the student
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

    return NextResponse.json({
      success: true,
      student,
    });

  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات دانش‌آموز" },
      { status: 500 }
    );
  }
} 