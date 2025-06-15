import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../../chatbot7/config/route";
import { ObjectId } from "mongodb";

interface NumericalStudentData {
  studentCode: string;
  studentName: string;
  score?: number;
  rank?: number;
  differenceFromAverage?: number;
  percentile?: number;
  status?: "excellent" | "good" | "average" | "poor" | "failing";
}

interface DescriptiveStudentData {
  studentCode: string;
  studentName: string;
  descriptiveText: string;
}

type StudentData = NumericalStudentData | DescriptiveStudentData;

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

    // Fetch school info
    const school = await connection
      .collection("schools")
      .findOne({
        "data.schoolCode": schoolCode
      });

    // Fetch teacher info
    const teacher = await connection
      .collection("teachers")
      .findOne({
        "data.teacherCode": gradeList.teacherCode,
        "data.schoolCode": schoolCode
      });

    const isNumerical = gradeList.gradingType === "numerical";
    let studentsWithAnalytics: StudentData[];

    if (isNumerical) {
      // Calculate detailed analytics for numerical grades
      const scores = grades
        .filter(g => g.score !== undefined)
        .map(g => g.score)
        .sort((a, b) => b - a);
      
    const average = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    // Calculate rankings and percentiles
      const numericalData: NumericalStudentData[] = grades.map(grade => {
        if (grade.score === undefined) {
          return {
            studentCode: grade.studentCode,
            studentName: grade.studentName,
            score: undefined
          };
        }

      const rank = scores.findIndex(score => score === grade.score) + 1;
      const percentile = ((scores.length - rank + 1) / scores.length) * 100;
      const differenceFromAverage = grade.score - average;
      
      let status: "excellent" | "good" | "average" | "poor" | "failing";
      if (grade.score >= 18) status = "excellent";
      else if (grade.score >= 15) status = "good";
      else if (grade.score >= 12) status = "average";
      else if (grade.score >= 10) status = "poor";
      else status = "failing";

      return {
        studentCode: grade.studentCode,
        studentName: grade.studentName,
        score: grade.score,
        rank,
        differenceFromAverage,
        percentile,
        status
      };
      }).sort((a, b) => {
        // Sort by score descending, undefined scores last
        if (a.score === undefined && b.score === undefined) return 0;
        if (a.score === undefined) return 1;
        if (b.score === undefined) return -1;
        return b.score - a.score;
      });

    // Recalculate ranks to handle ties properly
    let currentRank = 1;
      numericalData.forEach((student, index) => {
        if (student.score !== undefined) {
          if (index > 0 && 
              numericalData[index - 1].score !== undefined && 
              student.score < numericalData[index - 1].score!) {
        currentRank = index + 1;
      }
      student.rank = currentRank;
        }
    });

      studentsWithAnalytics = numericalData;
    } else {
      // For descriptive grades, just return basic student info with descriptive text
      const descriptiveData: DescriptiveStudentData[] = grades.map(grade => ({
        studentCode: grade.studentCode,
        studentName: grade.studentName,
        descriptiveText: grade.descriptiveText || ""
      })).sort((a, b) => a.studentName.localeCompare(b.studentName, 'fa'));

      studentsWithAnalytics = descriptiveData;
    }

    const reportData = {
      gradeList: {
        _id: gradeList._id,
        title: gradeList.title,
        gradeDate: gradeList.gradeDate,
        gradingType: gradeList.gradingType || "numerical",
        classCode: gradeList.classCode,
        className: gradeList.className,
        courseCode: gradeList.courseCode,
        courseName: gradeList.courseName,
        teacherCode: gradeList.teacherCode,
        statistics: gradeList.statistics
      },
      students: studentsWithAnalytics,
      teacherName: teacher ? `${teacher.data.teacherName} ${teacher.data.teacherlname || ''}`.trim() : 'نامشخص',
      schoolName: school ? school.data.schoolName : 'مدرسه'
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error fetching grade report:", error);
    return NextResponse.json(
      { error: "Failed to fetch grade report" },
      { status: 500 }
    );
  }
} 