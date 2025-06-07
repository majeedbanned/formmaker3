import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function GET(request: NextRequest) {
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
    const teacherCode = searchParams.get("teacherCode");

    if (!schoolCode) {
      return NextResponse.json(
        { error: "School code is required" },
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
    
    // Build query based on user type
    const query: { schoolCode: string; teacherCode?: string } = { schoolCode };
    
    // If it's a teacher, only show their grade lists
    if (user.userType === "teacher") {
      if (teacherCode && user.username !== teacherCode) {
        return NextResponse.json(
          { error: "Unauthorized to access other teacher's grade lists" },
          { status: 403 }
        );
      }
      query.teacherCode = user.username;
    } else if (teacherCode) {
      // School admin can filter by specific teacher
      query.teacherCode = teacherCode;
    }

    // Fetch grade lists
    const gradeLists = await connection
      .collection("grade_lists")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // If school admin, also fetch teacher names for display
    let teacherNames: { [key: string]: string } = {};
    if (user.userType === "school") {
      const teacherCodes = [...new Set(gradeLists.map(gl => gl.teacherCode))];
      if (teacherCodes.length > 0) {
        const teachers = await connection
          .collection("teachers")
          .find({
            "data.teacherCode": { $in: teacherCodes },
            "data.schoolCode": schoolCode
          })
          .toArray();
        
        teacherNames = teachers.reduce((acc, teacher) => {
          acc[teacher.data.teacherCode] = `${teacher.data.teacherName} ${teacher.data.teacherlname || ''}`.trim();
          return acc;
        }, {} as { [key: string]: string });
      }
    }

    // Transform the data to include teacher names for school admins
    const transformedGradeLists = gradeLists.map(gradeList => ({
      ...gradeList,
      teacherName: user.userType === "school" ? teacherNames[gradeList.teacherCode] || "نامشخص" : undefined
    }));

    return NextResponse.json({ gradeLists: transformedGradeLists });
  } catch (error) {
    console.error("Error fetching grade lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch grade lists" },
      { status: 500 }
    );
  }
} 