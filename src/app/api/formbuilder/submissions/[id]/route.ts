import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logger } from '@/lib/logger';

// Get a specific form submission by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    if (!id) {
      logger.warn(`Missing submission ID in request for domain: ${domain}`);
      return NextResponse.json({ error: 'Submission ID is required', errorFa: 'شناسه ارسال الزامی است' }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      logger.warn(`Invalid submission ID format: ${id} for domain: ${domain}`);
      return NextResponse.json({ error: 'Invalid submission ID format', errorFa: 'فرمت شناسه ارسال نامعتبر است' }, { status: 400 });
    }
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the formsInput collection
      const formsInputCollection = connection.collection('formsInput');
      
      // Query the submission
      const submission = await formsInputCollection.findOne({ 
        _id: new ObjectId(id) 
      });
      
      if (!submission) {
        logger.warn(`Submission not found with ID: ${id} for domain: ${domain}`);
        return NextResponse.json({ error: 'Submission not found', errorFa: 'ارسال یافت نشد' }, { status: 404 });
      }
      
      // Get the form details to include in the response
      const formsCollection = connection.collection('forms');
      const form = await formsCollection.findOne({ 
        _id: new ObjectId(submission.formId)
      }, {
        projection: { title: 1, fields: 1 }
      });
      
      // Return the submission with form structure
      return NextResponse.json({
        ...submission,
        form
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error fetching form submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission data' },
      { status: 500 }
    );
  }
}

// Update a form submission
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    if (!id) {
      logger.warn(`Missing submission ID in update request for domain: ${domain}`);
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      logger.warn(`Invalid submission ID format: ${id} for domain: ${domain}`);
      return NextResponse.json({ error: 'Invalid submission ID format' }, { status: 400 });
    }
    
    // Validate answers data
    if (!data.answers || typeof data.answers !== 'object') {
      return NextResponse.json(
        { error: 'answers object is required', errorFa: 'پاسخ‌ها الزامی هستند' },
        { status: 400 }
      );
    }
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the formsInput collection
      const formsInputCollection = connection.collection('formsInput');
      
      // First check if the submission exists
      const existingSubmission = await formsInputCollection.findOne({
        _id: new ObjectId(id)
      });
      
      if (!existingSubmission) {
        logger.warn(`Submission not found with ID: ${id} for domain: ${domain}`);
        return NextResponse.json({ error: 'Submission not found', errorFa: 'ارسال یافت نشد' }, { status: 404 });
      }
      
      // Prepare the update data
      const updateData = {
        answers: data.answers,
        updatedAt: new Date(),
        lastModifiedBy: request.headers.get('x-user') || data.userId || 'unknown'
      };
      
      // Update the submission
      const result = await formsInputCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      if (!result) {
        logger.warn(`Failed to update submission with ID: ${id} for domain: ${domain}`);
        return NextResponse.json({ error: 'Failed to update submission', errorFa: 'به‌روزرسانی ارسال با شکست مواجه شد' }, { status: 500 });
      }
      
      logger.info(`Successfully updated submission with ID: ${id} for domain: ${domain}`);
      return NextResponse.json(result);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error updating the submission in database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error updating form submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}

// Delete a form submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    if (!id) {
      logger.warn(`Missing submission ID in delete request for domain: ${domain}`);
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      logger.warn(`Invalid submission ID format: ${id} for domain: ${domain}`);
      return NextResponse.json({ error: 'Invalid submission ID format' }, { status: 400 });
    }
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the formsInput collection
      const formsInputCollection = connection.collection('formsInput');
      
      // Delete the submission
      const result = await formsInputCollection.deleteOne({
        _id: new ObjectId(id)
      });
      
      if (result.deletedCount === 0) {
        logger.warn(`Submission not found for deletion with ID: ${id} for domain: ${domain}`);
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }
      
      logger.info(`Successfully deleted submission with ID: ${id} for domain: ${domain}`);
      return NextResponse.json({
        success: true,
        message: 'Submission deleted successfully',
        messageFa: 'ارسال با موفقیت حذف شد'
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error deleting the submission from database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error deleting form submission:', error);
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    );
  }
} 