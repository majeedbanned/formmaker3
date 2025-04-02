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

    // Validate required parameters
    if (!courseCode || !schoolCode) {
      return NextResponse.json(
        { error: "Required parameters missing: courseCode, schoolCode" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the courses collection directly from the connection
      const coursesCollection = connection.collection("courses");

      // Query for course with the specified code and school
      const query = {
        "data.courseCode": courseCode,
        "data.schoolCode": schoolCode,
      };

      const courses = await coursesCollection.find(query).toArray();
      
      logger.info(`Found ${courses.length} courses for courseCode: ${courseCode}, schoolCode: ${schoolCode}`);
      
      return NextResponse.json(courses);
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