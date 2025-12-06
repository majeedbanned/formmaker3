import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

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

    // Search students with autocomplete
    const students = await connection.collection("students").find({
      "data.schoolCode": user.schoolCode,
      $or: [
        { "data.studentName": { $regex: query, $options: "i" } },
        { "data.studentFamily": { $regex: query, $options: "i" } },
        { "data.studentCode": { $regex: query, $options: "i" } }
      ]
    })
    .limit(limit)
    .project({
      "data.studentName": 1,
      "data.studentFamily": 1,
      "data.studentCode": 1,
      "data.avatar": 1,
      "data.classCode": 1
    })
    .toArray();

    // Format the response
    const formattedStudents = students.map(student => ({
      _id: student._id,
      studentName: student.data.studentName,
      studentFamily: student.data.studentFamily,
      studentCode: student.data.studentCode,
      fullName: `${student.data.studentName} ${student.data.studentFamily}`,
      avatar: student.data.avatar?.path || null,
      classCode: student.data.classCode?.[0]?.value || null,
      className: student.data.classCode?.[0]?.label || null
    }));

    return NextResponse.json({
      success: true,
      students: formattedStudents,
      count: formattedStudents.length
    });

  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json(
      { error: "خطا در جستجوی دانش‌آموزان" },
      { status: 500 }
    );
  }
}

