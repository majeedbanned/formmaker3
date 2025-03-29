import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const formId = searchParams.get('formId');
    const username = searchParams.get('username');
    const schoolCode = searchParams.get('schoolCode');
    
    // Validate required parameters
    if (!formId || !username) {
      return NextResponse.json(
        { 
          error: 'Required parameters missing', 
          missing: !formId ? 'formId' : 'username' 
        }, 
        { status: 400 }
      );
    }
    
    // Get connection string from environment variable
    const connectionString = process.env.NEXT_PUBLIC_MONGODB_URI;
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
      
      // Return appropriate response
      if (submission) {
        return NextResponse.json({
          success: true,
          found: true,
          submission
        });
      } else {
        return NextResponse.json({
          success: true,
          found: false
        });
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching user submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user submission' },
      { status: 500 }
    );
  }
} 