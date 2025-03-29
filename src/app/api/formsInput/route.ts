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
export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Extract required fields
    const { formId, formName, schoolCode, username } = formData;
    
    // Validate required fields
    if (!formId || !schoolCode) {
      return NextResponse.json(
        { error: 'formId and schoolCode are required fields' }, 
        { status: 400 }
      );
    }
    
    // Get MongoDB connection string
    const connectionString = process.env.MONGODB_URI;
    
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Database connection string is not configured' }, 
        { status: 500 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase(connectionString);
    
    try {
      // Get Persian date and time
      const { persianDate, persianTime } = getPersianDateTime();
      
      // Create a document for insertion
      const document = {
        formId,
        formName: formName || '',
        schoolCode,
        username: username || 'anonymous',
        answers: formData.answers || {},
        persianDate,
        persianTime,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Insert the document
      const result = await mongoose.connection.collection('formsInput').insertOne(document);
      
      return NextResponse.json({
        success: true,
        insertedId: result.insertedId,
        message: 'Form submitted successfully'
      });
    } catch (dbError) {
      console.error('Database insertion error:', dbError);
      return NextResponse.json(
        { error: 'Error inserting form submission' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing form submission:', error);
    return NextResponse.json(
      { error: 'Failed to process form submission' },
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
    const connectionString = process.env.MONGODB_URI;
    
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