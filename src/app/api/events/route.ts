import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { ObjectId } from "mongodb";

// GET - Fetch events
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const schoolCode = searchParams.get("schoolCode");
    const teacherCode = searchParams.get("teacherCode");
    const courseCode = searchParams.get("courseCode");
    const classCode = searchParams.get("classCode");
    const date = searchParams.get("date");
    const timeSlot = searchParams.get("timeSlot");

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching events for domain: ${domain}, schoolCode: ${schoolCode}`);

    // Validate required parameters
    if (!schoolCode || !teacherCode || !courseCode || !classCode || !date || !timeSlot) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the events collection directly from the connection
      const eventsCollection = connection.collection("events");

      // Build the query
      const query = {
        schoolCode,
        teacherCode,
        courseCode,
        classCode,
        date,
        timeSlot,
      };

      // Fetch events from the database
      const events = await eventsCollection.find(query).toArray();

      logger.info(`Found ${events.length} events for query parameters`);
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
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    const { schoolCode, teacherCode, courseCode, classCode, date, timeSlot, title, description, persianDate } = body;
    
    if (!schoolCode || !teacherCode || !courseCode || !classCode || !date || !timeSlot || !title || !persianDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Creating event for domain: ${domain}, schoolCode: ${schoolCode}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the events collection directly from the connection
      const eventsCollection = connection.collection("events");

      // Create new event document
      const newEvent = {
        _id: new ObjectId(),
        schoolCode,
        teacherCode,
        courseCode,
        classCode,
        date,
        timeSlot,
        title,
        description: description || '',
        persianDate,
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