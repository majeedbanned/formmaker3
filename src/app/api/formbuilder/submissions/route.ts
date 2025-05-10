import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { ObjectId } from 'mongodb';

// Get submissions with filtering by formId
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const userId = searchParams.get('userId');
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    logger.info(`Fetching form submissions for domain: ${domain}, formId: ${formId}`);

    if (!formId) {
      return NextResponse.json({ error: 'formId is required', errorFa: 'شناسه فرم الزامی است' }, { status: 400 });
    }
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the formsInput collection
      const formsInputCollection = connection.collection('formsInput');
      
      // Build query filter
      const filter: Record<string, unknown> = { formId };
      
      // Add user filter if provided
      if (userId) {
        filter.username = userId;
      }
      
      // Calculate pagination values
      const skip = (page - 1) * limit;
      
      // Count total documents matching the filter
      const total = await formsInputCollection.countDocuments(filter);
      
      // Get submissions with pagination
      const submissions = await formsInputCollection
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      return NextResponse.json({
        submissions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error fetching form submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// Submit a form response
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json();
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    logger.info(`Processing form submission for domain: ${domain}, formId: ${data.formId}`);
    
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
      
      // Get collections
      const formsCollection = connection.collection('forms');
      const formsInputCollection = connection.collection('formsInput');
      
      // Verify the form exists
      const form = await formsCollection.findOne({ 
        _id: new ObjectId(data.formId)
      });
      
      if (!form) {
        logger.warn(`Form not found with ID: ${data.formId}`);
        return NextResponse.json({ error: 'Form not found', errorFa: 'فرم یافت نشد' }, { status: 404 });
      }
      
      // Prepare submission data
      const formInput = {
        formId: data.formId,
        formTitle: form.title,
        answers: data.answers,
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedBy: request.headers.get('x-user') || data.userId || 'anonymous',
        submissionSource: data.source || 'api',
        userAgent: request.headers.get('user-agent') || '',
        ipAddress: request.headers.get('x-forwarded-for') || ''
      };
      
      // Insert the form submission
      const result = await formsInputCollection.insertOne(formInput);
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Form submitted successfully',
        messageFa: 'فرم با موفقیت ارسال شد',
        submissionId: result.insertedId,
      }, { status: 201 });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error saving to database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error processing form submission:', error);
    return NextResponse.json(
      { error: 'Failed to process form submission' },
      { status: 500 }
    );
  }
} 