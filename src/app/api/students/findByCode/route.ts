import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Get studentCode from query parameters
    const searchParams = new URL(request.url).searchParams;
    const studentCode = searchParams.get('code');
    
    if (!studentCode) {
      return NextResponse.json(
        { error: 'Missing studentCode parameter' },
        { status: 400 }
      );
    }
    
    logger.info(`Finding student with code ${studentCode}`, { domain });

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('students');

    // Find students with exact match of studentCode, supporting string comparison
    const students = await collection.find({
      'data.studentCode': studentCode
    }).toArray();
    
    logger.info(`Found ${students.length} students with code ${studentCode}`, { domain });
    
    return NextResponse.json({ 
      success: true,
      data: students 
    });
    
  } catch (err) {
    logger.error('Error finding student by code:', err);
    return NextResponse.json(
      { error: 'Failed to find student' },
      { status: 500 }
    );
  }
} 