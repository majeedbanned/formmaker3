import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, getDynamicModel } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const schoolCode = searchParams.get("schoolCode");
    const teacherCode = searchParams.get("teacherCode");

    // Validate required parameters
    if (!schoolCode || !teacherCode) {
      return NextResponse.json(
        { error: "Missing required parameters: schoolCode and teacherCode" },
        { status: 400 }
      );
    }


    

    // Connect to the database
    const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI || "mongodb://localhost:27017/formmaker";
    await connectToDatabase(MONGODB_URI);

    // Get the classes model
    const ClassModel = getDynamicModel("classes");

    // Build the query to find classes where the teacher teaches
    const query = {
      'data.schoolCode': schoolCode,
      'data.teachers': {
        $elemMatch: {
          teacherCode: teacherCode
        }
      }
    };

    console.log("Executing query:", JSON.stringify(query));

    // Fetch classes from the database
    const classes = await ClassModel.find(query).lean();
    
    
    console.log(`Found ${classes.length} classes for teacher ${teacherCode} in school ${schoolCode}`);
 //console.log(( classes))

 const responseData = classes.map(classObj => ({ data: classObj.data }));
 //console.log( responseData)
    // Return the classes






    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes from database" },
      { status: 500 }
    );
  }
} 