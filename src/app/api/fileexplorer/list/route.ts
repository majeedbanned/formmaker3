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

// Define types for user class and group data
interface ClassCode {
  label?: string;
  value: string;
}

interface GroupData {
  label?: string;
  value: string;
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

    // Build query filters based on user type
    let folderQuery: Record<string, any> = { schoolCode, path };
    let fileQuery: Record<string, any> = { schoolCode, path };

    // Permission-based filtering for students
    if (user.userType === 'student') {
      // Students can only see files/folders that are:
      // 1. Their own files
      // 2. Files shared with their classes
      // 3. Files shared with their groups
      
      const userClasses = user.classCode || [];
      const userGroups = user.groups || [];
      
      const classPermissions = userClasses.map((cls: ClassCode) => ({
        "permissions": {
          $elemMatch: { type: "class", code: cls.value || cls }
        }
      }));
      
      const groupPermissions = userGroups.map((group: GroupData) => ({
        "permissions": {
          $elemMatch: { type: "group", code: group.value || group }
        }
      }));

      const studentPermission = {
        "permissions": {
          $elemMatch: { type: "student", code: user.username }
        }
      };

      const ownFiles = { username: user.username };

      folderQuery = {
        ...folderQuery,
        $or: [
          ownFiles,
          studentPermission,
          ...classPermissions,
          ...groupPermissions
        ]
      };

      fileQuery = {
        ...fileQuery,
        $or: [
          ownFiles,
          studentPermission,
          ...classPermissions,
          ...groupPermissions
        ]
      };
    } else if (user.userType === 'teacher') {
      // Teachers can see:
      // 1. Their own files
      // 2. Files shared with them directly
      // 3. Files shared with their classes (need to fetch teacher's classes)
      
      // For now, teachers see their own files + files shared with them
      const teacherPermission = {
        "permissions": {
          $elemMatch: { type: "teacher", code: user.username }
        }
      };

      const ownFiles = { username: user.username };

      folderQuery = {
        ...folderQuery,
        $or: [
          ownFiles,
          teacherPermission
        ]
      };

      fileQuery = {
        ...fileQuery,
        $or: [
          ownFiles,
          teacherPermission
        ]
      };
    } else if (user.userType === 'school') {
      // School admins can see all files in their school
      folderQuery = { 
        ...folderQuery, 
        username: user.username 
      };
      fileQuery = { 
        ...fileQuery, 
        username: user.username 
      };
      console.log(`Filtering by username: ${user.username} for user type: ${user.userType}`);
    }

    // Get folders for the current path
    const folders = await folderCollection
      .find(folderQuery)
      .sort({ name: 1 })
      .toArray();

    console.log(`Found ${folders.length} folders at path "${path}"`);

    // Get files for the current path
    const files = await fileCollection
      .find(fileQuery)
      .sort({ name: 1 })
      .toArray();
      
    console.log(`Found ${files.length} files at path "${path}"`);

    // Transform data for the response - include permissions
    const folderList = folders.map(folder => ({
      ...folder,
      type: "folder",
      permissions: folder.permissions || []
    }));

    const fileList = files.map(file => ({
      ...file,
      type: "file",
      permissions: file.permissions || []
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