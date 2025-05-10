import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { logger } from '@/lib/logger';

// Set runtime to nodejs
export const runtime = 'nodejs';

interface ClassCode {
  label: string;
  value: string;
}

export async function PUT(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    const { studentId, classCodeValue } = await request.json() as {
      studentId: string;
      classCodeValue: string;
    };
    
    if (!studentId || !classCodeValue) {
      return NextResponse.json(
        { error: 'Missing required parameters (studentId, classCodeValue)' },
        { status: 400 }
      );
    }
    
    logger.info(`Removing class code ${classCodeValue} from student ${studentId}`, { domain });

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('students');

    // First, get the current student record
    const student = await collection.findOne({ 
      _id: new mongoose.Types.ObjectId(studentId) 
    });
    
    if (!student) {
      logger.warn(`Student not found for ID ${studentId}`, { domain });
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    // Get current classCode array (or initialize empty array if not exists)
    const currentClassCodes: ClassCode[] = student.data?.classCode || [];
    
    // Filter out the class code that needs to be removed
    const updatedClassCodes = currentClassCodes.filter(
      (code: ClassCode) => code.value !== classCodeValue
    );
    
    // If no changes were made, return early
    if (currentClassCodes.length === updatedClassCodes.length) {
      logger.info(`Class code ${classCodeValue} not found for student ${studentId}`, { domain });
      return NextResponse.json({ 
        success: true,
        data: student,
        changed: false,
        message: "Class code not found for this student"
      });
    }
    
    // Update the classCode field with the new array
    const result = await collection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(studentId) },
      { $set: { "data.classCode": updatedClassCodes } },
      { returnDocument: 'after' }
    );
    
    logger.info(`Successfully removed class code ${classCodeValue} from student ${studentId}`, { domain });
    
    return NextResponse.json({ 
      success: true,
      data: result,
      changed: true,
      message: "Class code removed successfully" 
    });
    
  } catch (err) {
    logger.error('Error removing class code from student:', err);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
} 