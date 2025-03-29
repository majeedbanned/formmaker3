import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Required parameter missing: id is required' },
        { status: 400 }
      );
    }

    // Get connection string
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
      // Delete the form input
      const result = await mongoose.connection
        .collection('formsInput')
        .deleteOne({ _id: new mongoose.Types.ObjectId(id) });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: 'Form input not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Form input deleted successfully',
      });
    } catch (dbError) {
      console.error('Database delete error:', dbError);
      return NextResponse.json(
        { error: 'Error deleting from the database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting form input:', error);
    return NextResponse.json(
      { error: 'Failed to delete form input' },
      { status: 500 }
    );
  }
} 