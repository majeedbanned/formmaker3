import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.userType !== "school") {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const teachersCollection = connection.collection("teachers");

    // Get all active teachers for this school
    const teachers = await teachersCollection
      .find({
        "data.schoolCode": user.schoolCode,
        "data.isActive": true
      })
      .sort({ "data.teacherName": 1 })
      .toArray();

    // Transform to simple format for dropdowns
    const teachersList = teachers.map(teacher => ({
      id: teacher._id.toString(),
      name: teacher.data.teacherName,
      teacherCode: teacher.data.teacherCode
    }));

    return NextResponse.json({ teachers: teachersList });
  } catch (error) {
    logger.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست معلمان" },
      { status: 500 }
    );
  }
}

