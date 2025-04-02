import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { ObjectId } from 'mongodb';

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

    // Get domain from request headers
    const domain = req.headers.get("x-domain") || "localhost:3000";
    logger.info(`Processing form submission for domain: ${domain}, formId: ${data.formId}, schoolCode: ${data.schoolCode}`);

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

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the formsInput collection directly from the connection
      const formsInputCollection = connection.collection("formsInput");

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
        const updateResult = await formsInputCollection.updateOne(
          { _id: new ObjectId(data._id) },
          { $set: { 
              answers: data.answers,
              persianDate: data.persianDate || null,
              persianTime: data.persianTime || null,
              updatedAt: new Date()
            } 
          }
        );
        
        if (updateResult.matchedCount === 0) {
          logger.warn(`Form input not found with ID: ${data._id}`);
          return NextResponse.json(
            { error: "Form input not found" },
            { status: 404 }
          );
        }
        
        logger.info(`Updated existing form submission with ID: ${data._id}`);
      } else {
        // Insert new submission
        const insertResult = await formsInputCollection.insertOne(formInput);
        responseId = insertResult.insertedId.toString();
        logger.info(`Created new form submission with ID: ${responseId}`);
      }

      return NextResponse.json({
        success: true,
        message: data._id ? "Form input updated successfully" : "Form input submitted successfully",
        id: responseId,
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error operating on the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing form input submission:", error);
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
    
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Updating form submission for domain: ${domain}, formId: ${formId}, schoolCode: ${schoolCode}`);
    
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
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the formsInput collection directly from the connection
      const formsInputCollection = connection.collection("formsInput");
      
      // Validate ObjectId format
      let objectId;
      try {
        objectId = new ObjectId(formData.existingId);
      } catch (error) {
        logger.error("Invalid ObjectId format:", error);
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
      const result = await formsInputCollection.updateOne(
        { _id: objectId },
        updateData
      );
      
      if (result.matchedCount === 0) {
        logger.warn(`No matching submission found with ID: ${existingId}`);
        return NextResponse.json(
          { error: 'No matching submission found with that ID' },
          { status: 404 }
        );
      }
      
      if (result.modifiedCount === 0) {
        logger.info(`No changes were made to submission with ID: ${existingId}`);
        return NextResponse.json(
          { warning: 'No changes were made to the submission' },
          { status: 200 }
        );
      }
      
      logger.info(`Successfully updated form submission with ID: ${existingId}`);
      return NextResponse.json({
        success: true,
        message: 'Form updated successfully'
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error updating form submission' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error processing form update:', error);
    return NextResponse.json(
      { error: 'Failed to process form update' },
      { status: 500 }
    );
  }
} 