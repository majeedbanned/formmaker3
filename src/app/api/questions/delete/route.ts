import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// API route for deleting a question
export async function DELETE(request: NextRequest) {
  try {
    // Get domain from request headers and question ID from the URL params
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const url = new URL(request.url);
    const questionId = url.searchParams.get("id");

    // Validate question ID
    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const db = await connectToDatabase(domain);
      
      // Convert string _id to ObjectId for MongoDB
      const objectId = new ObjectId(questionId);
      
      // Check if there are any exam questions using this question
      const usageCount = await db.collection('examquestions').countDocuments({
        'question._id': questionId
      });

      if (usageCount > 0) {
        return NextResponse.json(
          { 
            error: 'این سوال در آزمون‌ها استفاده شده است و قابل حذف نیست',
            usageCount 
          },
          { status: 400 }
        );
      }
      
      // Delete the question
      const result = await db.collection('questions').deleteOne({ _id: objectId });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: 'سوال یافت نشد یا قابل حذف نیست' },
          { status: 404 }
        );
      }

      // console.log(`Successfully deleted question ${questionId} for domain: ${domain}`);
      return NextResponse.json({
        success: true,
        message: 'سوال با موفقیت حذف شد',
        deletedCount: result.deletedCount
      });
    } catch (dbError) {
      console.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "خطا در ارتباط با پایگاه داده" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'خطا در حذف سوال' },
      { status: 500 }
    );
  }
} 