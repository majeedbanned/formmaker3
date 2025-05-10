import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { ObjectId } from 'mongodb';

// Get all forms with pagination and filtering capabilities
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Get domain from request headers (set by middleware)
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    logger.info(`Processing formbuilder API request for domain: ${domain}`);
    
    try {
      // Connect to the domain-specific MongoDB database
      const connection = await connectToDatabase(domain);
      
      // Build the query filter
      const filter: Record<string, unknown> = {};
      
      // Add search functionality if provided
      if (search) {
        filter['$or'] = [
          { title: { $regex: search, $options: 'i' } },
          { 'fields.label': { $regex: search, $options: 'i' } }
        ];
      }
      
      // Calculate pagination values
      const skip = (page - 1) * limit;
      
      // Create sort options
      const sortOptions: Record<string, 1 | -1> = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      // Get collection directly from the connection
      const collection = connection.collection('forms');
      
      // Count total documents matching the filter
      const total = await collection.countDocuments(filter);
      
      // Get forms with pagination
      const forms = await collection
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray();
      
      return NextResponse.json({
        forms,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (dbError) {
      logger.error(`Database query error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forms data' },
      { status: 500 }
    );
  }
}

// Create a new form
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const formData = await request.json();
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    logger.info(`Creating new form in formbuilder for domain: ${domain}`);
    
    // Validate required fields
    if (!formData.title) {
      return NextResponse.json(
        { error: 'Form title is required', errorFa: 'عنوان فرم الزامی است' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(formData.fields)) {
      return NextResponse.json(
        { error: 'Form fields must be an array', errorFa: 'فیلدهای فرم باید به صورت آرایه باشند' },
        { status: 400 }
      );
    }
    
    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the forms collection
      const formsCollection = connection.collection('forms');
      
      // Prepare form document with timestamps
      const formDocument = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add creation metadata
      formDocument.metadata = {
        ...formDocument.metadata,
        createdBy: request.headers.get('x-user') || 'unknown',
        version: 1,
        status: 'draft', // Possible values: draft, published, archived
        _id: new ObjectId() // Using ObjectId here to fix linter error
      };
      
      // Insert the new form
      const result = await formsCollection.insertOne(formDocument);
      
      // Return the created form with ID
      return NextResponse.json({
        ...formDocument,
        _id: result.insertedId,
        message: 'Form created successfully',
        messageFa: 'فرم با موفقیت ایجاد شد'
      }, { status: 201 });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error saving to database', errorFa: 'خطا در ذخیره‌سازی در پایگاه داده' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error creating form:', error);
    return NextResponse.json(
      { error: 'Failed to create form', errorFa: 'ایجاد فرم با شکست مواجه شد' },
      { status: 500 }
    );
  }
} 