import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get("courseCode");
    const schoolCode = searchParams.get("schoolCode");

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching course data for domain: ${domain}, courseCode: ${courseCode}, schoolCode: ${schoolCode}`);
    console.log("queryxx", );
    // Validate schoolCode is required
    if (!schoolCode) {
      return NextResponse.json(
        { error: "Required parameter missing: schoolCode" },
        { status: 400 }
      );
    }
    
    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);

    // Get the courses collection directly from the connection
    const coursesCollection = connection.collection("courses");

    // Build query based on available parameters
    const query: Record<string, unknown> = {
      "data.schoolCode": schoolCode,
    };

    // Add courseCode to query if provided
    if (courseCode) {
      query["data.courseCode"] = courseCode;
    }

    let courses;

    // Fetch courses from the database
    if (courseCode) {
      courses = await coursesCollection.findOne(query);
    } else {
      courses = await coursesCollection.find(query).toArray();
    }

    // Transform the course data for better client consumption
    let transformedCourses;
    
    if (Array.isArray(courses)) {
      transformedCourses = courses.map(course => {
        // Extract course data - handle both Map and regular object structures
        let courseCode = '';
        let courseName = '';
        
        // Case 1: Direct properties in data
        if (course.data && typeof course.data === 'object') {
          // If data is a Map that's been converted to an object
          if (course.data.courseCode) {
            courseCode = course.data.courseCode;
            courseName = course.data.courseName || courseCode;
          } 
          // MongoDB Maps are sometimes converted to objects with key/value pairs
          else {
            // Try to find courseCode and courseName in the object keys
            for (const key in course.data) {
              if (key === 'courseCode') {
                courseCode = course.data[key];
              }
              if (key === 'courseName') {
                courseName = course.data[key];
              }
            }
          }
        }
        
        // Return a simplified object with the data we need
        return {
          _id: course._id,
          courseCode: courseCode,
          courseName: courseName,
          data: course.data // Keep original data for compatibility
        };
      });
    } else if (courses) {
      // Handle single course response
      let courseCode = '';
      let courseName = '';
      
      if (courses.data && typeof courses.data === 'object') {
        if (courses.data.courseCode) {
          courseCode = courses.data.courseCode;
          courseName = courses.data.courseName || courseCode;
        } else {
          for (const key in courses.data) {
            if (key === 'courseCode') {
              courseCode = courses.data[key];
            }
            if (key === 'courseName') {
              courseName = courses.data[key];
            }
          }
        }
      }
      
      transformedCourses = {
        _id: courses._id,
        courseCode: courseCode,
        courseName: courseName,
        data: courses.data
      };
    }

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    logger.error(`Error fetching courses: ${error}`);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
} 