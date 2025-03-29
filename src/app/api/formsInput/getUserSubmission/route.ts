import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    const username = searchParams.get('username');
    const schoolCode = searchParams.get('schoolCode');
    
    // Validate required parameters
    if (!formId || !username) {
      return NextResponse.json(
        { error: 'Required parameters missing: formId and username are required' }, 
        { status: 400 }
      );
    }
    
    // Get connection string from environment variable
    const connectionString = process.env.MONGODB_URI;
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Database connection string is not configured' }, 
        { status: 500 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase(connectionString);
    
    try {
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
      const submission = await mongoose.connection.collection('formsInput').findOne(query);
      
      if (!submission) {
        return NextResponse.json({
          found: false,
          message: 'No existing submission found'
        });
      }
      
      return NextResponse.json({
        found: true,
        submission
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching form submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form submission' },
      { status: 500 }
    );
  }
} 