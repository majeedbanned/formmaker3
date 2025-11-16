import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const mailId = url.searchParams.get("mailId");
    
    // Validate required fields
    if (!mailId) {
      return NextResponse.json(
        { error: "Mail ID is required" },
        { status: 400 }
      );
    }
    
    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Access the messagelist collection
    const messagelistCollection = connection.collection('messagelist');
    const studentsCollection = connection.collection('students');
    const teachersCollection = connection.collection('teachers');
    
    // console.log(`Fetching statistics for mailId: ${mailId}`);
    
    // Get all messages for this mailId
    const messages = await messagelistCollection
      .find({ "data.mailId": mailId })
      .sort({ "data.createdAt": -1 })
      .toArray();
    
    if (messages.length === 0) {
      return NextResponse.json({
        error: "No messages found for this mail ID"
      }, { status: 404 });
    }
    
    // Get the original message info
    const firstMessage = messages[0];
    const messageInfo = {
      title: firstMessage.data.title,
      sendername: firstMessage.data.sendername,
      sendercode: firstMessage.data.sendercode,
      persiandate: firstMessage.data.persiandate,
      createdAt: firstMessage.data.createdAt,
    };
    
    // Separate read and unread messages
    const readMessages = messages.filter(msg => msg.data.isRead);
    const unreadMessages = messages.filter(msg => !msg.data.isRead);
    
    // Collect all unique receiver codes for bulk lookup
    const allReceiverCodes = [...new Set(messages.map(msg => msg.data.receivercode))];
    
    // Bulk fetch all students and teachers at once for better performance
    const [studentsData, teachersData] = await Promise.all([
      studentsCollection.find({ 
        "data.studentCode": { $in: allReceiverCodes }
      }).toArray(),
      teachersCollection.find({ 
        "data.teacherCode": { $in: allReceiverCodes }
      }).toArray()
    ]);
    
    // Create lookup maps for efficient name resolution
    const studentsMap = new Map();
    studentsData.forEach(student => {
      const fullName = `${student.data.studentName || ''} ${student.data.studentFamily || ''}`.trim() || student.data.studentCode;
      const classLabel = student.data.classCode && student.data.classCode.length > 0 
        ? student.data.classCode[0].label 
        : 'نامشخص';
      
      studentsMap.set(student.data.studentCode, {
        name: fullName,
        username: student.data.studentCode,
        type: 'student',
        classCode: classLabel
      });
    });
    
    const teachersMap = new Map();
    teachersData.forEach(teacher => {
      teachersMap.set(teacher.data.teacherCode, {
        name: teacher.data.teacherName || teacher.data.teacherCode,
        username: teacher.data.teacherCode,
        type: 'teacher',
        classCode: 'معلم'
      });
    });
    
    // Helper function to get recipient info
    const getRecipientInfo = (receivercode: string) => {
      if (studentsMap.has(receivercode)) {
        return studentsMap.get(receivercode);
      } else if (teachersMap.has(receivercode)) {
        return teachersMap.get(receivercode);
      } else {
        return {
          name: receivercode,
          username: receivercode,
          type: 'unknown',
          classCode: 'نامشخص'
        };
      }
    };

    // Get recipient details for read messages
    const readRecipientsWithDetails = readMessages.map(msg => {
      const recipientInfo = getRecipientInfo(msg.data.receivercode);
      return {
        ...recipientInfo,
        readTime: msg.data.readTime,
        readPersianDate: msg.data.readPersianDate,
        receivercode: msg.data.receivercode
      };
    });
    
    // Get recipient details for unread messages
    const unreadRecipientsWithDetails = unreadMessages.map(msg => {
      const recipientInfo = getRecipientInfo(msg.data.receivercode);
      return {
        ...recipientInfo,
        receivercode: msg.data.receivercode
      };
    });
    
    // Calculate statistics
    const statistics = {
      messageInfo,
      totalRecipients: messages.length,
      readCount: readMessages.length,
      unreadCount: unreadMessages.length,
      readPercentage: messages.length > 0 ? Math.round((readMessages.length / messages.length) * 100) : 0,
      readRecipients: readRecipientsWithDetails.sort((a, b) => 
        new Date(b.readTime || 0).getTime() - new Date(a.readTime || 0).getTime()
      ),
      unreadRecipients: unreadRecipientsWithDetails.sort((a, b) => 
        a.name.localeCompare(b.name)
      ),
    };
    
    // console.log(`Found ${messages.length} recipients: ${readMessages.length} read, ${unreadMessages.length} unread`);
    
    return NextResponse.json(statistics);
    
  } catch (error) {
    console.error("Error fetching message statistics:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch message statistics" },
      { status: 500 }
    );
  }
} 