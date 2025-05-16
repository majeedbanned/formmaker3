import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const schoolCode = searchParams.get("schoolCode");
    const classCode = searchParams.get("classCode");
    const teacherCode = searchParams.get("teacherCode");
    const studentCode = searchParams.get("studentCode");
    const courseCode = searchParams.get("courseCode");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching presence data for domain: ${domain}, schoolCode: ${schoolCode}`);

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
      
      // Get the cells collection directly from the connection
      // We're using the classsheet collection as it contains presence data
      const cellsCollection = connection.collection("classsheet");

      // Build the query based on available parameters
      const query: Record<string, any> = {
        schoolCode: schoolCode
      };

      // Add optional filters if provided
      if (classCode) {
        query.classCode = classCode;
      }

      if (teacherCode) {
        query.teacherCode = teacherCode;
      }

      if (studentCode) {
        query.studentCode = studentCode;
      }

      if (courseCode) {
        query.courseCode = courseCode;
      }

      // Handle date filtering
      if (date) {
        // For exact date matching
        // Parse the date string to a Date object
        const dateObj = new Date(date);
        
        // Set time to 00:00:00 for start of day
        dateObj.setHours(0, 0, 0, 0);
        
        // Format the date as ISO string without time
        const dateStr = dateObj.toISOString().split('T')[0];
        
        // MongoDB date query to match dates regardless of time component
        query.date = { $regex: `^${dateStr}` };
      } else if (startDate && endDate) {
        // For date range filtering
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        
        query.date = {
          $gte: startDateObj.toISOString(),
          $lte: endDateObj.toISOString()
        };
      }

      // Fetch presence data from the database
      const presenceData = await cellsCollection.find(query).toArray();
      
      logger.info(`Found ${presenceData.length} presence records for schoolCode: ${schoolCode}`);
      
      return NextResponse.json(presenceData);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing presence request:", error);
    return NextResponse.json(
      { error: "Failed to fetch presence data from database" },
      { status: 500 }
    );
  }
} 