import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // School admins and teachers (including admin teachers) can access this endpoint
    if (user.userType !== "teacher" && user.userType !== "school") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    //const teacherCode = searchParams.get("teacherCode");
    const schoolCode = searchParams.get("schoolCode");

    if ( !schoolCode) {
      return NextResponse.json(
        { error: "Teacher code and school code are required" },
        { status: 400 }
      );
    }

    // // Additional authorization check
    // if (user.userType === "teacher" && user.username !== teacherCode) {
    //   return NextResponse.json(
    //     { error: "Unauthorized to access other teacher's classes" },
    //     { status: 403 }
    //   );
    // }

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
    
    // Find classes where the teacher teaches
    const classes = await connection
      .collection("classes")
      .find({
        "data.schoolCode": schoolCode,
       
      })
      .sort({ "data.className": 1 })
      .toArray();

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
} 