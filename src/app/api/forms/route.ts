import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const schoolCode = searchParams.get('schoolCode');
    
    // Get domain from request headers (set by middleware)
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    logger.info(`Processing API request for domain: ${domain}`);
    
    try {
      // Connect to the domain-specific MongoDB database
      const connection = await connectToDatabase(domain);
      
      // Build the query filter
      const filter: Record<string, unknown> = {};
      if (schoolCode) {
        filter['data.schoolCode'] = schoolCode;
      }
      
      // Calculate pagination values
      const skip = (page - 1) * limit;
      
      // Get collection directly from the connection
      const collection = connection.collection('forms');
      
      // Count total documents matching the filter
      const total = await collection.countDocuments(filter);
      
      // Get forms with pagination
      const forms = await collection
        .find(filter)
        .sort({ updatedAt: -1 })
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