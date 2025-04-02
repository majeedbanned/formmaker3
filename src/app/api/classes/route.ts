import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const schoolCode = searchParams.get("schoolCode");
    const teacherCode = searchParams.get("teacherCode");

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching classes for domain: ${domain}, schoolCode: ${schoolCode}`);

    // Validate required parameter - schoolCode is always required
    if (!schoolCode) {
      return NextResponse.json(
        { error: "Missing required parameter: schoolCode" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the classes collection directly from the connection
      const classesCollection = connection.collection("classes");

      // Build the query based on available parameters
      const query: Record<string, unknown> = {
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
      const classes = await classesCollection.find(query).toArray();
      
      // Convert the database results to the expected response format
      const responseData = classes.map(classObj => ({ data: classObj.data }));

      logger.info(`Found ${responseData.length} classes for schoolCode: ${schoolCode}`);
      return NextResponse.json(responseData);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing classes request:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes from database" },
      { status: 500 }
    );
  }
} 