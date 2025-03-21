'use server';

import { MongoClient } from 'mongodb';

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
 * Fetches courses/classes based on school code
 */
export async function fetchCoursesBySchoolCode(schoolCode: string) {
  console.log('[CourseList] Starting fetchCoursesBySchoolCode with schoolCode:', schoolCode);
  
  try {
    if (!schoolCode) {
      console.warn('[CourseList] No school code provided');
      return { error: 'School code is required' };
    }

    const connectionString = process.env.NEXT_PUBLIC_MONGODB_URI || '';
    console.log('[CourseList] Using connection string:', connectionString ? 'Present' : 'Missing');
    
    const client = await connectToDatabase(connectionString);
    
    const db = client.db();
    const collection = db.collection('classes');
    
    console.log('[CourseList] Executing query for schoolCode:', schoolCode);
    
    // Find all classes where schoolCode matches in the data object
    const courses = await collection
      .find({ 'data.schoolCode': schoolCode })
      .project({ 
        _id: 1, 
        'data.className': 1, 
        'data.classCode': 1,
        'data.Grade': 1 
      })
      .sort({ 'data.className': 1 })
      .toArray();
      
    console.log('[CourseList] Query executed successfully. Found courses:', courses.length);
    
    await client.close();
    console.log('[CourseList] Database connection closed');
    
    // Transform data for dropdown
    const transformedCourses = courses.map(course => ({
      label: `${course.data.className} (Grade ${course.data.Grade})`,
      value: course.data.classCode,
      code: course.data.classCode,
      grade: course.data.Grade
    }));
    
    console.log('[CourseList] Data transformed successfully. Returning', transformedCourses.length, 'courses');
    return transformedCourses;
  } catch (error) {
    console.error('[CourseList] Error in fetchCoursesBySchoolCode:', error);
    return { error: 'Failed to fetch courses' };
  }
} 