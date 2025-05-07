import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Parse the request body
    const { collection, field } = await request.json();
    
    if (!collection || !field) {
      logger.warn(`Missing collection or field in request for domain: ${domain}`);
      return NextResponse.json({ error: 'Collection and field are required' }, { status: 400 });
    }
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    logger.info(`Connected to database for domain: ${domain}, fetching max value from ${collection}.${field}`);
    
    // Get the specified collection
    const dbCollection = connection.collection(collection);
    
    // Build a pipeline to find the maximum value
    // Handle both top-level fields and nested fields (with dot notation)
    const fieldPath = field.includes('.') ? field : `data.${field}`;
    
    const pipeline = [
      {
        $group: {
          _id: null,
          maxValue: { $max: { $toDouble: `$${fieldPath}` } } // Convert to number if possible
        }
      }
    ];
    
    const result = await dbCollection.aggregate(pipeline).toArray();
    
    // Extract the max value or return 0 if no results
    const maxValue = result.length > 0 && result[0].maxValue !== null 
      ? result[0].maxValue 
      : 0;
    
    logger.info(`Successfully retrieved max value for ${collection}.${field}: ${maxValue}`);
    
    return NextResponse.json({ maxValue });
  } catch (error) {
    logger.error('Error fetching max value:', error);
    return NextResponse.json(
      { error: 'Failed to fetch max value', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 