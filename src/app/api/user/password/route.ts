import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "کاربر یافت نشد" },
        { status: 401 }
      );
    }

    // Get domain from header like surveys route
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);

    // Get collection based on user type
    const collectionName = 
      user.userType === "school" ? "schools" : 
      user.userType === "teacher" ? "teachers" : 
      "students";

    // Build query
    let query: Record<string, string> = {};
    if (user.userType === "school") {
      query = { 
        'data.schoolCode': user.schoolCode,
        'data.username': user.username 
      };
    } else if (user.userType === "teacher") {
      query = {
        'data.schoolCode': user.schoolCode,
        'data.teacherCode': user.username
      };
    } else if (user.userType === "student") {
      query = {
        'data.schoolCode': user.schoolCode,
        'data.studentCode': user.username
      };
    }

    // Find user
    const dbUser = await connection.collection(collectionName).findOne(query);

    if (!dbUser || !dbUser.data) {
      return NextResponse.json(
        { message: "کاربر در پایگاه داده یافت نشد" },
        { status: 404 }
      );
    }

    const password = dbUser.data.password || '';

    return NextResponse.json({
      success: true,
      password,
    });

  } catch (error) {
    console.error("Error fetching user password:", error);
    return NextResponse.json(
      { message: "خطا در دریافت رمز عبور" },
      { status: 500 }
    );
  }
}

