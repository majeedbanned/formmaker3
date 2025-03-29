import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
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
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid form ID format' }, { status: 400 });
    }
    
    try {
      // Use raw Mongoose for the query
      const form = await mongoose.connection.collection('forms').findOne({ 
        _id: new mongoose.Types.ObjectId(id) 
      });
      
      if (!form) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }
      
      return NextResponse.json(form);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: 'Error querying the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form data' },
      { status: 500 }
    );
  }
} 