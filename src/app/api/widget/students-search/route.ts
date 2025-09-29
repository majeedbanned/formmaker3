/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getCurrentUser } from '@/app/api/chatbot7/config/route';

export async function GET(request: NextRequest) {
  try {
    // Get current user for authorization
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school and teacher users can access this endpoint
    if (user.userType !== "school" && user.userType !== "teacher") {
      return NextResponse.json(
        { error: "Access denied. Only school admins and teachers can access student data." },
        { status: 403 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Get query parameters
    const searchParams = new URL(request.url).searchParams;
    const searchTerm = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '1000');

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    
    let students: any[] = [];
    
    if (user.userType === "school") {
      // School users can see all students in their school
      const query: any = {
        'data.schoolCode': user.schoolCode,
        'data.isActive': true
      };

      // Add search filters if search term is provided
      if (searchTerm.trim()) {
        const searchRegex = { $regex: searchTerm.trim(), $options: 'i' };
        query.$or = [
          { 'data.studentName': searchRegex },
          { 'data.studentFamily': searchRegex },
          { 'data.studentCode': searchRegex },
          { 'data.classCode.label': searchRegex }
        ];
      }

      students = await connection
        .collection('students')
        .find(query)
        .sort({ 'data.studentFamily': 1, 'data.studentName': 1 })
        .limit(limit)
        .toArray();

    } else if (user.userType === "teacher") {
      // Teachers can only see students in classes they teach
      
      // First, get all classes where this teacher teaches
      const teacherClasses = await connection
        .collection('classes')
        .find({
          'data.schoolCode': user.schoolCode,
          'data.teachers.teacherCode': user.username
        })
        .toArray();

      if (teacherClasses.length === 0) {
        return NextResponse.json({ students: [], classes: [] });
      }

      // Extract all student codes from these classes
      const studentCodes = new Set<string>();
      teacherClasses.forEach((classDoc: any) => {
        if (classDoc.data?.students) {
          classDoc.data.students.forEach((student: any) => {
            if (student.studentCode) {
              studentCodes.add(student.studentCode);
            }
          });
        }
      });

      if (studentCodes.size === 0) {
        return NextResponse.json({ students: [], classes: teacherClasses });
      }

      // Build query for students
      const query: any = {
        'data.schoolCode': user.schoolCode,
        'data.studentCode': { $in: Array.from(studentCodes) },
        'data.isActive': true
      };

      // Add search filters if search term is provided
      if (searchTerm.trim()) {
        const searchRegex = { $regex: searchTerm.trim(), $options: 'i' };
        query.$and = [
          { 'data.studentCode': { $in: Array.from(studentCodes) } },
          {
            $or: [
              { 'data.studentName': searchRegex },
              { 'data.studentFamily': searchRegex },
              { 'data.studentCode': searchRegex },
              { 'data.classCode.label': searchRegex }
            ]
          }
        ];
        // Remove the previous studentCode filter since it's now in $and
        delete query['data.studentCode'];
      }

      students = await connection
        .collection('students')
        .find(query)
        .sort({ 'data.studentFamily': 1, 'data.studentName': 1 })
        .limit(limit)
        .toArray();
    }

    return NextResponse.json({
      students,
      userType: user.userType,
      searchTerm,
      count: students.length
    });

  } catch (error) {
    console.error("Error in students search API:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
} 