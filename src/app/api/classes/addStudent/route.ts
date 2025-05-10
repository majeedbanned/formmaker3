import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// Set runtime to nodejs
export const runtime = 'nodejs';

interface StudentForClass {
  studentCode: string;
  studentName: string;
  studentlname: string;
  phone: string;
  _id: string;
}

export async function PUT(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    const { classCode, student } = await request.json() as {
      classCode: string;
      student: StudentForClass;
    };
    
    if (!classCode || !student || !student.studentCode) {
      return NextResponse.json(
        { error: 'Missing required parameters (classCode, student)' },
        { status: 400 }
      );
    }
    
    logger.info(`Adding student ${student.studentCode} to class ${classCode}`, { domain });

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
    
    // Get current students array or initialize if not exists
    const students = classDocument.data?.students || [];
    
    // Check if student already exists in the class by _id instead of studentCode
    const existingStudentIndex = students.findIndex(
      (s: { _id: string }) => s._id === student._id
    );
    
    if (existingStudentIndex !== -1) {
      // Student exists - update the student details
      students[existingStudentIndex] = {
        ...students[existingStudentIndex],
        studentCode: student.studentCode, // Update the studentCode in case it changed
        studentName: student.studentName,
        studentlname: student.studentlname,
        phone: student.phone
      };
      
      logger.info(`Updating existing student with ID ${student._id} in class ${classCode}`, { domain });
    } else {
      // Student doesn't exist - add to array
      students.push(student);
      logger.info(`Adding new student ${student.studentCode} (ID: ${student._id}) to class ${classCode}`, { domain });
    }
    
    // Update the class document with the new students array
    const result = await classesCollection.updateOne(
      { 'data.classCode': classCode },
      { $set: { 'data.students': students } }
    );
    
    if (result.modifiedCount === 0) {
      logger.warn(`Failed to update class ${classCode} - no document modified`, { domain });
      return NextResponse.json(
        { error: 'Failed to update class' },
        { status: 500 }
      );
    }
    
    logger.info(`Successfully added/updated student ${student.studentCode} in class ${classCode}`, { domain });
    
    return NextResponse.json({ 
      success: true,
      message: `Student ${student.studentCode} added/updated in class ${classCode}`,
      updated: existingStudentIndex !== -1
    });
    
  } catch (err) {
    logger.error('Error adding student to class:', err);
    return NextResponse.json(
      { error: 'Failed to add student to class' },
      { status: 500 }
    );
  }
} 