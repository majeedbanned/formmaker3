import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

// Helper function to normalize path - ensures consistent path format
function normalizePath(path: string): string {
  // Remove leading/trailing slashes and handle empty paths
  return path.trim().replace(/^\/+|\/+$/g, '');
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

    // Restrict students from creating folders
    if (user.userType === "student") {
      return new NextResponse(
        JSON.stringify({ message: "Students are not allowed to create folders" }),
        { status: 403 }
      );
    }

    // Get school code from user
    const schoolCode = user.schoolCode;
    const username = user.username; // Get username for storing with folders
    
    if (!schoolCode) {
      return new NextResponse(
        JSON.stringify({ message: "School code not found" }),
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get the collections
    const folderCollection = connection.collection("Folder");

    // Get data from request body
    const { name, path: rawPath, password } = await request.json();
    const path = normalizePath(rawPath || "");

    // Validate required fields
    if (!name) {
      return new NextResponse(
        JSON.stringify({ message: "Folder name is required" }),
        { status: 400 }
      );
    }

    // Make sure folder doesn't already exist
    const existingFolder = await folderCollection.findOne({
      schoolCode,
      path,
      name,
    });

    if (existingFolder) {
      return new NextResponse(
        JSON.stringify({ message: "A folder with this name already exists" }),
        { status: 400 }
      );
    }

    // Verify that parent path exists (except for root folders)
    if (path && path !== "") {
      // Split path to get parent folder parts
      const pathParts = path.split('/');
      const parentFolderName = pathParts[pathParts.length - 1];
      const grandparentPath = pathParts.length > 1 
        ? pathParts.slice(0, pathParts.length - 1).join('/') 
        : "";
      
      // Check if parent folder exists
      const parentFolder = await folderCollection.findOne({
        schoolCode,
        path: grandparentPath,
        name: parentFolderName
      });
      
      if (!parentFolder) {
        console.log(`Parent folder not found: ${parentFolderName} at path: ${grandparentPath}`);
        return new NextResponse(
          JSON.stringify({ message: "Parent folder does not exist" }),
          { status: 400 }
        );
      }
    }

    // Create new folder with password if provided
    const folder = {
      name,
      path: path || "",
      schoolCode,
      username,
      createdAt: new Date(),
      password: password || undefined // Add password if provided
    };

    const result = await folderCollection.insertOne(folder);

    return NextResponse.json({
      message: "Folder created successfully",
      folder: {
        ...folder,
        _id: result.insertedId,
        type: "folder",
      },
    });
  } catch (error) {
    console.error("Error in create folder API:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Check for MongoDB timeout error
    if (error instanceof Error && error.message.includes("buffering timed out")) {
      return new NextResponse(
        JSON.stringify({ 
          message: "Database connection timed out. Please try again later.",
          error: "MONGODB_TIMEOUT" 
        }),
        { status: 503 }
      );
    }
    
    return new NextResponse(
      JSON.stringify({ 
        message: "An error occurred while creating the folder",
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500 }
    );
  }
}

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

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get the collections
    const folderCollection = connection.collection("Folder");
    const fileCollection = connection.collection("File");

    // Get data from request body
    const { id } = await request.json();

    // Validate required fields
    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: "Folder ID is required" }),
        { status: 400 }
      );
    }

    // Find the folder
    const folder = await folderCollection.findOne({ _id: new ObjectId(id) });

    // Check if folder exists
    if (!folder) {
      return new NextResponse(
        JSON.stringify({ message: "Folder not found" }),
        { status: 404 }
      );
    }

    console.log(`Deleting folder: ${folder.name} at path: ${folder.path}`);
    console.log(`This will also delete all subfolders and files in ${folder.path}/${folder.name}`);
    
    // Check if the folder belongs to the user's school
    if (folder.schoolCode !== schoolCode) {
      return new NextResponse(
        JSON.stringify({ message: "Unauthorized access to this folder" }),
        { status: 403 }
      );
    }

    // Delete the folder record from database
    await folderCollection.deleteOne({ _id: new ObjectId(id) });

    // Also delete any files in this folder and subfolders
    await fileCollection.deleteMany({
      schoolCode: schoolCode,
      path: new RegExp(`^${folder.path}/${folder.name}(/.*)?$`)
    });

    // Delete all subfolders
    await folderCollection.deleteMany({
      schoolCode: schoolCode,
      path: new RegExp(`^${folder.path}/${folder.name}(/.*)?$`)
    });

    return NextResponse.json({
      message: "Folder deleted successfully"
    });
  } catch (error) {
    console.error("Error in delete folder API:", error);
    return new NextResponse(
      JSON.stringify({ message: "An error occurred while deleting the folder" }),
      { status: 500 }
    );
  }
} 