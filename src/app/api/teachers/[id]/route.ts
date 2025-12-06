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

    // Check if user has permission to view teacher data
    if (user.userType !== "school" && user.userType !== "teacher") {
      return NextResponse.json(
        { error: "شما مجوز دسترسی به این اطلاعات را ندارید" },
        { status: 403 }
      );
    }

    // Teachers can only view their own profile
    if (user.userType === "teacher" && params.id !== user.id) {
      return NextResponse.json(
        { error: "معلمان فقط می‌توانند پروفایل خود را مشاهده کنند" },
        { status: 403 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);
    const teacherId = params.id;

    // Validate ObjectId
    if (!ObjectId.isValid(teacherId)) {
      return NextResponse.json(
        { error: "شناسه معلم نامعتبر است" },
        { status: 400 }
      );
    }

    // Find the teacher
    const queryFilter: any = {
      _id: new ObjectId(teacherId),
    };

    // Teachers can access their own profile regardless of schoolCode
    // Schools need schoolCode filter
    if (user.userType !== "teacher") {
      queryFilter["data.schoolCode"] = user.schoolCode;
    }

    const teacher = await connection.collection("teachers").findOne(queryFilter);

    if (!teacher) {
      return NextResponse.json(
        { error: "معلم یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      teacher,
    });

  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات معلم" },
      { status: 500 }
    );
  }
}







