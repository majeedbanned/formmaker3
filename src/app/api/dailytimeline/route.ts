import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get("schoolCode");
    const studentCode = searchParams.get("studentCode");
    const limitParam = searchParams.get("limit") || "20";
    const skipParam = searchParams.get("skip") || "0";
    
    // Parse pagination parameters
    const limit = parseInt(limitParam, 10);
    const skip = parseInt(skipParam, 10);
    
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    if (!schoolCode) {
      return NextResponse.json(
        { error: "Missing schoolCode parameter" },
        { status: 400 }
      );
    }

    // Check if the user has permission to access this data
    // If user.userType is 'student', they should only access their own data
    if (user.userType === 'student' && (!studentCode || studentCode !== user.username)) {
      return NextResponse.json(
        { error: "You don't have permission to access this data" },
        { status: 403 }
      );
    }

    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Get the collections we need
    const classheetCollection = connection.collection("classsheet");
    const coursesCollection = connection.collection("courses");
    const classesCollection = connection.collection("classes");
    const teachersCollection = connection.collection("teachers");

    // Build the query for classsheet entries
    const query: Record<string, string> = { schoolCode };
    
    // If studentCode is provided, add it to the query
    if (studentCode) {
      query.studentCode = studentCode;
    }

    // Get the total count first (for pagination info)
    const totalCount = await classheetCollection.countDocuments(query);

    // Fetch the classsheet entries with pagination
    const classheetEntries = await classheetCollection
      .find(query)
      .sort({ date: -1, timeSlot: -1 }) // Sort by date and timeSlot in descending order
      .skip(skip)
      .limit(limit)
      .toArray();
    
    logger.info(`Found ${classheetEntries.length} classsheet entries for timeline query (page ${skip/limit + 1})`);
    
    if (classheetEntries.length === 0) {
      return NextResponse.json({
        entries: [],
        pagination: {
          total: totalCount,
          limit,
          skip,
          hasMore: false
        }
      });
    }
    
    // Extract unique courseCodes, classCodes, and teacherCodes
    const courseCodes = [...new Set(classheetEntries.map(entry => entry.courseCode))];
    const classCodes = [...new Set(classheetEntries.map(entry => entry.classCode))];
    const teacherCodes = [...new Set(classheetEntries.map(entry => entry.teacherCode))];
    
    // Fetch course information in bulk
    const courses = await coursesCollection.find(
      { 
        "data.courseCode": { $in: courseCodes },
        "data.schoolCode": schoolCode 
      },
      { 
        projection: { 
          "data.courseCode": 1, 
          "data.courseName": 1 
        } 
      }
    ).toArray();
    
    // Create a map of courseCode to courseName
    const courseMap = courses.reduce((map, course) => {
      if (course.data && course.data.courseCode) {
        map[course.data.courseCode] = course.data.courseName || `درس ${course.data.courseCode}`;
      }
      return map;
    }, {} as Record<string, string>);
    
    // Fetch class information in bulk
    const classes = await classesCollection.find(
      { 
        "data.classCode": { $in: classCodes },
        "data.schoolCode": schoolCode 
      },
      { 
        projection: { 
          "data.classCode": 1, 
          "data.className": 1 
        } 
      }
    ).toArray();
    
    // Create a map of classCode to className
    const classMap = classes.reduce((map, cls) => {
      if (cls.data && cls.data.classCode) {
        map[cls.data.classCode] = cls.data.className || `کلاس ${cls.data.classCode}`;
      }
      return map;
    }, {} as Record<string, string>);
    
    // Fetch teacher information in bulk
    const teachers = await teachersCollection.find(
      { 
        "data.teacherCode": { $in: teacherCodes },
        "data.schoolCode": schoolCode 
      },
      { 
        projection: { 
          "data.teacherCode": 1, 
          "data.teacherName": 1 
        } 
      }
    ).toArray();
    
    // Create a map of teacherCode to teacherName
    const teacherMap = teachers.reduce((map, teacher) => {
      if (teacher.data && teacher.data.teacherCode) {
        map[teacher.data.teacherCode] = teacher.data.teacherName || `استاد ${teacher.data.teacherCode}`;
      }
      return map;
    }, {} as Record<string, string>);
    
    // Enrich the classsheet entries with related information
    const enrichedEntries = classheetEntries.map(entry => ({
      ...entry,
      _enriched: {
        courseName: courseMap[entry.courseCode] || `درس ${entry.courseCode}`,
        className: classMap[entry.classCode] || `کلاس ${entry.classCode}`,
        teacherName: teacherMap[entry.teacherCode] || `استاد ${entry.teacherCode}`
      }
    }));

    // Return the entries with pagination info
    return NextResponse.json({
      entries: enrichedEntries,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + enrichedEntries.length < totalCount
      }
    });
  } catch (error) {
    logger.error("Error in dailytimeline API:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline data" },
      { status: 500 }
    );
  }
} 