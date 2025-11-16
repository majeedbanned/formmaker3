import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from 'mongoose';

// Set runtime to nodejs
export const runtime = 'nodejs';

// Define interface for database documents
interface IDocument {
  _id: mongoose.Types.ObjectId;
  data: Map<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Function to get the Student model
const getStudentModel = (connection: mongoose.Connection) => {
  try {
    return connection.model<IDocument>('Student');
  } catch {
    // Define schema if model doesn't exist
    const schema = new mongoose.Schema<IDocument>({
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
    
    return connection.model<IDocument>('Student', schema);
  }
};

// Function to get the Teacher model
const getTeacherModel = (connection: mongoose.Connection) => {
  try {
    return connection.model<IDocument>('Teacher');
  } catch {
    // Define schema if model doesn't exist
    const schema = new mongoose.Schema<IDocument>({
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
    
    return connection.model<IDocument>('Teacher', schema);
  }
};

export async function POST(request: Request) {
  try {
    // Get request body
    const { recipientCodes, schoolCode } = await request.json();
    
    if (!recipientCodes || !Array.isArray(recipientCodes) || recipientCodes.length === 0) {
      return NextResponse.json(
        { error: "Recipient codes are required" },
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
    
    // Get models
    const StudentModel = getStudentModel(connection);
    const TeacherModel = getTeacherModel(connection);
    
    // console.log("Looking for phones for recipients:", recipientCodes);
    
    // Find all students with the specified recipient codes
    const students = await StudentModel.find({
      $or: [
        { 'data.studentCode': { $in: recipientCodes } },
        { 'data.studentCode.value': { $in: recipientCodes } }
      ],
      'data.schoolCode': schoolCode
    }).lean().exec();
    
    // console.log(`Found ${students.length} students`);
    
    // Find all teachers with the specified recipient codes
    const teachers = await TeacherModel.find({
      $or: [
        { 'data.teacherCode': { $in: recipientCodes } },
        { 'data.teacherCode.value': { $in: recipientCodes } }
      ],
      'data.schoolCode': schoolCode
    }).lean().exec();
    
    // console.log(`Found ${teachers.length} teachers`);
    
    // Convert to plain objects for easier processing
    const studentObjects = students.map(s => {
      // Convert Map to regular object if needed
      if (s.data instanceof Map) {
        const dataObj: Record<string, unknown> = {};
        s.data.forEach((value, key) => {
          dataObj[key] = value;
        });
        return { ...s, data: dataObj };
      }
      return s;
    });
    
    const teacherObjects = teachers.map(t => {
      // Convert Map to regular object if needed
      if (t.data instanceof Map) {
        const dataObj: Record<string, unknown> = {};
        t.data.forEach((value, key) => {
          dataObj[key] = value;
        });
        return { ...t, data: dataObj };
      }
      return t;
    });
    
    return NextResponse.json({
      phones: {
        studentPhones: studentObjects,
        teacherPhones: teacherObjects
      }
    });
    
  } catch (error) {
    console.error("Error fetching recipient phones:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch recipient phones" },
      { status: 500 }
    );
  }
} 