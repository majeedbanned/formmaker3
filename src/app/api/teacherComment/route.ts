import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, getDynamicModel } from "@/lib/mongodb";
import mongoose from "mongoose";

// GET - Fetch a teacher comment
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
    const TeacherCommentModel = getDynamicModel("teacherComments");

    // Build the query
    const query = {
      schoolCode,
      teacherCode,
      courseCode,
      classCode,
      date,
      timeSlot,
    };

    // Fetch comment from the database
    const comment = await TeacherCommentModel.findOne(query).lean();

    // Return the comment (may be null if not found)
    return NextResponse.json(comment || null);
  } catch (error) {
    console.error("Error fetching teacher comment:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher comment" },
      { status: 500 }
    );
  }
}

// POST - Create a new teacher comment
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    const { schoolCode, teacherCode, courseCode, classCode, date, timeSlot, comment } = body;
    
    if (!schoolCode || !teacherCode || !courseCode || !classCode || !date || !timeSlot || !comment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to the database
    const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI || "mongodb://localhost:27017/formmaker";
    await connectToDatabase(MONGODB_URI);

    // Get the model
    const TeacherCommentModel = getDynamicModel("teacherComments");

    // Check if a comment already exists
    const existingComment = await TeacherCommentModel.findOne({
      schoolCode,
      teacherCode,
      courseCode,
      classCode,
      date,
      timeSlot,
    });

    if (existingComment) {
      return NextResponse.json(
        { error: "Comment already exists for this date and time slot. Use PUT to update." },
        { status: 409 }
      );
    }

    // Create new comment
    const newComment = new TeacherCommentModel({
      _id: new mongoose.Types.ObjectId(),
      schoolCode,
      teacherCode,
      courseCode,
      classCode,
      date,
      timeSlot,
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save to database
    await newComment.save();

    // Return the created comment
    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Error creating teacher comment:", error);
    return NextResponse.json(
      { error: "Failed to create teacher comment" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing teacher comment
export async function PUT(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    const { _id, schoolCode, teacherCode, courseCode, classCode, date, timeSlot, comment } = body;
    
    if (!schoolCode || !teacherCode || !courseCode || !classCode || !date || !timeSlot || !comment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to the database
    const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI || "mongodb://localhost:27017/formmaker";
    await connectToDatabase(MONGODB_URI);

    // Get the model
    const TeacherCommentModel = getDynamicModel("teacherComments");

    // Build the query
    const query = {
      schoolCode,
      teacherCode,
      courseCode,
      classCode,
      date,
      timeSlot,
    };

    // Add _id to query if provided
    if (_id) {
      query._id = _id;
    }

    // Update the comment
    const updateResult = await TeacherCommentModel.findOneAndUpdate(
      query,
      { 
        $set: { 
          comment,
          updatedAt: new Date()
        } 
      },
      { 
        new: true, // Return the updated document
        upsert: true // Create if it doesn't exist
      }
    );

    // Return the updated comment
    return NextResponse.json(updateResult);
  } catch (error) {
    console.error("Error updating teacher comment:", error);
    return NextResponse.json(
      { error: "Failed to update teacher comment" },
      { status: 500 }
    );
  }
} 