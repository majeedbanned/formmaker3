import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// GET - Fetch events for a specific teacher
export async function GET(
  request: NextRequest,
  { params }: { params: { teacherCode: string } }
) {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { teacherCode } = params;
    
    // Teachers can only view their own events
    if (user.userType === "teacher" && user.username !== teacherCode) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const courseCode = searchParams.get("courseCode");
    const classCode = searchParams.get("classCode");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching events for teacher: ${teacherCode}, domain: ${domain}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the events collection
      const eventsCollection = connection.collection("events");

      // Build the query filter
      const filter: Record<string, any> = {
        schoolCode: user.schoolCode,
        teacherCode
      };

      // Apply additional filters if provided
      if (courseCode) {
        filter.courseCode = courseCode;
      }
      
      if (classCode) {
        filter.classCode = classCode;
      }
      
      // Apply date range filters
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = startDate;
        if (endDate) filter.date.$lte = endDate;
      }

      // Fetch events
      const events = await eventsCollection.find(filter).sort({ date: 1, timeSlot: 1 }).toArray();

      // Log success
      logger.info(`Successfully fetched ${events.length} events for teacher: ${teacherCode}`);
      
      // Return the events
      return NextResponse.json(events);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error fetching teacher events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
} 