import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { writeFile } from "fs/promises";
import path from "path";
import { mkdir } from "fs/promises";
import { Collection } from "mongodb";

// Set runtime to nodejs
export const runtime = 'nodejs';

// Define a type for FormData file objects
type FormDataFile = {
  arrayBuffer: () => Promise<ArrayBuffer>;
  name: string;
  type: string;
  size?: number;
};

// Helper function to normalize path - ensures consistent path format
function normalizePath(path: string): string {
  // Remove leading/trailing slashes and handle empty paths
  return path.trim().replace(/^\/+|\/+$/g, '');
}

// Helper function to ensure all parent folders exist
async function ensureParentFoldersExist(
  connection: { collection: (name: string) => Collection },
  schoolCode: string, 
  username: string, 
  folderPath: string
) {
  if (!folderPath || folderPath === "") {
    return; // No parent folders needed for root uploads
  }
  
  const folderCollection = connection.collection("Folder");
  const pathParts = folderPath.split('/');
  let currentPath = "";
  
  // Check each level of the path and create folders if they don't exist
  for (let i = 0; i < pathParts.length; i++) {
    const folderName = pathParts[i];
    // Skip empty parts (could happen with leading/trailing slashes)
    if (!folderName) continue;
    
    const parentPath = currentPath;
    currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    
    // Check if this folder segment exists
    const existingFolder = await folderCollection.findOne({
      schoolCode,
      path: parentPath,
      name: folderName
    });
    
    // If not, create it
    if (!existingFolder) {
      console.log(`Creating parent folder: ${folderName} at path: ${parentPath}`);
      await folderCollection.insertOne({
        name: folderName,
        path: parentPath,
        schoolCode,
        username,
        createdAt: new Date()
      });
    }
  }
}

// Helper function to process a single file upload
async function processFileUpload(
  file: FormDataFile,
  folderPath: string,
  schoolCode: string,
  username: string,
  connection: { collection: (name: string) => Collection }
) {
  // Get file details
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = file.name;
  const fileType = file.type;
  const fileSize = file.size || buffer.length; // Use provided size if available, otherwise calculate

  // Create storage path for the file
  const uploadDir = path.join(process.cwd(), "uploads", schoolCode);
  const filePath = path.join(uploadDir, folderPath, fileName);
  
  // Create directory if it doesn't exist
  await mkdir(path.dirname(filePath), { recursive: true });

  // Write the file to disk
  await writeFile(filePath, buffer);
  
  // Get the File collection
  const fileCollection = connection.collection("File");

  // Check if file already exists in database
  const existingFile = await fileCollection.findOne({
    schoolCode,
    path: folderPath,
    name: fileName,
  });

  // If file exists, update it
  if (existingFile) {
    await fileCollection.updateOne(
      { _id: existingFile._id },
      { 
        $set: {
          size: fileSize,
          type: fileType,
          storagePath: filePath,
          username,
          createdAt: new Date()
        } 
      }
    );

    return {
      message: "File updated successfully",
      file: {
        ...existingFile,
        size: fileSize,
        type: fileType,
        storagePath: filePath,
        createdAt: new Date(),
        fileType: "file"
      },
    };
  }

  // Create file record in database
  const newFile = {
    name: fileName,
    path: folderPath,
    schoolCode,
    username,
    size: fileSize,
    type: fileType,
    storagePath: filePath,
    createdAt: new Date()
  };

  const result = await fileCollection.insertOne(newFile);

  return {
    message: "File uploaded successfully",
    file: {
      ...newFile,
      _id: result.insertedId,
      fileType: "file"
    },
  };
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

    // Restrict students from uploading files
    if (user.userType === "student") {
      return new NextResponse(
        JSON.stringify({ message: "Students are not allowed to upload files" }),
        { status: 403 }
      );
    }

    // Get school code from user
    const schoolCode = user.schoolCode;
    const username = user.username; // Get username for storing with files
    
    if (!schoolCode) {
      return new NextResponse(
        JSON.stringify({ message: "School code not found" }),
        { status: 400 }
      );
    }

    // Get the formData
    const formData = await request.formData();
    console.log("FormData received:", Object.fromEntries(formData.entries()));
    
    // Collect all files from the form data
    const files: FormDataFile[] = [];
    
    // Check for file entries
    for (const [key, value] of formData.entries()) {
      if (key === "file" || key.startsWith("file")) {
        // Check if it's a file by looking for common file properties
        if (value && typeof value === 'object' && 'arrayBuffer' in value && 'name' in value) {
          files.push(value as FormDataFile);
        }
      }
    }
    
    const rawFolderPath = formData.get("path") as string || "";
    const folderPath = normalizePath(rawFolderPath);
    
    console.log(`Found ${files.length} files to process`);
    if (files.length > 0) {
      console.log("First file:", {
        name: files[0].name,
        type: files[0].type,
        size: files[0].size || 'unknown'
      });
    }
    console.log("Folder path:", folderPath);

    if (files.length === 0) {
      return new NextResponse(
        JSON.stringify({ message: "At least one file is required" }),
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Ensure all parent folders in the path exist
    await ensureParentFoldersExist(connection, schoolCode, username, folderPath);
    
    // Process all files
    const results = await Promise.all(
      files.map(file => processFileUpload(file, folderPath, schoolCode, username, connection))
    );
    
    // If there's only one file, maintain backwards compatibility
    if (results.length === 1) {
      return NextResponse.json(results[0]);
    }
    
    // Return all results for multiple files
    return NextResponse.json({
      message: `Successfully processed ${results.length} files`,
      files: results.map(result => result.file)
    });
  } catch (error) {
    console.error("Error in upload file API:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return new NextResponse(
      JSON.stringify({ 
        message: "An error occurred while uploading the file(s)",
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 