import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export const runtime = 'nodejs';

// GET - Fetch students and teachers for the accounting system
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can access accounting
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized. Only school admins can access accounting." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const personType = searchParams.get("personType"); // student, teacher, or both
    const search = searchParams.get("search"); // search query

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    const result: { students?: unknown[]; teachers?: unknown[] } = {};

    // Fetch students if requested
    if (!personType || personType === "student" || personType === "both") {
      let studentQuery: Record<string, unknown> = { 
        "data.schoolCode": user.schoolCode,
        "data.isActive": true 
      };
      
      if (search) {
        studentQuery = {
          ...studentQuery,
          $or: [
            { "data.studentName": { $regex: search, $options: "i" } },
            { "data.studentFamily": { $regex: search, $options: "i" } },
            { "data.studentCode": { $regex: search, $options: "i" } }
          ]
        };
      }

      const students = await connection
        .collection("students")
        .find(studentQuery)
        .project({
          _id: 1,
          "data.studentName": 1,
          "data.studentFamily": 1,
          "data.studentCode": 1,
          "data.classCode": 1
        })
        .limit(50)
        .toArray();

      result.students = students.map(student => ({
        _id: student._id,
        name: `${student.data.studentName} ${student.data.studentFamily}`,
        code: student.data.studentCode,
        classCode: student.data.classCode,
        type: "student"
      }));
    }

    // Fetch teachers if requested
    if (!personType || personType === "teacher" || personType === "both") {
      let teacherQuery: Record<string, unknown> = { 
        "data.schoolCode": user.schoolCode,
        "data.isActive": true 
      };
      
      if (search) {
        teacherQuery = {
          ...teacherQuery,
          $or: [
            { "data.teacherName": { $regex: search, $options: "i" } },
            { "data.teacherCode": { $regex: search, $options: "i" } }
          ]
        };
      }

      const teachers = await connection
        .collection("teachers")
        .find(teacherQuery)
        .project({
          _id: 1,
          "data.teacherName": 1,
          "data.teacherCode": 1
        })
        .limit(50)
        .toArray();

      result.teachers = teachers.map(teacher => ({
        _id: teacher._id,
        name: teacher.data.teacherName,
        code: teacher.data.teacherCode,
        type: "teacher"
      }));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching persons:", error);
    return NextResponse.json(
      { error: "Failed to fetch persons" },
      { status: 500 }
    );
  }
} 