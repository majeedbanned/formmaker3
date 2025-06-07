import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `testimonial-avatar-${timestamp}${fileExtension}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "testimonial-avatars");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Write file
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Return the URL
    const fileUrl = `/uploads/testimonial-avatars/${fileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
} 