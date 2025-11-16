import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { smsApi } from '@/lib/smsService';

const MASTER_DB_URI = "mongodb://masterdbUser:anotherStrongPassword123@185.128.137.182:27017/masterdb?authSource=masterdb";
const SUPERADMIN_PASSWORD = "parsamooz2025admin";

// Middleware to verify superadmin password
function verifySuperAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-superadmin-password');
  return authHeader === SUPERADMIN_PASSWORD;
}

// GET: Fetch all feedbacks
export async function GET(request: NextRequest) {
  try {
    // Verify superadmin access
    if (!verifySuperAdmin(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (priority && priority !== 'all') filter.priority = priority;

    const client = new MongoClient(MASTER_DB_URI);
    await client.connect();
    const db = client.db('masterdb');

    try {
      // Get total count
      const total = await db.collection('feedback').countDocuments(filter);

      // Fetch feedbacks with pagination
      const feedbacks = await db.collection('feedback')
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Get statistics
      const stats = {
        total: await db.collection('feedback').countDocuments(),
        open: await db.collection('feedback').countDocuments({ status: 'open' }),
        inProgress: await db.collection('feedback').countDocuments({ status: 'in-progress' }),
        resolved: await db.collection('feedback').countDocuments({ status: 'resolved' }),
        bugs: await db.collection('feedback').countDocuments({ type: 'bug' }),
        suggestions: await db.collection('feedback').countDocuments({ type: 'suggestion' }),
      };

      await client.close();

      return NextResponse.json({
        success: true,
        data: {
          feedbacks,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          stats,
        },
      });

    } catch (error) {
      await client.close();
      throw error;
    }

  } catch (error) {
    console.error('Feedbacks API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
      { status: 500 }
    );
  }
}

// PATCH: Update feedback (add comment, change status)
export async function PATCH(request: NextRequest) {
  try {
    // Verify superadmin access
    if (!verifySuperAdmin(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { feedbackId, status, comment, adminName } = body;

    if (!feedbackId) {
      return NextResponse.json(
        { success: false, message: 'شناسه بازخورد الزامی است' },
        { status: 400 }
      );
    }

    const client = new MongoClient(MASTER_DB_URI);
    await client.connect();
    const db = client.db('masterdb');

    try {
      // Fetch the feedback first to get user details and phone number
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

      const updateData: any = {
        updatedAt: new Date(),
      };

      // Update status if provided
      if (status) {
        updateData.status = status;
      }

      // Add comment if provided
      if (comment) {
        const newComment = {
          text: comment,
          authorName: adminName || 'مدیر سیستم',
          authorType: 'پشتیبانی',
          isAdminComment: true, // This is an admin comment
          createdAt: new Date(),
        };

        // Push comment to comments array (create array if doesn't exist)
        await db.collection('feedback').updateOne(
          { _id: new ObjectId(feedbackId) },
          { 
            $push: { comments: newComment } as any,
            $set: updateData,
          }
        );

        // Send SMS notification if phone number exists
        if (existingFeedback.phone && existingFeedback.phone.trim().length === 11) {
          try {
            const userName = existingFeedback.submittedBy?.name || 'کاربر گرامی';
            const feedbackTitle = existingFeedback.title?.substring(0, 30) || 'بازخورد شما';
            const adminNameForSms = adminName || 'مدیر سیستم';
            const commentPreview = comment.substring(0, 100);
            
            // Format SMS message
            const smsMessage = `${userName} عزیز،\n` +
              `پاسخی برای "${feedbackTitle}" دریافت کردید:\n` +
              `${commentPreview}${comment.length > 100 ? '...' : ''}\n` +
              `- ${adminNameForSms}\n` +
              `پارس آموز`;

            // Send SMS using admin credentials
            await smsApi.sendAdminSMS(
              '9998762911', // From number
              [existingFeedback.phone],
              smsMessage
            );

            // console.log(`SMS notification sent to ${existingFeedback.phone} for feedback ${feedbackId}`);
          } catch (smsError) {
            // Log error but don't fail the request
            console.error('Error sending SMS notification:', smsError);
          }
        }
      } else {
        // Just update status
        await db.collection('feedback').updateOne(
          { _id: new ObjectId(feedbackId) },
          { $set: updateData }
        );
      }

      // Fetch updated feedback
      const updatedFeedback = await db.collection('feedback').findOne(
        { _id: new ObjectId(feedbackId) }
      );

      await client.close();

      return NextResponse.json({
        success: true,
        message: 'بازخورد با موفقیت به‌روزرسانی شد',
        data: updatedFeedback,
      });

    } catch (error) {
      await client.close();
      throw error;
    }

  } catch (error) {
    console.error('Update feedback error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی بازخورد' },
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
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-superadmin-password',
    },
  });
}

