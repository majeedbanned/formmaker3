import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import { logger } from "@/lib/logger";

interface Field {
  name: string;
  type: string;
  description: string;
}

interface CollectionSchema {
  name: string;
  fields: Field[];
}

export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Connect to the database
    const connection = await connectToDatabase(domain);
    
    // Check if connection.db exists
    if (!connection.db) {
      throw new Error("Database connection failed");
    }
    
    // Get all collection names
    const collections = await connection.db.listCollections().toArray();
    
    // Initialize schema array
    const schema: CollectionSchema[] = [];
    
    // Get sample document from each collection to infer schema
    for (const collection of collections) {
      try {
        const collectionName = collection.name;
        
        // Skip system collections
        if (collectionName.startsWith("system.")) {
          continue;
        }
        
        // Get a sample document from the collection
        const sampleDocument = await connection.db
          .collection(collectionName)
          .findOne({}, { projection: { _id: 0 } });
        
        if (sampleDocument) {
          // Extract fields information
          const fields: Field[] = [];
          
          // Process fields from the sample document
          for (const [key, value] of Object.entries(sampleDocument)) {
            // Determine field type
            let fieldType: string = typeof value;
            
            // Handle special cases
            if (value instanceof Date) {
              fieldType = "Date";
            } else if (Array.isArray(value)) {
              fieldType = "Array";
            } else if (value === null) {
              fieldType = "null";
            } else if (mongoose.Types.ObjectId.isValid(String(value))) {
              fieldType = "ObjectId";
            } else if (typeof value === "object") {
              fieldType = "Object";
            }
            
            // Add field to schema
            fields.push({
              name: key,
              type: fieldType,
              description: `Field from collection ${collectionName}`,
            });
          }
          
          // Add collection to schema
          schema.push({
            name: collectionName,
            fields,
          });
        }
      } catch (err) {
        // Log error but continue with other collections
        logger.error(`Error processing collection ${collection.name}:`, err);
      }
    }
    

    console.log('schema', schema);
    return NextResponse.json(
      { 
        success: true, 
        schema,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error fetching database schema:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch database schema",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
} 