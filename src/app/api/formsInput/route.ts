import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    // Get form submission data from request body
    const formData = await request.json();
    
    // Validate required fields
    if (!formData.formId || !formData.schoolCode) {
      return NextResponse.json(
        { error: 'Required fields missing: formId and schoolCode are required' }, 
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
    
    // Prepare document to insert
    const formSubmission = {
      formId: formData.formId,
      schoolCode: formData.schoolCode,
      username: formData.username || 'anonymous',
      answers: formData.answers || {},
      formName: formData.formName || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      // Insert into formsInput collection
      const result = await mongoose.connection.collection('formsInput').insertOne(formSubmission);
      
      if (result.acknowledged) {
        return NextResponse.json({
          success: true,
          message: 'Form submitted successfully',
          submissionId: result.insertedId
        }, { status: 201 });
      } else {
        throw new Error('Failed to insert document');
      }
    } catch (dbError) {
      console.error('Database insertion error:', dbError);
      return NextResponse.json(
        { error: 'Error saving form submission' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing form submission:', error);
    return NextResponse.json(
      { error: 'Failed to process form submission' },
      { status: 500 }
    );
  }
} 