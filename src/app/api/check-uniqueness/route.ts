import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { FormField } from "@/types/crud";
import mongoose from "mongoose";
import { logger } from "@/lib/logger";

// Define a type for MongoDB queries
interface MongoQuery {
  [key: string]: unknown;
  _id?: { $ne: mongoose.Types.ObjectId };
}

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Checking uniqueness constraints for a document`, { domain });

    const { collectionName, data, editingId, formStructure } = await request.json() as {
      collectionName: string;
      data: Record<string, unknown>;
      editingId?: string;
      formStructure: FormField[];
    };

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection(collectionName);
    
    const duplicateFields: Record<string, string> = {};

    // Check for group uniqueness constraints
    const groupUniqueFields = formStructure
      .filter(f => f.groupUniqueness)
      .map(f => f.name);

    if (groupUniqueFields.length > 0) {
      // Create a query that includes all group unique fields that have values
      const groupQuery: MongoQuery = {};
      let hasGroupValues = false;

      // Exclude the current document if editingId is provided
      if (editingId) {
        groupQuery._id = { $ne: new mongoose.Types.ObjectId(editingId) };
      }

      // Add all fields with groupUniqueness to the query
      groupUniqueFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          groupQuery[`data.${field}`] = data[field];
          hasGroupValues = true;
        }
      });

      // Only perform the check if we have at least one field with a value
      if (hasGroupValues) {
        const existingDoc = await collection.findOne(groupQuery);
        
        if (existingDoc) {
          // If we found a duplicate, add error messages for each field
          const fields = groupUniqueFields.filter(field => 
            data[field] !== undefined && data[field] !== null
          );
          
          fields.forEach(field => {
            const formField = formStructure.find(f => f.name === field);
            if (formField?.validation?.groupUniqueMessage) {
              duplicateFields[field] = formField.validation.groupUniqueMessage;
            } else {
              duplicateFields[field] = "This combination of fields already exists";
            }
          });
        }
      }
    }

    // If we found any duplicates, return them as errors
    if (Object.keys(duplicateFields).length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          duplicateFields
        },
        { status: 400 }
      );
    }
    
    // If no duplicates found, return success
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Uniqueness check error:', err);
    return NextResponse.json(
      { error: 'Failed to check uniqueness' },
      { status: 500 }
    );
  }
} 