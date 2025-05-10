import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    const { classCode, studentId } = await request.json() as {
      classCode: string;
      studentId: string;
    };
    
    if (!classCode || !studentId) {
      return NextResponse.json(
        { error: 'Missing required parameters (classCode, studentId)' },
        { status: 400 }
      );
    }
    
    logger.info(`Removing student with ID ${studentId} from class ${classCode}`, { domain });

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const classesCollection = connection.collection('classes');
    
    // First, check if class exists
    const classDocument = await classesCollection.findOne({
      'data.classCode': classCode
    });
    
    if (!classDocument) {
      logger.warn(`Class with code ${classCode} not found`, { domain });
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }
    
    // Get current students array
    const students = classDocument.data?.students || [];
    
    // Check if the student exists in the class by _id
    const existingStudentIndex = students.findIndex(
      (s: { _id: string }) => s._id === studentId
    );
    console.log("existingStudentIndex", existingStudentIndex);
    if (existingStudentIndex === -1) {
      // Student doesn't exist in this class
      logger.info(`Student with ID ${studentId} not found in class ${classCode}`, { domain });
      return NextResponse.json({
        success: false,
        message: `Student with ID ${studentId} not found in class ${classCode}`,
        removed: false
      });
    }
    
    // Get studentCode for logging
    const studentCode = students[existingStudentIndex].studentCode;
    
    // Filter out the student to be removed
    const updatedStudents = students.filter(
      (s: { _id: string }) => s._id !== studentId
    );
    
    // Update the class document with the updated students array
    const result = await classesCollection.updateOne(
      { 'data.classCode': classCode },
      { $set: { 'data.students': updatedStudents } }
    );
    
    if (result.modifiedCount === 0) {
      logger.warn(`Failed to update class ${classCode} - no document modified`, { domain });
      return NextResponse.json(
        { error: 'Failed to update class' },
        { status: 500 }
      );
    }
    
    logger.info(`Successfully removed student ${studentCode} (ID: ${studentId}) from class ${classCode}`, { domain });
    
    return NextResponse.json({ 
      success: true,
      message: `Student removed from class ${classCode}`,
      removed: true,
      studentCode: studentCode,
      studentId: studentId
    });
    
  } catch (err) {
    logger.error('Error removing student from class:', err);
    return NextResponse.json(
      { error: 'Failed to remove student from class' },
      { status: 500 }
    );
  }
} 