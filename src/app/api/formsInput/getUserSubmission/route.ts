import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const formId = searchParams.get('formId');
    const username = searchParams.get('username');
    const schoolCode = searchParams.get('schoolCode');
    
    // Get domain from request headers
    const domain = req.headers.get("x-domain") || "localhost:3000";
    
    // Validate required parameters
    if (!formId || !username) {
      logger.warn(`Missing required parameters for getUserSubmission on domain: ${domain}, formId: ${formId}, username: ${username}`);
      return NextResponse.json(
        { 
          error: 'Required parameters missing', 
          missing: !formId ? 'formId' : 'username' 
        }, 
        { status: 400 }
      );
    }
    
    logger.info(`Fetching user submission for domain: ${domain}, formId: ${formId}, username: ${username}, schoolCode: ${schoolCode}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the formsInput collection directly from the connection
      const formsInputCollection = connection.collection('formsInput');
      
      // Build query object
      const query: Record<string, string> = {
        formId,
        username
      };
      
      // Add schoolCode to query if provided
      if (schoolCode) {
        query.schoolCode = schoolCode;
      }
      
      // Find the user's submission for this form
      const submission = await formsInputCollection.findOne(query);
      
      // Return appropriate response
      if (submission) {
        logger.info(`Found submission for user ${username}, form ${formId} on domain: ${domain}`);
        return NextResponse.json({
          success: true,
          found: true,
          submission
        });
      } else {
        logger.info(`No submission found for user ${username}, form ${formId} on domain: ${domain}`);
        return NextResponse.json({
          success: true,
          found: false
        });
      }
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error fetching user submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user submission' },
      { status: 500 }
    );
  }
} 