import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

interface TeacherInfo {
  _id: string;
  data: {
    teacherName: string;
    teacherCode: string;
  };
}

interface ClassInfo {
  _id: string;
  data: {
    className: string;
    classCode: string;
    teachers?: Array<{
      teacherCode: string;
      courseCode?: string;
    }>;
  };
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get studentCode from query parameter
    const { searchParams } = new URL(request.url);
    const studentCode = searchParams.get('studentCode');
    
    if (!studentCode) {
      return NextResponse.json(
        { error: "Student code is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Find all classes that have this student
    const classesWithStudent = await connection
      .collection("classes")
      .find({
        "data.students": {
          $elemMatch: { 
            studentCode: studentCode 
          }
        }
      })
      .project({
        "_id": 1,
        "data.className": 1,
        "data.classCode": 1,
        "data.teachers": 1
      })
      .toArray() as ClassInfo[];
    
    // Extract all teacher codes from these classes
    const teacherCodesSet = new Set<string>();
    
    classesWithStudent.forEach(classObj => {
      if (classObj.data?.teachers && Array.isArray(classObj.data.teachers)) {
        classObj.data.teachers.forEach(teacher => {
          if (teacher.teacherCode) {
            teacherCodesSet.add(teacher.teacherCode);
          }
        });
      }
    });
    
    const teacherCodes = Array.from(teacherCodesSet);
    
    // Fetch teacher details for these teacher codes
    const teacherDetails: TeacherInfo[] = teacherCodes.length > 0 
      ? await connection
          .collection("teachers")
          .find({
            "data.teacherCode": { $in: teacherCodes }
          })
          .project({
            "_id": 1,
            "data.teacherName": 1,
            "data.teacherCode": 1
          })
          .toArray() as TeacherInfo[]
      : [];
    
    return NextResponse.json({
      teachers: teacherDetails,
      teacherCodes: teacherCodes,
      classesTaken: classesWithStudent.length,
      studentCode
    });
  } catch (error) {
    console.error("Error fetching student's teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers for student" },
      { status: 500 }
    );
  }
} 