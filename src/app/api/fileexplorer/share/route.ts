import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";
import crypto from "crypto";

// Set runtime to nodejs
export const runtime = 'nodejs';

// Calculate expiration date based on expiresIn parameter
function calculateExpiryDate(expiresIn: string): Date | null {
  const now = new Date();
  
  if (expiresIn === 'never') {
    return null; // No expiration
  }
  
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1));
  
  switch(unit) {
    case 'h': // Hours
      now.setHours(now.getHours() + value);
      break;
    case 'd': // Days
      now.setDate(now.getDate() + value);
      break;
    default:
      return null; // Invalid format, no expiration
  }
  
  return now;
}

export async function POST(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse(
        JSON.stringify({ message: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Get school code from user
    const schoolCode = user.schoolCode;
    if (!schoolCode) {
      return new NextResponse(
        JSON.stringify({ message: "School code not found" }),
        { status: 400 }
      );
    }

    // Get data from request body
    const { fileId, expiresIn, isPasswordProtected, password } = await request.json();

    // Validate required fields
    if (!fileId) {
      return new NextResponse(
        JSON.stringify({ message: "File ID is required" }),
        { status: 400 }
      );
    }
    
    if (isPasswordProtected && !password) {
      return new NextResponse(
        JSON.stringify({ message: "Password is required when password protection is enabled" }),
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const fileCollection = connection.collection("File");
    const shareCollection = connection.collection("FileShare");

    // Find the file
    const file = await fileCollection.findOne({ 
      _id: new ObjectId(fileId),
      schoolCode
    });

    if (!file) {
      return new NextResponse(
        JSON.stringify({ message: "File not found" }),
        { status: 404 }
      );
    }

    // Generate a unique ID for the share link
    const shareId = crypto.randomBytes(16).toString('hex');
    
    // Calculate expiry date
    const expiresAt = calculateExpiryDate(expiresIn);
    
    // Create share record
    const shareRecord = {
      shareId,
      fileId: new ObjectId(fileId),
      schoolCode,
      createdBy: user.username,
      createdAt: new Date(),
      expiresAt,
      isPasswordProtected,
      password: isPasswordProtected ? password : undefined,
      fileName: file.name,
      filePath: file.path,
      fileType: file.type,
      fileSize: file.size,
      accessCount: 0
    };

    // Save share record to database
    await shareCollection.insertOne(shareRecord);

    return NextResponse.json({
      message: "Share link created successfully",
      shareId,
      expiresAt
    });
  } catch (error) {
    console.error("Error creating share link:", error);
    return new NextResponse(
      JSON.stringify({ message: "An error occurred while creating the share link" }),
      { status: 500 }
    );
  }
} 