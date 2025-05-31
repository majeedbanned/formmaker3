import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { logger } from '@/lib/logger';

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get user and verify authentication using the existing getCurrentUser function
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get school code from user
    const schoolCode = user.schoolCode;
    if (!schoolCode) {
      return NextResponse.json(
        { error: "School code not found" },
        { status: 400 }
      );
    }
    
    logger.info(`Fetching online classes for school: ${schoolCode}`);

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Processing API request for domain: ${domain}`);
    
    try {
      // Connect to the domain-specific MongoDB database
      const connection = await connectToDatabase(domain);
      
      // Build the query filter
      const filter = { "data.schoolCode": schoolCode };
      
      // Get collection directly from the connection
      const collection = connection.collection('onlineclasses');
      
      // Get online classes
      const classes = await collection
        .find(filter)
        .sort({ updatedAt: -1 })
        .toArray();
      
      logger.info(`Found ${classes.length} online classes for school: ${schoolCode}`);
      
      return NextResponse.json(classes);
    } catch (dbError) {
      logger.error(`Database query error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error fetching online classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online classes data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user and verify authentication using the existing getCurrentUser function
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get school code from user
    const schoolCode = user.schoolCode;
    if (!schoolCode) {
      return NextResponse.json(
        { error: "School code not found" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { filter = {}, sort = { updatedAt: -1 } } = body;
    
    logger.info(`Fetching filtered online classes for school: ${schoolCode}`);

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Processing POST API request for domain: ${domain}`);
    
    try {
      // Connect to the domain-specific MongoDB database
      const connection = await connectToDatabase(domain);
      
      // Ensure schoolCode is always included in the filter for security
      const finalFilter = { 
        ...filter,
        "data.schoolCode": schoolCode 
      };
      console.log("finalFilter", finalFilter);
      // Get collection directly from the connection
      const collection = connection.collection('onlineclasses');
      
      // Get online classes with custom filter
      const classes = await collection
        .find(finalFilter)
        .sort(sort)
        .toArray();
      
      logger.info(`Found ${classes.length} online classes with filter for school: ${schoolCode}`);
      
      return NextResponse.json(classes);
    } catch (dbError) {
      logger.error(`Database query error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error fetching filtered online classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filtered online classes data' },
      { status: 500 }
    );
  }
}