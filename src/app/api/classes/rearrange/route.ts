import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    const { classCode } = await request.json() as {
      classCode: string;
    };

    if (!classCode) {
      return NextResponse.json(
        { error: 'Missing required parameter: classCode' },
        { status: 400 }
      );
    }

    logger.info(`Rearranging students for class ${classCode}`, { domain });

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const classesCollection = connection.collection('classes');
    const studentsCollection = connection.collection('students');

    // First, find the class document
    const classDoc = await classesCollection.findOne({
      'data.classCode': classCode
    });

    if (!classDoc) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Find all students who have this class code in their classCode array
    const students = await studentsCollection.find({
      'data.classCode': {
        $elemMatch: {
          'value': classCode
        }
      }
    }).toArray();

    logger.info(`Found ${students.length} students assigned to class ${classCode}`, { domain });

    // Transform students to the required format for classes.data.students array
    const studentsForClass = students.map(student => ({
      studentCode: student.data.studentCode || "",
      studentName: student.data.studentName || "",
      studentlname: student.data.studentFamily || "", // Note: using studentFamily for studentlname
      phone: student.data.phone || "",
      _id: student._id.toString()
    }));

    // Update the class document - first clear the students array, then set the new one
    const updateResult = await classesCollection.findOneAndUpdate(
      { 'data.classCode': classCode },
      { 
        $set: { 
          'data.students': studentsForClass,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    if (!updateResult) {
      return NextResponse.json(
        { error: 'Failed to update class document' },
        { status: 500 }
      );
    }

    logger.info(`Successfully rearranged ${studentsForClass.length} students for class ${classCode}`, { domain });

    return NextResponse.json({ 
      success: true,
      message: `Successfully rearranged ${studentsForClass.length} students for class ${classCode}`,
      studentsCount: studentsForClass.length,
      students: studentsForClass
    });
    
  } catch (err) {
    logger.error('Error rearranging class students:', err);
    return NextResponse.json(
      { error: 'Failed to rearrange class students' },
      { status: 500 }
    );
  }
}








