import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { getCurrentUser } from '@/app/api/chatbot7/config/route';

// Hardcoded masterdb connection
const MASTER_DB_URI = 'mongodb://masterdbUser:anotherStrongPassword123@185.128.137.182:27017/masterdb?authSource=masterdb';

async function connectToMasterDB() {
  const client = new MongoClient(MASTER_DB_URI);
  await client.connect();
  return client.db('masterdb');
}

export async function POST(request: NextRequest) {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    
    // Check authorization: Only school and teacher users
    if (!user || (user.userType !== 'school' && user.userType !== 'teacher')) {
      return NextResponse.json(
        { error: 'Unauthorized', errorFa: 'فقط مدیران مدرسه و معلمان می‌توانند بازخورد ارسال کنند' },
        { status: 403 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const type = formData.get('type') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as string;
    const phone = formData.get('phone') as string;
    const images = formData.getAll('images') as File[];

    // Validate required fields
    if (!type || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields', errorFa: 'لطفاً تمام فیلدهای الزامی را پر کنید' },
        { status: 400 }
      );
    }

    // Process images (convert to base64 for storage)
    const imageData: { name: string; data: string; contentType: string }[] = [];
    
    for (const image of images) {
      if (image.size > 0) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        
        imageData.push({
          name: image.name,
          data: base64,
          contentType: image.type,
        });
      }
    }

    // Get domain from request headers
    const domain = request.headers.get('x-domain') || request.headers.get('host') || 'unknown';

    // Connect to masterdb
    const db = await connectToMasterDB();
    const feedbackCollection = db.collection('feedback');

    // Prepare feedback document
    const feedbackDoc = {
      type, // 'bug' or 'suggestion'
      title,
      description,
      priority: priority || 'medium',
      status: 'open', // open, in-progress, resolved, closed
      phone: phone || null, // Optional phone number
      submittedBy: {
        userId: user.id,
        username: user.username,
        name: user.name,
        userType: user.userType,
        schoolCode: user.schoolCode,
        domain: domain,
      },
      images: imageData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert the feedback
    const result = await feedbackCollection.insertOne(feedbackDoc);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      messageFa: 'بازخورد شما با موفقیت ثبت شد. از همکاری شما سپاسگزاریم!',
      feedbackId: result.insertedId,
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit feedback', 
        errorFa: 'خطا در ثبت بازخورد. لطفاً دوباره تلاش کنید.' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve feedback (optional - for admin panel)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // Only allow school users to view all feedback
    if (!user || user.userType !== 'school') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const db = await connectToMasterDB();
    const feedbackCollection = db.collection('feedback');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const feedback = await feedbackCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

