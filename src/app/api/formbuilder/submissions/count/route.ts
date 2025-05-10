import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// Get submission counts for given forms
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    logger.info(`Fetching form submission counts for domain: ${domain}, formId: ${formId}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the formsInput collection
      const formsInputCollection = connection.collection('formsInput');
      
      // If a specific formId is provided, return count for that form
      if (formId) {
        const count = await formsInputCollection.countDocuments({ formId });
        return NextResponse.json({ count });
      }
      
      // Otherwise, get counts for all forms
      const counts = await formsInputCollection.aggregate([
        { $group: { _id: "$formId", count: { $sum: 1 } } }
      ]).toArray();
      
      return NextResponse.json({
        counts: counts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>)
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error fetching form submission counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission counts' },
      { status: 500 }
    );
  }
} 