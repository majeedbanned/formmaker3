import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function PATCH(request: NextRequest) {
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
    const { id, newName } = await request.json();

    // Validate required fields
    if (!id || !newName) {
      return new NextResponse(
        JSON.stringify({ message: "Folder ID and new name are required" }),
        { status: 400 }
      );
    }
    
    // Validate new name (no slashes, etc.)
    if (newName.includes('/') || newName.includes('\\')) {
      return new NextResponse(
        JSON.stringify({ message: "Folder name cannot contain slashes" }),
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const folderCollection = connection.collection("Folder");
    const fileCollection = connection.collection("File");

    // Find the folder
    const folder = await folderCollection.findOne({ 
      _id: new ObjectId(id),
      schoolCode 
    });

    if (!folder) {
      return new NextResponse(
        JSON.stringify({ message: "Folder not found" }),
        { status: 404 }
      );
    }

    // Check if a folder with the new name already exists in the same path
    const existingFolder = await folderCollection.findOne({
      schoolCode,
      path: folder.path,
      name: newName,
      _id: { $ne: new ObjectId(id) } // Exclude the current folder
    });

    if (existingFolder) {
      return new NextResponse(
        JSON.stringify({ message: "A folder with this name already exists in this location" }),
        { status: 400 }
      );
    }

    // Update the folder name
    await folderCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name: newName } }
    );

    // Get the old folder path for subfolders and files
    const oldFolderPath = folder.path ? `${folder.path}/${folder.name}` : folder.name;
    const newFolderPath = folder.path ? `${folder.path}/${newName}` : newName;

    // Update path of all subfolders
    // For each subfolder that starts with oldFolderPath, replace it with newFolderPath
    await folderCollection.updateMany(
      { schoolCode, path: new RegExp(`^${oldFolderPath}(/.*)?$`) },
      [
        {
          $set: {
            path: {
              $replaceOne: {
                input: "$path",
                find: oldFolderPath,
                replacement: newFolderPath
              }
            }
          }
        }
      ]
    );

    // Update path of all files in the folder and subfolders
    await fileCollection.updateMany(
      { schoolCode, path: new RegExp(`^${oldFolderPath}(/.*)?$`) },
      [
        {
          $set: {
            path: {
              $replaceOne: {
                input: "$path",
                find: oldFolderPath,
                replacement: newFolderPath
              }
            }
          }
        }
      ]
    );

    return NextResponse.json({
      message: "Folder renamed successfully",
      oldName: folder.name,
      newName
    });
  } catch (error) {
    console.error("Error in rename folder API:", error);
    return new NextResponse(
      JSON.stringify({ message: "An error occurred while renaming the folder" }),
      { status: 500 }
    );
  }
} 