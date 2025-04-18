import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

// GET endpoint to retrieve shared file information
export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;
    
    if (!shareId) {
      return NextResponse.json(
        { message: "Share ID is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collection
    const shareCollection = connection.collection("FileShare");

    // Find the share record
    const shareRecord = await shareCollection.findOne({ shareId });

    if (!shareRecord) {
      return NextResponse.json(
        { message: "Shared file not found or link has expired" },
        { status: 404 }
      );
    }

    // Check if share has expired
    if (shareRecord.expiresAt && new Date(shareRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { message: "This share link has expired" },
        { status: 410 }
      );
    }

    // Prepare file information for response
    const fileInfo = {
      shareId,
      fileName: shareRecord.fileName,
      fileType: shareRecord.fileType,
      fileSize: shareRecord.fileSize,
      expiresAt: shareRecord.expiresAt,
      isPasswordProtected: shareRecord.isPasswordProtected,
      accessCount: shareRecord.accessCount
    };

    // If password protected and not yet verified, return limited info
    if (shareRecord.isPasswordProtected) {
      return NextResponse.json(
        { 
          message: "Password required to access this file",
          file: fileInfo
        },
        { status: 403 }
      );
    }
    
    // Increment access count
    await shareCollection.updateOne(
      { shareId },
      { $inc: { accessCount: 1 } }
    );

    // Return complete file info
    return NextResponse.json({
      message: "File information retrieved successfully",
      file: fileInfo
    });
  } catch (error) {
    console.error("Error retrieving shared file:", error);
    return NextResponse.json(
      { message: "An error occurred while retrieving the shared file" },
      { status: 500 }
    );
  }
}

// POST endpoint to verify password for protected files
export async function POST(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;
    
    if (!shareId) {
      return NextResponse.json(
        { message: "Share ID is required" },
        { status: 400 }
      );
    }

    // Get password from request body
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { message: "Password is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collection
    const shareCollection = connection.collection("FileShare");

    // Find the share record
    const shareRecord = await shareCollection.findOne({ shareId });

    if (!shareRecord) {
      return NextResponse.json(
        { message: "Shared file not found or link has expired" },
        { status: 404 }
      );
    }

    // Check if share has expired
    if (shareRecord.expiresAt && new Date(shareRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { message: "This share link has expired" },
        { status: 410 }
      );
    }

    // Verify if the share is password protected
    if (!shareRecord.isPasswordProtected) {
      return NextResponse.json(
        { message: "This file does not require a password" },
        { status: 400 }
      );
    }

    // Verify password
    if (shareRecord.password !== password) {
      return NextResponse.json(
        { message: "Incorrect password" },
        { status: 401 }
      );
    }
    
    // Password is correct, increment access count
    await shareCollection.updateOne(
      { shareId },
      { $inc: { accessCount: 1 } }
    );

    // Return success
    return NextResponse.json({
      message: "Password verified successfully",
      access: true
    });
  } catch (error) {
    console.error("Error verifying shared file password:", error);
    return NextResponse.json(
      { message: "An error occurred while verifying the password" },
      { status: 500 }
    );
  }
} 