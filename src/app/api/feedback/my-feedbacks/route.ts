import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getCurrentUser } from '@/app/api/chatbot7/config/route';

const MASTER_DB_URI = "mongodb://masterdbUser:anotherStrongPassword123@185.128.137.182:27017/masterdb?authSource=masterdb";

// GET: Fetch user's own feedbacks
export async function GET(request: NextRequest) {
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

    const client = new MongoClient(MASTER_DB_URI);
    await client.connect();
    const db = client.db('masterdb');

    try {
      // Build filter to find user's feedbacks based on username
      // This ensures each user sees only their own submissions
      const filter: any = {
        'submittedBy.username': currentUser.username,
      };

      // Fetch user's feedbacks
      const feedbacks = await db.collection('feedback')
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      await client.close();

      return NextResponse.json({
        success: true,
        data: feedbacks,
      });

    } catch (error) {
      await client.close();
      throw error;
    }

  } catch (error) {
    console.error('My feedbacks API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

