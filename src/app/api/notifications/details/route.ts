import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Get domain from request headers for logging purposes
    const domain = request.headers.get("x-domain") || 'localhost:3000';
    
    // Get the authenticated user
    const user = await getCurrentUser();
    if (!user) {
      logger.warn(`Unauthorized attempt to fetch notification details from domain: ${domain}`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse the notification ID from the URL
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ message: "Notification ID is required" }, { status: 400 });
    }

    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get notification details
    const notificationsCollection = connection.collection('notificationsend');
    
    const notification = await notificationsCollection.findOne({ 
      _id: new ObjectId(notificationId),
    });

    if (!notification) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 });
    }

    // Get recipients and their status from messagelistnotification collection
    const messagelistCollection = connection.collection('messagelistnotification');
    
    const recipients = await messagelistCollection.find({ 
      mailId: notificationId
    }).toArray();

    // Fetch recipient names from students and teachers collections
    const studentCodes = recipients
      .filter(r => !r.receivercode.startsWith('T'))
      .map(r => r.receivercode);
    
    const teacherCodes = recipients
      .filter(r => r.receivercode.startsWith('T'))
      .map(r => r.receivercode);

    // Get student names
    const studentsCollection = connection.collection('students');
    const students = studentCodes.length > 0 
      ? await studentsCollection.find({ 
          'data.studentCode': { $in: studentCodes } 
        }).toArray()
      : [];

    // Get teacher names
    const teachersCollection = connection.collection('teachers');
    const teachers = teacherCodes.length > 0
      ? await teachersCollection.find({ 
          'data.teacherCode': { $in: teacherCodes } 
        }).toArray()
      : [];

    // Create a mapping of codes to names
    const nameMap: Record<string, string> = {};
    
    students.forEach(student => {
      if (student?.data?.studentCode) {
        nameMap[student.data.studentCode] = 
          `${student.data?.studentName || ''} ${student.data?.studentFamily || ''}`;
      }
    });
    
    teachers.forEach(teacher => {
      if (teacher?.data?.teacherCode) {
        nameMap[teacher.data.teacherCode] = 
          `${teacher.data?.teacherName || ''} ${teacher.data?.teacherFamily || ''}`;
      }
    });

    // Enhance recipients with names and status information
    const enhancedRecipients = recipients.map(recipient => ({
      receivercode: recipient.receivercode,
      name: nameMap[recipient.receivercode] || recipient.receivercode,
      status: recipient.status || 'sent',
      isRead: recipient.isRead || false,
      timestamp: recipient.timestamp
    }));

    // Calculate statistics
    const stats = {
      totalRecipients: recipients.length,
      sentCount: recipients.length,
      readCount: recipients.filter(r => r.isRead === true).length,
      deliveredCount: recipients.filter(r => r.status === 'delivered' || r.status === 'read').length
    };

    // Return the notification details with enhanced recipients
    return NextResponse.json({
      notification: {
        ...notification,
        recipients: enhancedRecipients
      },
      stats
    }, { status: 200 });
    
  } catch (error) {
    logger.error("Error fetching notification details:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: "خطا در دریافت جزئیات اعلان" },
      { status: 500 }
    );
  }
} 