import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get("courseCode");
    const schoolCode = searchParams.get("schoolCode");

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching course data for domain: ${domain}, courseCode: ${courseCode}, schoolCode: ${schoolCode}`);

    // Validate schoolCode is required
    if (!schoolCode) {
      return NextResponse.json(
        { error: "Required parameter missing: schoolCode" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the courses collection directly from the connection
      const coursesCollection = connection.collection("courses");

      // Build query based on available parameters
      const query: Record<string, unknown> = {
        "data.schoolCode": schoolCode,
      };

      // Add courseCode to query if provided
      if (courseCode) {
        query["data.courseCode"] = courseCode;
      }

      const courses = await coursesCollection.find(query).toArray();
      
      // Transform the data to simplify the structure and return both courseCode and courseName
      const transformedCourses = courses.map(course => {
        // Extract data from MongoDB document
        const data = course.data || {};
        
        return {
          courseCode: data.courseCode,
          courseName: data.courseName || data.courseCode,
          schoolCode: data.schoolCode,
          vahed: data.vahed,
        };
      });

      logger.info(`Found ${courses.length} courses for schoolCode: ${schoolCode}${courseCode ? `, courseCode: ${courseCode}` : ''}`);
      
      return NextResponse.json(transformedCourses);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error fetching course data:", error);
    return NextResponse.json(
      { error: "Failed to fetch course data" },
      { status: 500 }
    );
  }
} 