import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { Document } from 'mongodb';

// Define interface for a schedule item
interface ScheduleItem {
  day: string;
  timeSlot: string;
}

// Define interface for a teacher in class data
interface Teacher {
  teacherCode: string;
  courseCode: string;
  weeklySchedule?: ScheduleItem[];
}

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    const { 
      classCode, 
      teacherCode, 
      courseCode, 
      day, 
      timeSlot, 
      operation 
    } = await request.json() as {
      classCode: string;
      teacherCode: string;
      courseCode: string;
      day: string;
      timeSlot: string;
      operation: 'add' | 'remove';
    };
    
    if (!classCode || !day || !timeSlot || !operation) {
      return NextResponse.json(
        { error: 'Missing required parameters (classCode, day, timeSlot, operation)' },
        { status: 400 }
      );
    }

    // For adding, we need teacher and course
    if (operation === 'add' && (!teacherCode || !courseCode)) {
      return NextResponse.json(
        { error: 'Adding a schedule requires teacherCode and courseCode' },
        { status: 400 }
      );
    }
    
    logger.info(`${operation === 'add' ? 'Adding' : 'Removing'} schedule for class ${classCode}, day: ${day}, timeSlot: ${timeSlot}`, { domain });

    // Connect to database
    const connection = await connectToDatabase(domain);
    const classesCollection = connection.collection('classes');
    
    // Find the class to update
    const classData = await classesCollection.findOne({ 'data.classCode': classCode });
    
    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Process based on operation
    if (operation === 'add') {
      // Check if this teacher already has this course in this class
      const existingTeacherIndex = classData.data.teachers.findIndex(
        (t: Teacher) => t.teacherCode === teacherCode && t.courseCode === courseCode
      );

      if (existingTeacherIndex >= 0) {
        // Teacher already teaching this course, add to their schedule
        const weeklySchedule = classData.data.teachers[existingTeacherIndex].weeklySchedule || [];
        
        // Check if this time slot is already scheduled
        const existingScheduleIndex = weeklySchedule.findIndex(
          (s: ScheduleItem) => s.day === day && s.timeSlot === timeSlot
        );
        
        if (existingScheduleIndex >= 0) {
          // Already scheduled at this time, no need to update
          return NextResponse.json({
            success: true,
            message: 'This time slot is already scheduled for this teacher and course',
            updated: false
          });
        }
        
        // Add to existing teacher's schedule
        await classesCollection.updateOne(
          { 'data.classCode': classCode },
          { 
            $push: { 
              [`data.teachers.${existingTeacherIndex}.weeklySchedule`]: {
                day,
                timeSlot
              }
            } as Document
          }
        );
      } else {
        // Teacher not teaching this course yet, add new teacher-course assignment
        await classesCollection.updateOne(
          { 'data.classCode': classCode },
          { 
            $push: { 
              'data.teachers': {
                teacherCode,
                courseCode,
                weeklySchedule: [{
                  day,
                  timeSlot
                }]
              }
            } as Document
          }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Successfully added schedule',
        updated: true
      });
    } else if (operation === 'remove') {
      // Check all teachers for this class
      for (let i = 0; i < classData.data.teachers.length; i++) {
        const teacher = classData.data.teachers[i];
        
        // Skip if teacher has no weekly schedule
        if (!teacher.weeklySchedule || !teacher.weeklySchedule.length) continue;
        
        // Find schedule that matches day and timeSlot
        const scheduleIndex = teacher.weeklySchedule.findIndex(
          (s: ScheduleItem) => s.day === day && s.timeSlot === timeSlot
        );
        
        if (scheduleIndex >= 0) {
          // Found a match, remove this schedule
          await classesCollection.updateOne(
            { 'data.classCode': classCode },
            { 
              $pull: { 
                [`data.teachers.${i}.weeklySchedule`]: {
                  day,
                  timeSlot
                }
              } as Document
            }
          );
          
          return NextResponse.json({
            success: true,
            message: 'Successfully removed schedule',
            updated: true
          });
        }
      }
      
      // No matching schedule found
      return NextResponse.json({
        success: true,
        message: 'No matching schedule found to remove',
        updated: false
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid operation' },
      { status: 400 }
    );
    
  } catch (err) {
    logger.error('Error updating class schedule:', err);
    return NextResponse.json(
      { error: 'Failed to update class schedule' },
      { status: 500 }
    );
  }
} 