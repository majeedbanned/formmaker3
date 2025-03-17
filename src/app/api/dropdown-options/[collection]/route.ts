import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getDynamicModel } from "@/lib/mongodb";
import { Document, Model } from "mongoose";

// Set runtime to nodejs
export const runtime = 'nodejs';

interface MongoDocument extends Document {
  data: Map<string, unknown>;
  _id: string;
}

interface QueryFilter {
  [key: string]: unknown;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const connectionString = searchParams.get("connectionString");
    const labelField = searchParams.get("labelField") || "_id";
    const valueField = searchParams.get("valueField") || "_id";
    const filterQuery = searchParams.get("filterQuery");
    const sortField = searchParams.get("sortField");
    const sortOrder = searchParams.get("sortOrder");
    const limit = searchParams.get("limit");
    const customLabel = searchParams.get("customLabel");

    if (!connectionString) {
      return NextResponse.json(
        { error: "Connection string is required" },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase(connectionString);
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { error: "Failed to connect to database", details: dbError instanceof Error ? dbError.message : String(dbError) },
        { status: 500 }
      );
    }

    // Wait for collection parameter
    const collection = await Promise.resolve(params.collection);
    console.log("Fetching options from collection:", collection);

    let model: Model<MongoDocument>;
    try {
      model = getDynamicModel(collection) as Model<MongoDocument>;
      console.log("Model schema:", model.schema.paths);
    } catch (modelError) {
      console.error("Failed to get model for collection:", collection, modelError);
      return NextResponse.json(
        { error: "Failed to get database model", details: modelError instanceof Error ? modelError.message : String(modelError) },
        { status: 500 }
      );
    }

    // Convert the filterQuery to work with the data Map structure
    let query: QueryFilter = {};
    if (filterQuery) {
      try {
        const parsedFilter = JSON.parse(filterQuery) as Record<string, unknown>;
        query = Object.entries(parsedFilter).reduce((acc, [key, value]) => {
          acc[`data.${key}`] = value;
          return acc;
        }, {} as QueryFilter);
        console.log("Applied filter query:", query);
      } catch (filterError) {
        console.error("Failed to parse filter query:", filterError);
        return NextResponse.json(
          { error: "Invalid filter query format", details: filterError instanceof Error ? filterError.message : String(filterError) },
          { status: 400 }
        );
      }
    }

    // Build the sort object to work with the data Map
    const sort: Record<string, 1 | -1> = {};
    if (sortField) {
      sort[`data.${sortField}`] = sortOrder === "desc" ? -1 : 1;
      console.log("Applied sort:", sort);
    }

    // Build the projection to include only needed fields
    const projection: Record<string, 1> = { _id: 1 };
    const fields = new Set<string>();
    
    // Add label field(s)
    if (customLabel) {
      const matches = customLabel.match(/\{([^}]+)\}/g) || [];
      matches.forEach(match => {
        const field = match.slice(1, -1);
        fields.add(field);
      });
    } else {
      fields.add(labelField);
    }
    
    // Add value field
    fields.add(valueField);
    
    // Set projection for data fields
    fields.forEach(field => {
      if (field !== '_id') {
        projection[`data.${field}`] = 1;
      }
    });
    console.log("Applied projection:", projection);

    // Parse limit as number or undefined
    const limitNum = limit ? parseInt(limit) : undefined;
    console.log("Applied limit:", limitNum);

    // Fetch data from MongoDB
    let documents;
    try {
      documents = await model
         .find(query)
        .select(projection)
        .sort(sort)
        .limit(limitNum || 0)
        //.lean();
      console.log("Found documents count:", documents.length);
      console.log("Sample document:", documents[0]);
    } catch (queryError) {
      console.error("Database query failed:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch data from database", details: queryError instanceof Error ? queryError.message : String(queryError) },
        { status: 500 }
      );
    }

    // Transform documents into options
    let options;
    try {
      options = documents.map((doc) => {
        let label: string;
        
        const getValue = (fieldPath: string): string => {
          if (fieldPath === '_id') return String(doc._id);
          // Handle the case where data might be undefined or not a Map
          if (!doc.data) {
            console.warn("Document missing data field:", doc._id);
            return '';
          }
          if (!(doc.data instanceof Map)) {
            console.warn("Document data is not a Map:", doc._id, typeof doc.data);
            return '';
          }
          // Now TypeScript knows doc.data is a Map
          const value = doc.data.get(fieldPath);
          if (value === undefined) {
            console.warn(`Field "${fieldPath}" not found in document:`, doc._id);
          }
          return value !== undefined ? String(value) : '';
        };
        
        if (customLabel) {
          label = customLabel.replace(/\{([^}]+)\}/g, (_, field) => {
            return getValue(field);
          });
        } else {
          label = getValue(labelField);
        }

        const value = getValue(valueField);
        return { label, value };
      });
      console.log("Transformed options count:", options.length);
      console.log("Sample option:", options[0]);
    } catch (transformError) {
      console.error("Failed to transform documents to options:", transformError);
      return NextResponse.json(
        { error: "Failed to process database results", details: transformError instanceof Error ? transformError.message : String(transformError) },
        { status: 500 }
      );
    }

    return NextResponse.json(options);
  } catch (error) {
    console.error("Unexpected error in dropdown options route:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch dropdown options",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 