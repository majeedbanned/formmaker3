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

// Update an existing form submission
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Parse request body
    const data = await request.json();
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    console.log(`Updating form submission with ID: ${params.id} for domain: ${domain}`);
    
    // Validate required fields
    const requiredFields = ['formId', 'answers'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          errorFa: `فیلدهای ضروری وجود ندارند: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the formsInput collection
      const formsInputCollection = connection.collection('formsInput');
      
      // Check if the form entry exists
      const existingEntry = await formsInputCollection.findOne({
        _id: new ObjectId(params.id)
      });
      
      if (!existingEntry) {
        return NextResponse.json(
          { error: 'Form submission not found', errorFa: 'پاسخ فرم یافت نشد' },
          { status: 404 }
        );
      }
      
      // Prepare update data
      const updateData: {
        answers: Record<string, unknown>;
        updatedAt: Date;
        username?: string;
        userName?: string;
        userFamily?: string;
        userType?: string;
        submittedBy?: string;
      } = {
        answers: data.answers,
        updatedAt: new Date()
      };

      // Add user information if provided
      if (data.userInfo) {
        updateData.username = data.userInfo.username;
        updateData.userName = data.userInfo.userName;
        updateData.userFamily = data.userInfo.userFamily;
        updateData.userType = data.userInfo.userType;
        updateData.submittedBy = data.userInfo.username;
      }

      // Update the form submission
      const result = await formsInputCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: updateData }
      );
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Form submission updated successfully',
        messageFa: 'پاسخ فرم با موفقیت بروزرسانی شد',
        updated: result.modifiedCount > 0
      });
    } catch (dbError) {
      console.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error updating the database', errorFa: 'خطا در بروزرسانی پایگاه داده' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing form submission update:', error);
    return NextResponse.json(
      { error: 'Failed to process form submission update', errorFa: 'خطا در پردازش بروزرسانی پاسخ فرم' },
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