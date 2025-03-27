import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, getDynamicModel } from "@/lib/mongodb";
import mongoose from "mongoose";

// DELETE - Delete an event by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    // Validate event ID
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    // Connect to the database
    const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI || "mongodb://localhost:27017/formmaker";
    await connectToDatabase(MONGODB_URI);

    // Get the model
    const EventModel = getDynamicModel("events");

    // Delete the event
    const result = await EventModel.deleteOne({ _id: eventId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Return success
    return NextResponse.json(
      { success: true, message: "Event deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
} 