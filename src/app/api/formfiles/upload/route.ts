import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 415 }
      );
    }
    
    // Parse the form data
    const formData = await request.formData();
    
    // Get schoolCode from form data
    const schoolCode = formData.get('schoolCode') as string;
    if (!schoolCode) {
      return NextResponse.json(
        { error: 'School code is required' },
        { status: 400 }
      );
    }
    
    // Get formId from form data
    const formId = formData.get('formId') as string;
    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      );
    }
    
    // Get file from form data
    const file = formData.get('file') as Blob | null;
    if (!file) {
      return NextResponse.json(
        { error: 'No file was uploaded' },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const guid = uuidv4();
    const originalFilename = formData.get('filename') as string || 'file';
    
    // Get file extension
    const fileExtMatch = originalFilename.match(/\.([^.]+)$/);
    const fileExt = fileExtMatch ? fileExtMatch[1] : '';
    
    // Create new filename with original extension
    const filename = `${guid}${fileExt ? '.' + fileExt : ''}`;
    
    // Create directory path
    const dirPath = path.join(process.cwd(), 'public', 'formfiles', schoolCode, 'forms', formId);
    
    // Ensure directory exists
    await mkdir(dirPath, { recursive: true });
    
    // Create file path
    const filePath = path.join(dirPath, filename);
    
    // Convert blob to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Write file to disk
    await writeFile(filePath, buffer);
    
    // Create public URL for the file
    const publicUrl = `/formfiles/${schoolCode}/forms/${formId}/${filename}`;
    
    // Return success response with file details
    return NextResponse.json({
      success: true,
      file: {
        filename: filename,
        originalName: originalFilename,
        size: file.size,
        type: file.type,
        path: publicUrl,
        uploadedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 