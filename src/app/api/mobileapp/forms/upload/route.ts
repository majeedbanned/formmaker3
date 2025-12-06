import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

interface JWTPayload {
  userId: string;
  domain: string;
  schoolCode: string;
  role: string;
  userType: string;
  username: string;
  name?: string;
  iat?: number;
  exp?: number;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { formId, fieldName, fileName, mimeType, base64Data } = body || {};

    if (!formId || !fieldName || !fileName || !base64Data) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات فایل ناقص است' },
        { status: 400 }
      );
    }

    // Prepare directories under public
    const publicDir = path.join(process.cwd(), 'public');
    const formsDir = path.join(publicDir, 'formfiles');
    const targetDir = path.join(formsDir, 'forms', formId);

    if (!fs.existsSync(formsDir)) {
      fs.mkdirSync(formsDir, { recursive: true });
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Clean filename to avoid directory traversal issues
    const sanitizedOriginalName = fileName.replace(/[^a-zA-Z0-9\.\-_\u0600-\u06FF]/g, '_');
    const uniqueSegment = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const extension = path.extname(sanitizedOriginalName) || '';
    const storedFileName = `${fieldName}-${uniqueSegment}${extension}`;
    const storedPath = path.join(targetDir, storedFileName);

    // Remove data URI prefix if present
    const base64Content = base64Data.includes(',') ? base64Data.split(',').pop() : base64Data;

    if (!base64Content) {
      return NextResponse.json(
        { success: false, message: 'داده فایل نامعتبر است' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(storedPath, fileBuffer);

    const relativePath = `/formfiles/forms/${formId}/${storedFileName}`;

    return NextResponse.json({
      success: true,
      file: {
        filename: storedFileName,
        originalName: sanitizedOriginalName,
        path: relativePath,
        size: fileBuffer.length,
        type: mimeType || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        uploadedBy: decoded.username,
      },
    });
  } catch (error: any) {
    console.error('Error uploading form file:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در آپلود فایل' },
      { status: 500 }
    );
  }
}


// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}



