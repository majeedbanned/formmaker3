import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";
import { createReadStream, stat } from "fs";
import { promisify } from "util";

// Set runtime to nodejs
export const runtime = 'nodejs';

const statAsync = promisify(stat);

export async function GET(request: NextRequest) {
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

    // Get file ID from query params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: "File ID is required" }),
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get the File collection
    const fileCollection = connection.collection("File");

    // Find the file
    const file = await fileCollection.findOne({ 
      _id: new ObjectId(id),
      schoolCode 
    });

    if (!file) {
      return new NextResponse(
        JSON.stringify({ message: "File not found" }),
        { status: 404 }
      );
    }

    // Check if the file physically exists
    const filePath = file.storagePath;
    try {
      const stats = await statAsync(filePath);
      
      // Get file extension from name
      const fileExtension = file.name.split('.').pop() || '';
      
      // Set response headers
      const headers = new Headers();
      headers.set('Content-Disposition', `attachment; filename="${file.name}"`);
      headers.set('Content-Length', stats.size.toString());
      
      // Set content type based on file extension
      const contentType = getContentType(fileExtension);
      if (contentType) {
        headers.set('Content-Type', contentType);
      }
      
      // Create file read stream
      const fileStream = createReadStream(filePath);
      
      // Create a ReadableStream from the file stream
      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => {
            controller.enqueue(chunk);
          });
          
          fileStream.on('end', () => {
            controller.close();
          });
          
          fileStream.on('error', (err) => {
            controller.error(err);
          });
        },
        cancel() {
          fileStream.destroy();
        }
      });
      
      return new NextResponse(readableStream, {
        status: 200,
        headers
      });
    } catch (error) {
      console.error("Error accessing file:", error);
      return new NextResponse(
        JSON.stringify({ message: "File not accessible" }),
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error in download file API:", error);
    return new NextResponse(
      JSON.stringify({ message: "An error occurred while downloading the file" }),
      { status: 500 }
    );
  }
}

// Helper function to determine content type based on file extension
function getContentType(extension: string): string {
  const types: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'html': 'text/html',
    'zip': 'application/zip',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'json': 'application/json',
  };
  
  return types[extension.toLowerCase()] || 'application/octet-stream';
} 