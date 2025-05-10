import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    const { classCode } = await request.json() as {
      classCode: string;
    };
    
    if (!classCode) {
      return NextResponse.json(
        { error: 'Missing required parameter (classCode)' },
        { status: 400 }
      );
    }
    
    logger.info(`Removing class ${classCode} from all student records`, { domain });

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
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
        message: 'No students found with this class code',
        updated: 0
      });
    }
    
    logger.info(`Found ${students.length} students with class code ${classCode}`, { domain });
    
    // Update each student's classCode array to remove the class
    const updatePromises = students.map(async (student) => {
      const currentClassCodes = student.data?.classCode || [];
      
      // Filter out the class code that needs to be removed
      const updatedClassCodes = currentClassCodes.filter(
        (code: { value: string; }) => code.value !== classCode
      );
      
      // Update the student record
      return studentsCollection.updateOne(
        { _id: student._id },
        { $set: { "data.classCode": updatedClassCodes } }
      );
    });
    
    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    
    // Count how many students were actually updated
    const updatedCount = results.filter(result => result.modifiedCount > 0).length;
    
    logger.info(`Successfully removed class ${classCode} from ${updatedCount} student records`, { domain });
    
    return NextResponse.json({
      success: true,
      message: `Successfully removed class ${classCode} from ${updatedCount} student records`,
      updated: updatedCount,
      total: students.length
    });
    
  } catch (err) {
    logger.error('Error removing class from student records:', err);
    return NextResponse.json(
      { error: 'Failed to update student records' },
      { status: 500 }
    );
  }
} 