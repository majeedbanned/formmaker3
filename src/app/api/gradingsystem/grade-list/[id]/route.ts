import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../../chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and school admins can access this endpoint
    if (user.userType !== "teacher" && user.userType !== "school") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get("schoolCode");
    const gradeListId = params.id;

    if (!schoolCode || !gradeListId) {
      return NextResponse.json(
        { error: "School code and grade list ID are required" },
        { status: 400 }
      );
    }

    // Additional authorization check
    if (user.schoolCode !== schoolCode) {
      return NextResponse.json(
        { error: "Unauthorized to access this school's data" },
        { status: 403 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Fetch the grade list
    const gradeList = await connection
      .collection("grade_lists")
      .findOne({
        _id: new ObjectId(gradeListId),
        schoolCode
      });

    if (!gradeList) {
      return NextResponse.json(
        { error: "Grade list not found" },
        { status: 404 }
      );
    }

    // Additional authorization check for teachers
    if (user.userType === "teacher" && gradeList.teacherCode !== user.username) {
      return NextResponse.json(
        { error: "Unauthorized to access this grade list" },
        { status: 403 }
      );
    }

    // Fetch individual grades
    const grades = await connection
      .collection("grades")
      .find({ gradeListId: gradeListId })
      .toArray();

    // Fetch class data
    const classData = await connection
      .collection("classes")
      .findOne({
        "data.classCode": gradeList.classCode,
        "data.schoolCode": schoolCode
      });

    // Fetch course data
    const courseData = await connection
      .collection("courses")
      .findOne({
        "data.courseCode": gradeList.courseCode,
        "data.schoolCode": schoolCode
      });

    // Transform grades into the format expected by the frontend
    const gradesMap: { [studentCode: string]: { score: number; studentName: string } } = {};
    grades.forEach(grade => {
      gradesMap[grade.studentCode] = {
        score: grade.score,
        studentName: grade.studentName
      };
    });

    // Prepare the response data
    const gradeListData = {
      _id: gradeList._id,
      title: gradeList.title,
      classData: classData,
      subjectData: courseData ? {
        courseCode: courseData.data.courseCode,
        courseName: courseData.data.courseName,
        Grade: courseData.data.Grade,
        vahed: courseData.data.vahed,
        major: courseData.data.major
      } : {
        courseCode: gradeList.courseCode,
        courseName: gradeList.courseName,
        Grade: "",
        vahed: 0,
        major: ""
      },
      grades: gradesMap,
      statistics: gradeList.statistics,
      createdAt: gradeList.createdAt,
      updatedAt: gradeList.updatedAt
    };

    return NextResponse.json({ gradeListData });
  } catch (error) {
    console.error("Error fetching grade list:", error);
    return NextResponse.json(
      { error: "Failed to fetch grade list" },
      { status: 500 }
    );
  }
}