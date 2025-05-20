import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Define custom interface to extend the user object
interface ExtendedUser {
  id: string;
  userType: string;
  schoolCode: string;
  username: string;
  name?: string;
  role?: string;
  classcode?: Array<{value: string, [key: string]: unknown}>;
}

// GET - Fetch events for a student's classes
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

    // Only allow students to access this endpoint
    if (user.userType !== "student") {
      return NextResponse.json(
        { error: "Forbidden: Only students can access this endpoint" },
        { status: 403 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    try {
      // Get student's class codes directly from user object
      let studentClassCodes: string[] = [];
      
      // Cast user to extended type to access classcode property
      const extendedUser = user as unknown as ExtendedUser;
      
      // Extract class codes from user.classcode array if it exists
      if (Array.isArray(extendedUser.classcode)) {
        studentClassCodes = extendedUser.classcode
          .filter(item => item && typeof item === 'object' && item.value)
          .map(item => item.value);
      }
      
      if (!studentClassCodes.length) {
        logger.info(`Student ${user.username} has no classes assigned`);
        return NextResponse.json([]);
      }
      
      logger.info(`Fetching events for student: ${user.username}, classes: ${studentClassCodes.join(', ')}, domain: ${domain}`);
      
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the events collection
      const eventsCollection = connection.collection("events");

      // Build the query filter to get events for the student's classes
      const filter = {
        schoolCode: user.schoolCode,
        classCode: { $in: studentClassCodes }
      };

      // Fetch events
      const events = await eventsCollection.find(filter).sort({ date: 1, timeSlot: 1 }).toArray();

      // Log success
      logger.info(`Successfully fetched ${events.length} events for student: ${user.username}`);
      
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
    logger.error("Error fetching student events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
} 