import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school users can upload student avatars
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Only school administrators can upload student avatars" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const studentCode = formData.get("studentCode") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!studentCode) {
      return NextResponse.json(
        { error: "Student code is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Verify that the student exists and belongs to the school
    const student = await connection.collection("students").findOne({
      "data.studentCode": studentCode,
      "data.schoolCode": user.schoolCode,
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found or doesn't belong to your school" },
        { status: 404 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomString}.${fileExtension}`;

    // Create upload directory
    const uploadDir = path.join(process.cwd(), "public", "avatars");
    await mkdir(uploadDir, { recursive: true });

    // Save file to disk
    const filePath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Prepare avatar object
    const avatarData = {
      filename: filename,
      originalName: file.name,
      path: `/avatars/${filename}`,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
    };

    // Update student record with new avatar
    const updateResult = await connection.collection("students").updateOne(
      { _id: student._id },
      { 
        $set: { 
          "data.avatar": avatarData,
          updatedAt: new Date()
        } 
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update student avatar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: avatarData,
      studentCode: studentCode,
    });

  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 