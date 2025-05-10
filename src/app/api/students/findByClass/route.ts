import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Get classCode from query parameters
    const searchParams = new URL(request.url).searchParams;
    const classCode = searchParams.get('classCode');
    
    if (!classCode) {
      return NextResponse.json(
        { error: 'Missing classCode parameter' },
        { status: 400 }
      );
    }
    
    logger.info(`Finding students assigned to class ${classCode}`, { domain });

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('students');

    // Find students who have this class code in their classCode array
    const students = await collection.find({
      'data.classCode': {
        $elemMatch: {
          'value': classCode
        }
      }
    }).toArray();
    
    logger.info(`Found ${students.length} students assigned to class ${classCode}`, { domain });
    
    return NextResponse.json({ 
      success: true,
      data: students 
    });
    
  } catch (err) {
    logger.error('Error finding students by class:', err);
    return NextResponse.json(
      { error: 'Failed to find students' },
      { status: 500 }
    );
  }
} 