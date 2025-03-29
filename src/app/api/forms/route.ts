import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const schoolCode = searchParams.get('schoolCode');
    
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
    
    // Build the query filter
    const filter: Record<string, unknown> = {};
    if (schoolCode) {
      filter['data.schoolCode'] = schoolCode;
    }
    
    // Calculate pagination values
    const skip = (page - 1) * limit;
    
    try {
      // Get forms collection
      const collection = mongoose.connection.collection('forms');
      
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
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forms data' },
      { status: 500 }
    );
  }
} 