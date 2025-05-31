import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherCode = searchParams.get("teacherCode");
    const schoolCode = searchParams.get("schoolCode");

    if (!teacherCode || !schoolCode) {
      return NextResponse.json(
        { error: "Teacher code and school code are required" },
        { status: 400 }
      );
    }

    // Verify school code matches current user's school code
    if (schoolCode !== currentUser.schoolCode && currentUser.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized access to school data" },
        { status: 403 }
      );
    }

    // For teachers, verify they are only accessing their own classes
    if (currentUser.userType === "teacher" && currentUser.username !== teacherCode) {
      return NextResponse.json(
        { error: "Teachers can only view their own classes" },
        { status: 403 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    const classes = await connection
      .collection("classes")
      .find({ 
        "data.schoolCode": schoolCode,
        "data.teachers.teacherCode": teacherCode
      })
      .project({
        "_id": 1,
        "data.classCode": 1,
        "data.className": 1,
      })
      .toArray();

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher classes" },
      { status: 500 }
    );
  }
} 