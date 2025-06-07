import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "فایلی انتخاب نشده است" });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, message: "فقط فایل‌های تصویری مجاز هستند" });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "حجم فایل نباید بیشتر از ۵ مگابایت باشد" });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const filename = `news-${timestamp}-${originalName}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "news");
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Write file to public/uploads/news directory
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    // Return the public URL
    const url = `/uploads/news/${filename}`;

    return NextResponse.json({
      success: true,
      url: url,
      message: "تصویر با موفقیت آپلود شد"
    });
  } catch (error) {
    console.error("Error uploading news image:", error);
    return NextResponse.json(
      { success: false, message: "خطا در آپلود تصویر" },
      { status: 500 }
    );
  }
} 