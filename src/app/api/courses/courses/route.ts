import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// GET - Fetch all courses for the current user's school
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
    logger.info(`Fetching courses for domain: ${domain}, schoolCode: ${user.schoolCode}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the courses collection directly from the connection
      const coursesCollection = connection.collection("courses");

      // Query for courses in the user's school
      const query = { "data.schoolCode": user.schoolCode };
      
      // Fetch courses from the database
      const courses = await coursesCollection.find(query).toArray();

      logger.info(`Found ${courses.length} courses for school ${user.schoolCode}`);
      
      // Transform the data to match the expected format in the frontend
      const transformedCourses = courses.map(course => {
        const courseData = course.data || course;
        return {
          _id: course._id,
          courseCode: courseData.courseCode,
          courseName: courseData.courseName,
          data: courseData
        };
      });

      // Return the courses data
      return NextResponse.json(transformedCourses || []);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing courses request:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
} 