import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || 'localhost:3000';
    
    // Get the authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Count active push tokens for students
    const studentsCollection = connection.collection('students');
    const students = await studentsCollection.find({
      'data.schoolCode': user.schoolCode,
      'data.pushTokens': { $exists: true, $ne: [] }
    }).toArray();

    // Count active push tokens for teachers
    const teachersCollection = connection.collection('teachers');
    const teachers = await teachersCollection.find({
      'data.schoolCode': user.schoolCode,
      'data.pushTokens': { $exists: true, $ne: [] }
    }).toArray();

    let tokenCount = 0;

    // Count student tokens
    students.forEach((student: any) => {
      if (student.data?.pushTokens && Array.isArray(student.data.pushTokens)) {
        tokenCount += student.data.pushTokens.filter((t: any) => t.active !== false).length;
      }
    });

    // Count teacher tokens
    teachers.forEach((teacher: any) => {
      if (teacher.data?.pushTokens && Array.isArray(teacher.data.pushTokens)) {
        tokenCount += teacher.data.pushTokens.filter((t: any) => t.active !== false).length;
      }
    });

    return NextResponse.json({
      count: tokenCount,
      studentCount: students.length,
      teacherCount: teachers.length
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error counting push tokens:", error);
    
    return NextResponse.json(
      { message: "خطا در شمارش توکن‌ها", count: 0 },
      { status: 500 }
    );
  }
}


