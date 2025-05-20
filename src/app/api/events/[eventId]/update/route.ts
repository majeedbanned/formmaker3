import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

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

    // Only allow school or teacher roles
    if (user.userType !== "school" && user.userType !== "teacher") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { eventId } = params;
    const body = await request.json();

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

    // Validate required fields
    const { title, persianDate } = body;
    if (!title || !persianDate) {
      return NextResponse.json(
        { error: "Title and persianDate are required" },
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
          { error: "Event not found or you don't have permission to update it" },
          { status: 404 }
        );
      }

      // For teachers, check if they own the event
      if (user.userType === "teacher" && existingEvent.teacherCode !== user.username) {
        return NextResponse.json(
          { error: "You don't have permission to update this event" },
          { status: 403 }
        );
      }

      // Update the event
      const updateResult = await eventsCollection.updateOne(
        { _id: new ObjectId(eventId) },
        { 
          $set: { 
            ...body,
            updatedAt: new Date() 
          } 
        }
      );

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      // Fetch the updated event
      const updatedEvent = await eventsCollection.findOne({ _id: new ObjectId(eventId) });

      logger.info(`Successfully updated event with ID: ${eventId}`);
      // Return the updated event
      return NextResponse.json(updatedEvent);
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