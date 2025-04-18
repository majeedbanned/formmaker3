import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import mime from "mime-types";

// Set runtime to nodejs
export const runtime = 'nodejs';

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

    // Get password from query parameter if provided
    const password = request.nextUrl.searchParams.get("password");

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collection
    const shareCollection = connection.collection("FileShare");
    const fileCollection = connection.collection("File");

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

    // Verify password if required
    if (shareRecord.isPasswordProtected) {
      if (!password) {
        return NextResponse.json(
          { message: "Password is required to access this file" },
          { status: 401 }
        );
      }

      if (shareRecord.password !== password) {
        return NextResponse.json(
          { message: "Incorrect password" },
          { status: 401 }
        );
      }
    }

    // Get the file information
    const fileId = shareRecord.fileId;
    const file = await fileCollection.findOne({ _id: new ObjectId(fileId) });

    if (!file) {
      return NextResponse.json(
        { message: "File not found" },
        { status: 404 }
      );
    }

    // Determine the file path
    // This depends on your file storage system
    // If you're storing files in the filesystem:
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadDir, file.schoolCode, file.path || "", file.name);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { message: "File not found on server" },
        { status: 404 }
      );
    }

    // Update access count
    await shareCollection.updateOne(
      { shareId },
      { $inc: { accessCount: 1 } }
    );

    // Read file content
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine content type
    const contentType = mime.lookup(file.name) || "application/octet-stream";
    
    // Create headers for the response
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${file.name}"`);
    
    // Return file as response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error downloading shared file:", error);
    return NextResponse.json(
      { message: "An error occurred while downloading the file" },
      { status: 500 }
    );
  }
} 