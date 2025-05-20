import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// GET - Get event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching event with ID: ${eventId} for domain: ${domain}`);

    // Validate event ID
    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the events collection directly from the connection
      const eventsCollection = connection.collection("events");

      // Find the event
      const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });

      if (!event) {
        logger.warn(`Event not found with ID: ${eventId}`);
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      logger.info(`Successfully fetched event with ID: ${eventId}`);
      // Return the event
      return NextResponse.json(event);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PUT - Update an event by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
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

    const { eventId } = params;

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Updating event with ID: ${eventId} for domain: ${domain}`);

    // Validate event ID
    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    
    // Validate required fields
    const { teacherCode, courseCode, classCode, date, timeSlot, title, persianDate, isSchoolEvent } = body;
    
    if (!teacherCode || !courseCode || !classCode || !date || !timeSlot || !title || !persianDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the events collection directly from the connection
      const eventsCollection = connection.collection("events");

      // Check if the event exists and belongs to the user's school
      const existingEvent = await eventsCollection.findOne({ 
        _id: new ObjectId(eventId),
        schoolCode: user.schoolCode 
      });

      if (!existingEvent) {
        return NextResponse.json(
          { error: "Event not found or you don't have permission to edit it" },
          { status: 404 }
        );
      }

      // Check user permissions
      if (user.userType === "teacher") {
        // Teachers can only edit their own events or events they created
        if (existingEvent.teacherCode !== user.username && existingEvent.createdBy !== user.username) {
          return NextResponse.json(
            { error: "You don't have permission to edit this event" },
            { status: 403 }
          );
        }
      } else if (user.userType !== "school") {
        // Students or other users can't edit events
        return NextResponse.json(
          { error: "You don't have permission to edit events" },
          { status: 403 }
        );
      }

      // Create update data
      const updateData = {
        ...body,
        // Preserve the original creator
        createdBy: existingEvent.createdBy,
        // Only allow school users to set isSchoolEvent flag
        isSchoolEvent: user.userType === "school" ? (isSchoolEvent === true) : existingEvent.isSchoolEvent,
        updatedAt: new Date()
      };

      // Update the event
      const result = await eventsCollection.updateOne(
        { _id: new ObjectId(eventId) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      logger.info(`Successfully updated event with ID: ${eventId}`);
      
      // Return success
      return NextResponse.json({ success: true });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an event by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
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

    const { eventId } = params;

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Deleting event with ID: ${eventId} for domain: ${domain}`);

    // Validate event ID
    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the events collection directly from the connection
      const eventsCollection = connection.collection("events");

      // Check if the event exists and belongs to the user's school
      const existingEvent = await eventsCollection.findOne({ 
        _id: new ObjectId(eventId),
        schoolCode: user.schoolCode 
      });

      if (!existingEvent) {
        return NextResponse.json(
          { error: "Event not found or you don't have permission to delete it" },
          { status: 404 }
        );
      }

      // For teachers, check if they own the event or created it
      if (user.userType === "teacher" && 
          existingEvent.teacherCode !== user.username && 
          existingEvent.createdBy !== user.username) {
        return NextResponse.json(
          { error: "You don't have permission to delete this event" },
          { status: 403 }
        );
      }

      // Delete the event
      const result = await eventsCollection.deleteOne({ _id: new ObjectId(eventId) });

      if (result.deletedCount === 0) {
        logger.warn(`Event not found with ID: ${eventId}`);
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      logger.info(`Successfully deleted event with ID: ${eventId}`);
      // Return success
      return NextResponse.json(
        { success: true, message: "Event deleted successfully" },
        { status: 200 }
      );
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
} 