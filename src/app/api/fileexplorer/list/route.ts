import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

// Helper function to normalize path - ensures consistent path format
function normalizePath(path: string): string {
  // Remove leading/trailing slashes and handle empty paths
  return path.trim().replace(/^\/+|\/+$/g, '');
}

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

    // Get the current path from the query parameters
    const { searchParams } = new URL(request.url);
    const rawPath = searchParams.get("path") || "";
    const path = normalizePath(rawPath);
    
    console.log(`Listing files for school: ${schoolCode}, path: "${path}"`);

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const folderCollection = connection.collection("Folder");
    const fileCollection = connection.collection("File");

    // Get folders for the current path
    const folders = await folderCollection
      .find({ schoolCode, path })
      .sort({ name: 1 })
      .toArray();

    console.log(`Found ${folders.length} folders at path "${path}"`);

    // Get files for the current path
    const files = await fileCollection
      .find({ schoolCode, path })
      .sort({ name: 1 })
      .toArray();
      
    console.log(`Found ${files.length} files at path "${path}"`);

    // Transform data for the response
    const folderList = folders.map(folder => ({
      ...folder,
      type: "folder"
    }));

    const fileList = files.map(file => ({
      ...file,
      type: "file"
    }));

    // Combine folders and files
    const items = [...folderList, ...fileList];

    return NextResponse.json({
      items,
      path,
      count: items.length
    });
  } catch (error) {
    console.error("Error in list files/folders API:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return new NextResponse(
      JSON.stringify({ 
        message: "An error occurred while listing items",
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500 }
    );
  }
} 