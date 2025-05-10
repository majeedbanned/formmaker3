import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { logger } from '@/lib/logger';

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    const { studentId, classCode } = await request.json() as {
      studentId: string;
      classCode: {
        label: string;
        value: string;
      }[];
    };
    
    if (!studentId || !classCode || !Array.isArray(classCode) || classCode.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters (studentId, classCode)' },
        { status: 400 }
      );
    }
    
    logger.info(`Updating classCode for student ${studentId}`, { domain });

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
    const currentClassCodes = student.data?.classCode || [];
    
    // Check if the new class code already exists in the current array
    const newClassCode = classCode[0]; // Get the first class code from the array
    
    let classCodeExists = false;
    let updatedClassCodes = [...currentClassCodes];
    
    // Find the index of the existing class code (if any)
    const existingClassIndex = currentClassCodes.findIndex(
      (code: { label: string; value: string }) => code.value === newClassCode.value
    );
    
    if (existingClassIndex !== -1) {
      classCodeExists = true;
      
      // Check if the class name (label) has changed
      if (currentClassCodes[existingClassIndex].label !== newClassCode.label) {
        logger.info(`Updating class name from ${currentClassCodes[existingClassIndex].label} to ${newClassCode.label} for class code ${newClassCode.value}`, { domain });
        
        // Update the label for the existing class code
        updatedClassCodes[existingClassIndex] = {
          ...currentClassCodes[existingClassIndex],
          label: newClassCode.label
        };
      } else {
        // No change needed if both code and label are the same
        logger.info(`Class code ${newClassCode.value} already exists with same label for student ${studentId}`, { domain });
      }
    } else {
      // Class code doesn't exist, add it to the array
      updatedClassCodes = [...currentClassCodes, newClassCode];
      logger.info(`Adding new class code ${newClassCode.value} to student ${studentId}`, { domain });
    }
    
    // Update the classCode field with the new array
    const result = await collection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(studentId) },
      { $set: { "data.classCode": updatedClassCodes } },
      { returnDocument: 'after' }
    );
    
    logger.info(`Successfully updated classCode for student ${studentId}`, { domain });
    
    return NextResponse.json({ 
      success: true,
      data: result,
      alreadyExisted: classCodeExists,
      labelUpdated: classCodeExists && currentClassCodes[existingClassIndex]?.label !== newClassCode.label
    });
    
  } catch (err) {
    logger.error('Error updating student classCode:', err);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
} 