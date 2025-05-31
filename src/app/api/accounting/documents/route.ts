import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../chatbot7/config/route";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const runtime = 'nodejs';

// POST - Upload documents for transactions
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can upload documents
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized. Only school admins can upload documents." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const uploadedFiles = [];

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'accounting', user.schoolCode);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type not allowed: ${file.type}. Allowed types: images, PDF, Word, Excel` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 10MB` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}_${randomString}.${extension}`;
      const filepath = join(uploadDir, filename);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      uploadedFiles.push({
        originalName: file.name,
        filename: filename,
        filepath: `/uploads/accounting/${user.schoolCode}/${filename}`,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles
    });

  } catch (error) {
    console.error("Error uploading documents:", error);
    return NextResponse.json(
      { error: "Failed to upload documents" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific document
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can delete documents
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized. Only school admins can delete documents." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    const filepath = join(process.cwd(), 'public', 'uploads', 'accounting', user.schoolCode, filename);
    
    // Check if file exists and delete it
    if (existsSync(filepath)) {
      const { unlink } = await import("fs/promises");
      await unlink(filepath);
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
} 