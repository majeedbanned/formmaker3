import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const directory = formData.get('directory') as string || 'uploads';
    const oldFilePath = formData.get('oldFilePath') as string;
    const collectionName = formData.get('collectionName') as string;
    const documentId = formData.get('documentId') as string;
    const fieldName = formData.get('fieldName') as string;

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Handling file upload for domain: ${domain}, directory: ${directory}`);

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
          logger.info(`Deleted old file: ${oldFilePath}`);
        }
      } catch (error) {
        logger.error(`Error deleting old file: ${oldFilePath}`, error);
      }
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);
    logger.info(`File written to: ${filePath}`);

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
    if (collectionName && documentId && fieldName) {
      try {
        // Connect to the domain-specific database
        const connection = await connectToDatabase(domain);
        
        // Get the collection directly from the connection
        const collection = connection.collection(collectionName);

        const updateQuery = {
          _id: new ObjectId(documentId)
        };

        const updateData = {
          $set: {
            [`data.${fieldName}`]: fileInfo
          }
        };

        const result = await collection.updateOne(updateQuery, updateData);
        
        if (result.matchedCount === 0) {
          logger.warn(`No document found to update with ID: ${documentId}`);
        } else {
          logger.info(`Updated document in ${collectionName}, ID: ${documentId}, field: ${fieldName}`);
        }
      } catch (dbError) {
        logger.error(`Database error for domain ${domain}:`, dbError);
        // Continue with file upload even if database update fails
      }
    }

    return NextResponse.json(fileInfo);
  } catch (error) {
    logger.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
} 