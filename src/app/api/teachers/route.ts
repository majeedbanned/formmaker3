import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// GET - Fetch all teachers for the current user's school
export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching teachers for domain: ${domain}, schoolCode: ${user.schoolCode}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the teachers collection directly from the connection
      const teachersCollection = connection.collection("teachers");

      // Query for teachers in the user's school
      const query = { "data.schoolCode": user.schoolCode };
      
      // Fetch teachers from the database
      const teachers = await teachersCollection.find(query).toArray();

      logger.info(`Found ${teachers.length} teachers for school ${user.schoolCode}`);
      
      // Transform the data to match the expected format in the frontend
      const transformedTeachers = teachers.map(teacher => {
        const teacherData = teacher.data || teacher;
        return {
          _id: teacher._id,
          username: teacherData.teacherCode,
          firstName: teacherData.teacherName ? teacherData.teacherName.split(' ')[0] : '',
          lastName: teacherData.teacherName ? teacherData.teacherName.split(' ').slice(1).join(' ') : '',
          teacherCode: teacherData.teacherCode,
          teacherName: teacherData.teacherName,
          data: teacherData
        };
      });

      // Return the teachers data
      return NextResponse.json(transformedTeachers || []);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing teachers request:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
} 