import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, getDynamicModel } from "@/lib/mongodb";
import mongoose from "mongoose";

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

    // Validate required parameters
    if (!schoolCode || !teacherCode || !courseCode || !classCode || !date || !timeSlot) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Connect to the database
    const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI || "mongodb://localhost:27017/formmaker";
    await connectToDatabase(MONGODB_URI);

    // Get the model
    const EventModel = getDynamicModel("events");

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
    const events = await EventModel.find(query).lean();

    // Return the events
    return NextResponse.json(events || []);
  } catch (error) {
    console.error("Error fetching events:", error);
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

    // Connect to the database
    const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI || "mongodb://localhost:27017/formmaker";
    await connectToDatabase(MONGODB_URI);

    // Get the model
    const EventModel = getDynamicModel("events");

    // Create new event
    const newEvent = new EventModel({
      _id: new mongoose.Types.ObjectId(),
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
    });

    // Save to database
    await newEvent.save();

    // Return the created event
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
} 