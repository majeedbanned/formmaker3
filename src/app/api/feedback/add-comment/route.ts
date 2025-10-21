import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { getCurrentUser } from '@/app/api/chatbot7/config/route';

const MASTER_DB_URI = "mongodb://masterdbUser:anotherStrongPassword123@185.128.137.182:27017/masterdb?authSource=masterdb";

// POST: Add user comment to their own feedback
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'لطفاً وارد سیستم شوید' },
        { status: 401 }
      );
    }

    // Only allow school and teacher users
    if (currentUser.userType !== 'school' && currentUser.userType !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { feedbackId, comment } = body;

    if (!feedbackId || !comment || !comment.trim()) {
      return NextResponse.json(
        { success: false, message: 'شناسه بازخورد و متن نظر الزامی است' },
        { status: 400 }
      );
    }

    const client = new MongoClient(MASTER_DB_URI);
    await client.connect();
    const db = client.db('masterdb');

    try {
      // Fetch the feedback to verify ownership
      const existingFeedback = await db.collection('feedback').findOne(
        { _id: new ObjectId(feedbackId) }
      ) as any;

      if (!existingFeedback) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'بازخورد یافت نشد' },
          { status: 404 }
        );
      }

      // Verify that this feedback belongs to the current user based on username
      const isOwner = existingFeedback.submittedBy?.username === currentUser.username;

      if (!isOwner) {
        await client.close();
        return NextResponse.json(
          { success: false, message: 'شما مجاز به افزودن نظر به این بازخورد نیستید' },
          { status: 403 }
        );
      }

      // Create new comment object (user comment)
      const newComment = {
        text: comment,
        authorName: currentUser.name,
        authorType: currentUser.userType === 'school' ? 'مدیر مدرسه' : 'معلم',
        isAdminComment: false, // This is a user comment, not admin
        createdAt: new Date(),
      };

      // Add comment to feedback (same array as admin comments)
      await db.collection('feedback').updateOne(
        { _id: new ObjectId(feedbackId) },
        { 
          $push: { comments: newComment } as any,
          $set: { updatedAt: new Date() },
        }
      );

      // Fetch updated feedback
      const updatedFeedback = await db.collection('feedback').findOne(
        { _id: new ObjectId(feedbackId) }
      );

      await client.close();

      return NextResponse.json({
        success: true,
        message: 'نظر شما با موفقیت ثبت شد',
        data: updatedFeedback,
      });

    } catch (error) {
      await client.close();
      throw error;
    }

  } catch (error) {
    console.error('Add comment API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت نظر' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

