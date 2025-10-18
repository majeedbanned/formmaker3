import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import { writeFile } from 'fs/promises';

interface FeedbackData {
  type: 'bug' | 'suggestion';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  phone?: string;
  userInfo: {
    name: string;
    userType: string;
    schoolCode: string;
    domain: string;
  };
  platform: 'mobile-app';
  images?: string[];
  status: 'new';
  createdAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    
    const type = formData.get('type') as 'bug' | 'suggestion';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as 'low' | 'medium' | 'high' | 'critical';
    const phone = formData.get('phone') as string | null;

    // Validate required fields
    if (!type || !title || !description || !priority) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'فیلدهای الزامی را پر کنید' 
        },
        { status: 400 }
      );
    }

    // Get user info from headers or body
    // In production, you should get this from authentication token
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const userName = request.headers.get('x-user-name') || 'کاربر ناشناس';
    const userType = request.headers.get('x-user-type') || 'unknown';
    const schoolCode = request.headers.get('x-school-code') || '';

    // Handle image uploads
    const imageFiles = formData.getAll('images') as File[];
    const savedImages: string[] = [];

    if (imageFiles.length > 0) {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'feedback');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Save each image
      for (const file of imageFiles) {
        if (file && file.size > 0) {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
            const filePath = path.join(uploadsDir, fileName);
            
            await writeFile(filePath, buffer);
            savedImages.push(`/uploads/feedback/${fileName}`);
          } catch (error) {
            console.error('Error saving image:', error);
          }
        }
      }
    }

    // Prepare feedback data
    const feedbackData: FeedbackData = {
      type,
      title,
      description,
      priority,
      phone: phone || undefined,
      userInfo: {
        name: userName,
        userType: userType,
        schoolCode: schoolCode,
        domain: domain,
      },
      platform: 'mobile-app',
      images: savedImages.length > 0 ? savedImages : undefined,
      status: 'new',
      createdAt: new Date(),
    };

    // Always use master database for all feedbacks (centralized storage)
    const masterConnectionString = "mongodb://masterdbUser:anotherStrongPassword123@185.128.137.182:27017/masterdb?authSource=masterdb";
    const client = new MongoClient(masterConnectionString);
    await client.connect();
    const db = client.db('masterdb');

    try {
      // Insert feedback into database
      const result = await db.collection('feedback').insertOne(feedbackData);

      await client.close();

      // Send SMS notifications (optional)
      try {
        // Send thank you SMS to user if phone number provided
        if (phone && phone.trim() && phone.length === 11) {
          await fetch(`${request.nextUrl.origin}/api/sms/admin-send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fromNumber: '9998762911',
              toNumbers: [phone],
              message: `سلام ${userName}، بازخورد شما با موفقیت ثبت شد. از همکاری شما سپاسگزاریم. تیم پشتیبانی پارس آموز`,
            }),
          });
        }

        // Send notification SMS to admin
        await fetch(`${request.nextUrl.origin}/api/sms/admin-send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromNumber: '9998762911',
            toNumbers: ['09177204118'],
            message: `بازخورد جدید (اپلیکیشن): ${type === 'bug' ? 'مشکل' : 'پیشنهاد'} - ${title.substring(0, 50)} - توسط: ${userName} (${schoolCode})`,
          }),
        });
      } catch (smsError) {
        console.error('Error sending SMS:', smsError);
        // Don't fail the request if SMS fails
      }

      return NextResponse.json({
        success: true,
        message: 'بازخورد شما با موفقیت ثبت شد',
        feedbackId: result.insertedId.toString(),
      });

    } catch (dbError) {
      await client.close();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'خطا در ذخیره بازخورد' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطای سرور داخلی' 
      },
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-domain, x-user-name, x-user-type, x-school-code',
    },
  });
}

