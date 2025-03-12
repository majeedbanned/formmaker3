import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const directory = formData.get('directory') as string || 'uploads';
    const oldFilePath = formData.get('oldFilePath') as string;
    const connectionString = process.env.NEXT_PUBLIC_MONGODB_URI || '';
    const collectionName = formData.get('collectionName') as string;
    const documentId = formData.get('documentId') as string;
    const fieldName = formData.get('fieldName') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const filename = `${timestamp}-${originalName}`;

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', directory);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Delete old file if it exists
    if (oldFilePath) {
      const oldFileFullPath = join(process.cwd(), 'public', oldFilePath.replace(/^\//, ''));
      try {
        if (existsSync(oldFileFullPath)) {
          await unlink(oldFileFullPath);
        }
      } catch (error) {
        console.error('Error deleting old file:', error);
      }
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Create file info object
    const fileInfo = {
      filename,
      originalName,
      path: `/${directory}/${filename}`,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    };

    // Update MongoDB if document ID is provided
    if (connectionString && collectionName && documentId && fieldName) {
      const client = await MongoClient.connect(connectionString);
      const db = client.db();
      const collection = db.collection(collectionName);

      const updateQuery = {
        _id: new ObjectId(documentId)
      };

      const updateData = {
        $set: {
          [`data.${fieldName}`]: fileInfo
        }
      };

      await collection.updateOne(updateQuery, updateData);
      await client.close();
    }

    return NextResponse.json(fileInfo);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
} 