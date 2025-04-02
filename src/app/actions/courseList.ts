'use server';

import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

interface Teacher {
  teacherCode: string;
  courseCode: string;
  weeklySchedule: Array<{
    day: string;
    timeSlot: string;
  }>;
  weeklySchedule_expanded: boolean;
}

interface ClassData {
  classCode: string;
  className: string;
  Grade: string;
  schoolCode: string;
  teachers: Teacher[];
  teachers_expanded: boolean;
}

/**
 * Fetches courses/classes based on school code and optionally teacher code
 */
export async function fetchCoursesBySchoolCode(schoolCode: string, teacherCode?: string, domain: string = "localhost:3000") {
  logger.info(`Starting fetchCoursesBySchoolCode with schoolCode: ${schoolCode}, teacherCode: ${teacherCode || 'none'}, domain: ${domain}`);
  
  try {
    if (!schoolCode) {
      logger.warn('No school code provided');
      return { error: 'School code is required' };
    }

    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    logger.info(`Connected to database for domain: ${domain}`);
    
    // Get the classes collection directly from the connection
    const collection = connection.collection('classes');
    
    // Build query based on provided parameters
    const query: Record<string, unknown> = { 'data.schoolCode': schoolCode };
    
    // If teacherCode is provided, add it to the query
    if (teacherCode) {
      query['data.teachers.teacherCode'] = teacherCode;
    }
    
    logger.info(`Executing query for classes in domain: ${domain}`);
    
    const courses = await collection
      .find(query)
      .project({ 
        _id: 1, 
        'data.className': 1, 
        'data.classCode': 1,
        'data.Grade': 1,
        'data.teachers': 1
      })
      .sort({ 'data.className': 1 })
      .toArray();
      
    logger.info(`Query executed successfully. Found ${courses.length} courses in domain: ${domain}`);
    
    // Transform data for dropdown
    const transformedCourses = courses.map(course => {
      // If teacherCode is provided, find the teacher's courses
      let teacherCourses: string[] = [];
      if (teacherCode && course.data.teachers) {
        const teacher = course.data.teachers.find((t: Teacher) => t.teacherCode === teacherCode);
        if (teacher) {
          teacherCourses = teacher.courseCode ? [teacher.courseCode] : [];
        }
      }

      return {
        label: `${course.data.className || ''}`,
        value: course.data.classCode || '',
        code: course.data.classCode || '',
        grade: course.data.Grade || '',
        teacherCourses
      };
    });
    
    logger.info(`Data transformed successfully. Returning ${transformedCourses.length} courses from domain: ${domain}`);
    return transformedCourses;
  } catch (error) {
    logger.error(`Error in fetchCoursesBySchoolCode for domain ${domain}:`, error);
    return { error: 'Failed to fetch courses' };
  }
} 