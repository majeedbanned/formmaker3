import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// API route for updating existing questions
export async function PUT(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    console.log(`Updating question for domain: ${domain}`);

    // Parse the request body
    const questionData = await request.json();

    // Check for required fields
    if (!questionData._id) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Validate updatedBy (user ID)
    if (!questionData.updatedBy) {
      return NextResponse.json(
        { error: 'User ID is required for tracking updates' },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const db = await connectToDatabase(domain);
      
      // Create a copy of question data to modify
      const updateData = { ...questionData };
      
      // Convert string _id to ObjectId for MongoDB
      const questionId = new ObjectId(questionData._id);
      
      // Remove fields that shouldn't be directly updated
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.createdBy;
      
      // Add metadata for the update
      updateData.updatedAt = new Date();
      
      // Perform the update
      const result = await db.collection('questions').updateOne(
        { _id: questionId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { message: 'No changes were made to the question' },
          { status: 200 }
        );
      }

      console.log(`Successfully updated question ${questionId} for domain: ${domain}`);
      return NextResponse.json({
        success: true,
        message: 'Question updated successfully',
        modifiedCount: result.modifiedCount
      });
    } catch (dbError) {
      console.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
} 