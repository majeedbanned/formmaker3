'use server';

import { MongoClient } from 'mongodb';

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

interface ClassDocument {
  _id: { $oid: string };
  data: ClassData;
  createdAt: { $date: string };
  updatedAt: { $date: string };
  __v: number;
}

/**
 * Connects to MongoDB database
 */
async function connectToDatabase(connectionString: string) {
  console.log('[CourseList] Attempting to connect to database...');
  
  if (!connectionString) {
    console.error('[CourseList] No connection string provided');
    throw new Error('No connection string provided');
  }
  
  try {
    const client = new MongoClient(connectionString);
    await client.connect();
    console.log('[CourseList] Successfully connected to database');
    return client;
  } catch (error) {
    console.error('[CourseList] Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Fetches courses/classes based on school code and optionally teacher code
 */
export async function fetchCoursesBySchoolCode(schoolCode: string, teacherCode?: string) {
  //console.log('[CourseList] Starting fetchCoursesBySchoolCode with schoolCode:', schoolCode, 'teacherCode:', teacherCode);
  
  try {
    if (!schoolCode) {
      console.warn('[CourseList] No school code provided');
      return { error: 'School code is required' };
    }

    const connectionString = process.env.NEXT_PUBLIC_MONGODB_URI || '';
    //console.log('[CourseList] Using connection string:', connectionString ? 'Present' : 'Missing');
    
    const client = await connectToDatabase(connectionString);
    
    const db = client.db();
    const collection = db.collection<ClassDocument>('classes');
    
    // Build query based on provided parameters
    const query: Record<string, unknown> = { 'data.schoolCode': schoolCode };
    
    // If teacherCode is provided, add it to the query
    if (teacherCode) {
      query['data.teachers.teacherCode'] = teacherCode;
    }
    
   // console.log('[CourseList] Executing query:', query);
    
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
      
   // console.log('[CourseList] Query executed successfully. Found courses:', courses.length);
    
    await client.close();
    console.log('[CourseList] Database connection closed');
    
    // Transform data for dropdown
    const transformedCourses = courses.map(course => {
      // If teacherCode is provided, find the teacher's courses
      let teacherCourses: string[] = [];
      if (teacherCode) {
        const teacher = course.data.teachers.find((t: Teacher) => t.teacherCode === teacherCode);
        if (teacher) {
          teacherCourses = teacher.courseCode ? [teacher.courseCode] : [];
        }
      }

      return {
        label: `${course.data.className}`,
        value: course.data.classCode,
        code: course.data.classCode,
        grade: course.data.Grade,
        teacherCourses
      };
    });
    
  //  console.log('[CourseList] Data transformed successfully. Returning', transformedCourses.length, 'courses');
    return transformedCourses;
  } catch (error) {
    console.error('[CourseList] Error in fetchCoursesBySchoolCode:', error);
    return { error: 'Failed to fetch courses' };
  }
} 