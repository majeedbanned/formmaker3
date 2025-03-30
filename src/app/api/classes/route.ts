import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, getDynamicModel } from "@/lib/mongodb";

interface ClassDocument {
  _id?: any;
  data: {
    classCode: string;
    className: string;
    schoolCode: string;
    teachers: Array<{
      teacherCode: string;
      courseCode: string;
      weeklySchedule: Array<{
        day: string;
        timeSlot: string;
      }>;
    }>;
    students: Array<{
      studentCode: number;
      studentName: string;
      studentlname: string;
      phone: string;
    }>;
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const schoolCode = searchParams.get("schoolCode");
    const teacherCode = searchParams.get("teacherCode");

    // Validate required parameter - schoolCode is always required
    if (!schoolCode) {
      return NextResponse.json(
        { error: "Missing required parameter: schoolCode" },
        { status: 400 }
      );
    }

    // Connect to the database
    const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI || "mongodb://localhost:27017/formmaker";
    await connectToDatabase(MONGODB_URI);

    // Get the classes model
    const ClassModel = getDynamicModel("classes");

    // Build the query based on available parameters
    const query: Record<string, any> = {
      'data.schoolCode': schoolCode
    };

    // If teacherCode is provided, filter by teacher
    if (teacherCode) {
      query['data.teachers'] = {
        $elemMatch: {
          teacherCode: teacherCode
        }
      };
    }

    // Fetch classes from the database
    const classes = await ClassModel.find(query).lean().exec();
    
    // Convert the database results to the expected response format
    const responseData = (classes as ClassDocument[]).map(classObj => ({ data: classObj.data }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes from database" },
      { status: 500 }
    );
  }
} 