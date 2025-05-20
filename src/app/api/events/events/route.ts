import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// GET - Fetch events
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const teacherCode = searchParams.get("teacherCode");
    const courseCode = searchParams.get("courseCode");
    const classCode = searchParams.get("classCode");
    const date = searchParams.get("date");
    const timeSlot = searchParams.get("timeSlot");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching events for domain: ${domain}, user: ${user.username}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the events collection directly from the connection
      const eventsCollection = connection.collection("events");

      // Build the query
      const query: Record<string, any> = {
        schoolCode: user.schoolCode
      };

      // For teachers, only show their events
      if (user.userType === "teacher") {
        query.teacherCode = user.username;
      } else if (teacherCode && user.userType === "school") {
        // Admin can filter by teacher
        query.teacherCode = teacherCode;
      }

      // Apply additional filters if provided
      if (courseCode) query.courseCode = courseCode;
      if (classCode) query.classCode = classCode;
      if (timeSlot) query.timeSlot = timeSlot;
      
      // Handle date filtering
      if (date) {
        query.date = date;
      } else {
        // Use date range if provided
        if (startDate || endDate) {
          query.date = {};
          if (startDate) query.date.$gte = startDate;
          if (endDate) query.date.$lte = endDate;
        }
      }

      // Fetch events from the database
      const events = await eventsCollection.find(query).sort({ date: 1, timeSlot: 1 }).toArray();

      logger.info(`Found ${events.length} events for user ${user.username}`);
      // Return the events
      return NextResponse.json(events || []);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing events request:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST - Create a new event
export async function POST(request: NextRequest) {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow school or teacher roles
    if (user.userType !== "school" && user.userType !== "teacher") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    
    // Validate required fields
    const { teacherCode, courseCode, classCode, date, timeSlot, title, description, persianDate } = body;
    
    if (!teacherCode || !courseCode || !classCode || !date || !timeSlot || !title || !persianDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For teachers, verify they're creating their own event
    if (user.userType === "teacher" && teacherCode !== user.username) {
      return NextResponse.json(
        { error: "You can only create events for yourself" },
        { status: 403 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Creating event for domain: ${domain}, user: ${user.username}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the events collection directly from the connection
      const eventsCollection = connection.collection("events");

      // Create new event document
      const newEvent = {
        _id: new ObjectId(),
        schoolCode: user.schoolCode,
        teacherCode,
        courseCode,
        classCode,
        date,
        timeSlot,
        title,
        description: description || '',
        persianDate,
        createdBy: user.username,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert into database
      const result = await eventsCollection.insertOne(newEvent);

      if (!result.acknowledged) {
        throw new Error("Failed to insert event");
      }

      logger.info(`Created new event with ID: ${newEvent._id}`);
      // Return the created event
      return NextResponse.json(newEvent, { status: 201 });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
} 