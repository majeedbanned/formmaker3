import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Get current Persian date and time
function getPersianDateTime() {
  const now = new Date();
  
  // Create Persian date formatter
  const persianDateFormatter = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Create Persian time formatter
  const persianTimeFormatter = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  return {
    persianDate: persianDateFormatter.format(now),
    persianTime: persianTimeFormatter.format(now)
  };
}

// Handler for POST requests (new form submissions)
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const data = await req.json();

    // Validate required fields
    const requiredFields = ["formId", "formName", "schoolCode", "username", "answers"];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          missingFields 
        }, 
        { status: 400 }
      );
    }

    // Get connection string
    const connectionString = process.env.NEXT_PUBLIC_MONGODB_URI;
    if (!connectionString) {
      return NextResponse.json(
        { error: "Database connection string is not configured" },
        { status: 500 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase(connectionString);

    try {
      // Prepare the form input data
      const formInput = {
        formId: data.formId,
        formName: data.formName,
        schoolCode: data.schoolCode,
        username: data.username,
        answers: data.answers,
        persianDate: data.persianDate || null,
        persianTime: data.persianTime || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert or update the form input
      let responseId = data._id;
      
      if (data._id) {
        // Update existing submission
        const updateResult = await mongoose.connection
          .collection("formsInput")
          .updateOne(
            { _id: new mongoose.Types.ObjectId(data._id) },
            { $set: { 
                answers: data.answers,
                persianDate: data.persianDate || null,
                persianTime: data.persianTime || null,
                updatedAt: new Date()
              } 
            }
          );
        
        if (updateResult.matchedCount === 0) {
          return NextResponse.json(
            { error: "Form input not found" },
            { status: 404 }
          );
        }
      } else {
        // Insert new submission
        const insertResult = await mongoose.connection
          .collection("formsInput")
          .insertOne(formInput);
          
        responseId = insertResult.insertedId.toString();
      }

      return NextResponse.json({
        success: true,
        message: data._id ? "Form input updated successfully" : "Form input submitted successfully",
        id: responseId,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Error operating on the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing form input submission:", error);
    return NextResponse.json(
      { error: "Failed to process form input submission" },
      { status: 500 }
    );
  }
}

// Handler for PUT requests (updating existing form submissions)
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Extract required fields
    const { formId, schoolCode, existingId } = formData;
    
    // Validate required fields
    if (!formId || !schoolCode) {
      return NextResponse.json(
        { error: 'formId and schoolCode are required fields' }, 
        { status: 400 }
      );
    }
    
    if (!existingId) {
      return NextResponse.json(
        { error: 'existingId is required for updates' }, 
        { status: 400 }
      );
    }
    
    // Get MongoDB connection string
    const connectionString = process.env.NEXT_PUBLIC_MONGODB_URI;
    
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Database connection string is not configured' }, 
        { status: 500 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase(connectionString);
    
    try {
      // Validate ObjectId format
      let objectId;
      try {
        objectId = new mongoose.Types.ObjectId(formData.existingId);
      } catch (error) {
        console.error("Invalid ObjectId format:", error);
        return NextResponse.json({ error: 'Invalid submission ID format' }, { status: 400 });
      }
      
      // Get Persian date and time
      const { persianDate, persianTime } = getPersianDateTime();
      
      // Prepare document update
      const updateData = {
        $set: {
          answers: formData.answers || {},
          persianDate,
          persianTime,
          updatedAt: new Date()
        }
      };
      
      // Update the existing document
      const result = await mongoose.connection.collection('formsInput').updateOne(
        { _id: objectId },
        updateData
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'No matching submission found with that ID' },
          { status: 404 }
        );
      }
      
      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { warning: 'No changes were made to the submission' },
          { status: 200 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Form updated successfully'
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json(
        { error: 'Error updating form submission' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing form update:', error);
    return NextResponse.json(
      { error: 'Failed to process form update' },
      { status: 500 }
    );
  }
} 