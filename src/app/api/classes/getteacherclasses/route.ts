import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolCode, teacherCode } = await req.json();

    // Verify school code matches current user's school code or user is admin
    if (
      schoolCode !== currentUser.schoolCode &&
      currentUser.role !== "school" &&
      currentUser.role !== "teacher"
    ) {
      return NextResponse.json(
        { error: "Unauthorized access to school data" },
        { status: 403 }
      );
    }
    
    // For teachers, verify they are only accessing their own classes
    if (
      currentUser.role === "teacher" &&
      currentUser.username !== teacherCode
    ) {
      return NextResponse.json(
        { error: "Teachers can only view their own classes" },
        { status: 403 }
      );
    }
    const domain = req.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const classes = await connection
      .collection("classes")
      .find({ 
        "data.schoolCode": schoolCode,
        "data.teachers.teacherCode": teacherCode
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