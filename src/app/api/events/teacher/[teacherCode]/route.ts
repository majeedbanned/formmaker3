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

    // Get teacherCode from params
    const { teacherCode } = params;
    
    // Verify user has permission to view these events
    const canAccessTeacherEvents = 
      user.userType === "school" || // School admin can access all teacher events
      (user.userType === "teacher" && user.username === teacherCode); // Teachers can only access their own events
    
    if (!canAccessTeacherEvents) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to access these events" },
        { status: 403 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching events for teacher: ${teacherCode}, domain: ${domain}`);
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the events collection
      const eventsCollection = connection.collection("events");

      // Build the query filter to get events for this teacher
      const filter = {
        schoolCode: user.schoolCode,
        teacherCode: teacherCode
      };

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