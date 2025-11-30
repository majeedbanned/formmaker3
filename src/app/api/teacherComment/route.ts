import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { ObjectId } from "mongodb";

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

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching teacher comment for domain: ${domain}, schoolCode: ${schoolCode}`);

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
      
      // Get the teacherComments collection directly from the connection
      const teacherCommentsCollection = connection.collection("teacherComments");

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
      const comment = await teacherCommentsCollection.findOne(query);

      logger.info(`Teacher comment ${comment ? 'found' : 'not found'} for query parameters`);
      // Return the comment (may be null if not found)
      return NextResponse.json(comment || null);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing teacher comment request:", error);
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

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Creating teacher comment for domain: ${domain}, schoolCode: ${schoolCode}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the teacherComments collection directly from the connection
      const teacherCommentsCollection = connection.collection("teacherComments");

      // Check if a comment already exists
      const existingComment = await teacherCommentsCollection.findOne({
        schoolCode,
        teacherCode,
        courseCode,
        classCode,
        date,
        timeSlot,
      });

      if (existingComment) {
        logger.warn(`Teacher comment already exists for this date and time slot: ${date}, ${timeSlot}`);
        return NextResponse.json(
          { error: "Comment already exists for this date and time slot. Use PUT to update." },
          { status: 409 }
        );
      }

      // Create new comment document
      const newComment = {
        _id: new ObjectId(),
        schoolCode,
        teacherCode,
        courseCode,
        classCode,
        date,
        timeSlot,
        comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert into database
      const result = await teacherCommentsCollection.insertOne(newComment);

      if (!result.acknowledged) {
        throw new Error("Failed to insert teacher comment");
      }

      logger.info(`Created new teacher comment with ID: ${newComment._id}`);
      // Return the created comment
      return NextResponse.json(newComment, { status: 201 });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error creating teacher comment:", error);
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

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Updating teacher comment for domain: ${domain}, schoolCode: ${schoolCode}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the teacherComments collection directly from the connection
      const teacherCommentsCollection = connection.collection("teacherComments");

      // Build the query
      const query: Record<string, unknown> = {
        schoolCode,
        teacherCode,
        courseCode,
        classCode,
        date,
        timeSlot,
      };

      // Add _id to query if provided
      if (_id) {
        query._id = new ObjectId(_id);
      }

      // Update the comment with upsert option
      const updateResult = await teacherCommentsCollection.findOneAndUpdate(
        query,
        { 
          $set: { 
            comment,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { 
          returnDocument: 'after', // Return the updated document
          upsert: true // Create if it doesn't exist
        }
      );

      logger.info(`Teacher comment updated successfully`);
      // Return the updated comment - handle potential null result
      if (updateResult) {
        return NextResponse.json(updateResult.value || { 
          success: true, 
          message: "Comment updated but could not retrieve it" 
        });
      } else {
        return NextResponse.json({ 
          error: "Failed to update comment" 
        }, { status: 500 });
      }
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error updating teacher comment:", error);
    return NextResponse.json(
      { error: "Failed to update teacher comment" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 