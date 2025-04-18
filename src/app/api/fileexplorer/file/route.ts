import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { unlink } from "fs/promises";
import { ObjectId } from "mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
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
    const { id } = await request.json();

    // Validate required fields
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
    const file = await fileCollection.findOne({ _id: new ObjectId(id) });

    // Check if file exists
    if (!file) {
      return new NextResponse(
        JSON.stringify({ message: "File not found" }),
        { status: 404 }
      );
    }

    // Check if the file belongs to the user's school
    if (file.schoolCode !== schoolCode) {
      return new NextResponse(
        JSON.stringify({ message: "Unauthorized access to this file" }),
        { status: 403 }
      );
    }

    // Delete the physical file if it exists
    try {
      await unlink(file.storagePath);
    } catch (error) {
      console.error("Error deleting file from disk:", error);
      // Continue even if physical file deletion fails
    }

    // Delete the file record from database
    const result = await fileCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return new NextResponse(
        JSON.stringify({ message: "File could not be deleted" }),
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error("Error in delete file API:", error);
    return new NextResponse(
      JSON.stringify({ message: "An error occurred while deleting the file" }),
      { status: 500 }
    );
  }
} 