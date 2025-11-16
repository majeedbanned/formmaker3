import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { getPersianDate } from "@/utils/dateUtils";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Parse form data for file uploads or JSON
    let message;
    const files: string[] = [];

    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // Handle form data with files
      const formData = await request.formData();
      message = JSON.parse(formData.get("message") as string);
      
      // Get the schoolCode for file path
      const schoolCode = user.schoolCode;
      
      // Ensure the directory exists
      const dirPath = path.join(process.cwd(), 'public', schoolCode, 'messages');
      fs.mkdirSync(dirPath, { recursive: true });
      
      // Process any attached files
      const fileEntries = Array.from(formData.entries())
        .filter(([key]) => key.startsWith("file"));
      
      // Save files and collect their paths
      for (const [, fileData] of fileEntries) {
        // Check if it's a file-like object with the required properties
        if (fileData && typeof fileData === 'object' && 'name' in fileData && 'arrayBuffer' in fileData && typeof fileData.arrayBuffer === 'function') {
          try {
            // Generate unique ID for the file name
            const uuid = uuidv4();
            const fileName = `${uuid}-${fileData.name}`;
            const filePath = path.join(dirPath, fileName);
            
            // Convert file to ArrayBuffer
            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Write file to disk
            fs.writeFileSync(filePath, buffer);
            
            // Add the public URL path to the files array
            const publicPath = `/${schoolCode}/messages/${fileName}`;
            files.push(publicPath);
            
            // console.log(`File saved successfully: ${fileName}`);
          } catch (fileError) {
            console.error("Error saving file:", fileError);
          }
        } else {
          // console.log("Invalid file data received:", typeof fileData);
        }
      }
    } else {
      // Handle regular JSON request
      const body = await request.json();
      message = body.message;
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message data is required" },
        { status: 400 }
      );
    }

    if (!message.receivercode) {
      return NextResponse.json(
        { error: "Receiver code is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get messagelist collection
    const messageListCollection = connection.collection("messagelist");
    
    // Prepare the reply message
    const now = new Date();
    const persianDate = getPersianDate();
    
    // If files were uploaded, add them to the message
    if (files.length > 0) {
      message.files = files;
    }
    
    // Create the document to insert
    const replyDocument = {
      data: new Map(Object.entries({
        ...message,
        sendername: user.name, // Using username as sendername since name might not exist
        sendercode: user.username,
        persiandate: persianDate,
        createdAt: now,
        isRead: false
      }))
    };
    
    // Insert the reply message
    const result = await messageListCollection.insertOne(replyDocument);
    
    if (!result.acknowledged) {
      throw new Error("Failed to insert reply message");
    }
    
    // Also mark the original message as read if it's not already
    if (message.originalMessageId) {
      await messageListCollection.updateOne(
        { 
          _id: new ObjectId(message.originalMessageId), 
          "data.receivercode": user.username,
          "data.isRead": { $ne: true }
        },
        { 
          $set: { 
            "data.isRead": true,
            "data.readTime": now.toISOString(),
            "data.readPersianDate": persianDate
          } 
        }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      messageId: result.insertedId,
      message: "Reply sent successfully",
      files: files
    });
    
  } catch (error) {
    console.error("Error sending reply:", error);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
} 