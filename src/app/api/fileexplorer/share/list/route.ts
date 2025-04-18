import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";
import { ObjectId } from "mongodb";

interface ShareQuery {
  schoolCode: string;
  fileId?: string;
}

interface FileDetails {
  _id: ObjectId;
  name?: string;
  size?: number;
  relativePath?: string;
  mimeType?: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { schoolCode } = await verifyJWT(token);
    
    if (!schoolCode) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    
    // Connect to database
    const { db } = await connectToDatabase("fileexplorer");
    
    if (!db) {
      throw new Error("Failed to connect to database");
    }
    
    // Query to find shares from this school
    const query: ShareQuery = { schoolCode };
    
    // Add filter by fileId if provided
    const fileId = searchParams.get("fileId");
    if (fileId) {
      query.fileId = fileId;
    }
    
    // Get total count for pagination
    const totalCount = await db.collection("fileShares").countDocuments(query);
    
    // Get shared files with pagination
    const shares = await db.collection("fileShares")
      .find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get file details for each share
    const fileIds = shares.map(share => share.fileId);
    const files = await db.collection("files")
      .find({ _id: { $in: fileIds.map(id => new ObjectId(id)) } })
      .toArray() as FileDetails[];
      
    // Create a map of fileId to file details
    const fileMap: Record<string, FileDetails> = {};
    files.forEach(file => {
      if (file._id) {
        fileMap[file._id.toString()] = file;
      }
    });
    
    // Combine shares with file details
    const sharesWithDetails = shares.map(share => {
      const file = fileMap[share.fileId] || { 
        name: "Unknown", 
        size: 0, 
        relativePath: "", 
        mimeType: "application/octet-stream" 
      } as FileDetails;
      
      return {
        ...share,
        fileName: file.name || "Unknown",
        fileSize: file.size || 0,
        filePath: file.relativePath || "",
        mimeType: file.mimeType || "application/octet-stream"
      };
    });
    
    // Return response with pagination
    return NextResponse.json({
      data: sharesWithDetails,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error listing shared files:", error);
    return NextResponse.json(
      { error: "خطا در بازیابی فایل‌های اشتراک‌گذاری شده" },
      { status: 500 }
    );
  }
} 