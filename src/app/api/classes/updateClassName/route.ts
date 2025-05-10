import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    const { classCode, oldClassName, newClassName } = await request.json() as {
      classCode: string;
      oldClassName: string;
      newClassName: string;
    };
    
    if (!classCode || !oldClassName || !newClassName) {
      return NextResponse.json(
        { error: 'Missing required parameters (classCode, oldClassName, newClassName)' },
        { status: 400 }
      );
    }
    
    // If the class name hasn't changed, no need to update
    if (oldClassName === newClassName) {
      return NextResponse.json({
        success: true,
        message: 'Class name has not changed, no update needed',
        updated: 0
      });
    }
    
    logger.info(`Updating class name from "${oldClassName}" to "${newClassName}" for class ${classCode}`, { domain });

    // First, update the class record
    const connection = await connectToDatabase(domain);
    const classesCollection = connection.collection('classes');
    
    await classesCollection.updateOne(
      { 'data.classCode': classCode },
      { $set: { 'data.className': newClassName } }
    );
    
    // Now update all students with this class code
    const studentsCollection = connection.collection('students');
    
    // Find all students with this class code
    const students = await studentsCollection.find({
      'data.classCode': {
        $elemMatch: {
          'value': classCode
        }
      }
    }).toArray();
    
    if (!students || students.length === 0) {
      logger.info(`No students found with class code ${classCode}`, { domain });
      return NextResponse.json({
        success: true,
        message: 'Class updated, but no students found with this class code',
        updated: 0
      });
    }
    
    logger.info(`Found ${students.length} students with class code ${classCode}`, { domain });
    
    // Update each student's classCode array
    const updatePromises = students.map(async (student) => {
      const currentClassCodes = student.data?.classCode || [];
      
      // Find the index of the class code to update
      const classIndex = currentClassCodes.findIndex(
        (code: { value: string; }) => code.value === classCode
      );
      
      if (classIndex !== -1) {
        // Create updated class codes array with the new class name
        const updatedClassCodes = [...currentClassCodes];
        updatedClassCodes[classIndex] = {
          ...updatedClassCodes[classIndex],
          label: newClassName
        };
        
        // Update the student record
        return studentsCollection.updateOne(
          { _id: student._id },
          { $set: { "data.classCode": updatedClassCodes } }
        );
      }
      
      return null;
    });
    
    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    
    // Count how many students were actually updated
    const updatedCount = results.filter(result => result !== null && result.modifiedCount > 0).length;
    
    logger.info(`Successfully updated class name for ${updatedCount} students`, { domain });
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated class name for ${updatedCount} students`,
      updated: updatedCount,
      total: students.length
    });
    
  } catch (err) {
    logger.error('Error updating class name:', err);
    return NextResponse.json(
      { error: 'Failed to update class name' },
      { status: 500 }
    );
  }
} 