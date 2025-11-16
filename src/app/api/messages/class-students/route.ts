import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from 'mongoose';

// Set runtime to nodejs
export const runtime = 'nodejs';

// Define interface for Student
interface IStudent {
  _id: mongoose.Types.ObjectId;
  data: Map<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Function to get the Student model for a specific MongoDB connection
const getStudentModel = (connection: mongoose.Connection) => {
  try {
    return connection.model<IStudent>('Student');
  } catch {
    // Define schema if model doesn't exist
    const schema = new mongoose.Schema<IStudent>({
      _id: mongoose.Schema.Types.ObjectId,
      data: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
      },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }, { 
      timestamps: true,
      strict: false 
    });
    
    return connection.model<IStudent>('Student', schema);
  }
};

export async function POST(request: Request) {
  try {
    // Get request body
    const { classCodes, schoolCode } = await request.json();
    
    if (!classCodes || !Array.isArray(classCodes) || classCodes.length === 0) {
      return NextResponse.json(
        { error: "Class codes are required" },
        { status: 400 }
      );
    }
    
    if (!schoolCode) {
      return NextResponse.json(
        { error: "School code is required" },
        { status: 400 }
      );
    }
    
    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get Student model
    const StudentModel = getStudentModel(connection);
    
    // console.log("Looking for students in classes:", classCodes);
    
    // Find all students in the specified classes
    const students = await StudentModel.find({
      'data.classCode.value': {$in: classCodes},
      'data.schoolCode': schoolCode
    }).exec();
    
    // console.log(`Found ${students.length} students matching the criteria`);
    
    if (!students || students.length === 0) {
      return NextResponse.json({ students: [] });
    }
    
    // Extract student codes
    const studentCodes = [];
    for (const student of students) {
      if (student.data && typeof student.data.get === 'function') {
        const studentCode = student.data.get('studentCode');
        if (studentCode) {
          studentCodes.push(studentCode);
        }
      }
    }
    
    // Remove duplicates
    const uniqueStudentCodes = [...new Set(studentCodes)];
    
    // console.log(`Returning ${uniqueStudentCodes.length} unique student codes`);
    
    return NextResponse.json({ 
      students: uniqueStudentCodes,
      count: uniqueStudentCodes.length
    });
    
  } catch (error) {
    console.error("Error fetching students in classes:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch students in classes" },
      { status: 500 }
    );
  }
} 