import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

// Set runtime to nodejs
export const runtime = 'nodejs';

interface QueryFilter {
  [key: string]: unknown;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching dropdown options from collection ${params.collection}`, { domain });

    const searchParams = request.nextUrl.searchParams;
    const labelField = searchParams.get("labelField") || "_id";
    const labelField2 = searchParams.get("labelField2") || null;
    const labelField3 = searchParams.get("labelField3") || null;
    const valueField = searchParams.get("valueField") || "_id";
    const filterQuery = searchParams.get("filterQuery");
    const sortField = searchParams.get("sortField");
    const sortOrder = searchParams.get("sortOrder");
    const limit = searchParams.get("limit");
    const customLabel = searchParams.get("customLabel");
    const searchQuery = searchParams.get("query");
    
    // For backward compatibility, use connectionString if provided
    const connectionString = searchParams.get("connectionString");
    const connectionDomain = connectionString ? connectionString : domain;

    try {
      // Connect to domain-specific database
      const db = await connectToDatabase(connectionDomain);
      
      // Get the collection directly instead of using a model
      const collection = db.collection(params.collection);
      logger.info(`Connected to collection ${params.collection}`, { domain: connectionDomain });

      // Convert the filterQuery to work with the data Map structure
      let query: QueryFilter = {};
      if (filterQuery) {
        try {
          const parsedFilter = JSON.parse(filterQuery) as Record<string, unknown>;
          query = Object.entries(parsedFilter).reduce((acc, [key, value]) => {
            acc[`data.${key}`] = value;
            return acc;
          }, {} as QueryFilter);
          logger.debug("Applied filter query", { query, domain: connectionDomain });
        } catch (filterError) {
          logger.error("Failed to parse filter query", { error: filterError, domain: connectionDomain });
          return NextResponse.json(
            { error: "Invalid filter query format", details: filterError instanceof Error ? filterError.message : String(filterError) },
            { status: 400 }
          );
        }
      }

      // Add text search condition if query parameter is provided
      if (searchQuery && searchQuery.trim() !== '') {
        // Create a case-insensitive regex search pattern
        const searchRegex = new RegExp(searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
        
        // Search across all provided label fields
        const searchConditions = [];
        
        // Always search in the primary label field
        searchConditions.push({ [`data.${labelField}`]: searchRegex });
        
        // Add secondary label field to search if provided
        if (labelField2) {
          searchConditions.push({ [`data.${labelField2}`]: searchRegex });
        }
        
        // Add third label field to search if provided
        if (labelField3) {
          searchConditions.push({ [`data.${labelField3}`]: searchRegex });
        }
        
        // Use $or operator to match any of the conditions
        if (searchConditions.length > 1) {
          query.$or = searchConditions;
        } else {
          // If only one field, use simple condition
          query[`data.${labelField}`] = searchRegex;
        }
        
        logger.debug(`Added text search for "${searchQuery}" across label fields`, { 
          searchFields: [labelField, labelField2, labelField3].filter(Boolean),
          domain: connectionDomain 
        });
      }

      // Build the sort object to work with the data Map
      const sort: Record<string, 1 | -1> = {};
      if (sortField) {
        sort[`data.${sortField}`] = sortOrder === "desc" ? -1 : 1;
        logger.debug("Applied sort", { sort, domain: connectionDomain });
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
        if (labelField2) fields.add(labelField2);
        if (labelField3) fields.add(labelField3);
      }
      
      // Add value field
      fields.add(valueField);
      
      // Set projection for data fields
      fields.forEach(field => {
        if (field !== '_id') {
          projection[`data.${field}`] = 1;
        }
      });
      logger.debug("Applied projection", { projection, domain: connectionDomain });

      // Parse limit as number or undefined
      const limitNum = limit ? parseInt(limit) : undefined;
      logger.debug("Applied limit", { limit: limitNum, domain: connectionDomain });

      // Fetch data from MongoDB
      let documents;
      try {
        documents = await collection
          .find(query)
          .project(projection)
          .sort(sort)
          .limit(limitNum || 100) // Default limit to 100 if not specified
          .toArray();
        
        logger.info(`Found ${documents.length} documents in ${params.collection}`, { domain: connectionDomain });
      } catch (queryError) {
        logger.error("Database query failed", { error: queryError, domain: connectionDomain });
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
            
            // Handle nested data structure
            const data = doc.data;
            if (!data) {
              logger.warn("Document missing data field", { id: doc._id, domain: connectionDomain });
              return '';
            }
            
            // Handle different data types (Map or Object)
            let value;
            if (data instanceof Map) {
              value = data.get(fieldPath);
            } else if (typeof data === 'object') {
              value = data[fieldPath];
            }
            
            if (value === undefined) {
              logger.warn(`Field "${fieldPath}" not found in document`, { id: doc._id, domain: connectionDomain });
            }
            
            return value !== undefined ? String(value) : '';
          };
          
          if (customLabel) {
            label = customLabel.replace(/\{([^}]+)\}/g, (_, field) => {
              return getValue(field);
            });
          } else {
            // Get the primary label value
            label = getValue(labelField);
            
            // Append secondary label if provided
            if (labelField2) {
              const label2Value = getValue(labelField2);
              if (label2Value) {
                label = `${label} - ${label2Value}`;
              }
            }
            
            // Append third label if provided
            if (labelField3) {
              const label3Value = getValue(labelField3);
              if (label3Value) {
                label = `${label} - ${label3Value}`;
              }
            }
          }

          const value = getValue(valueField);
          return { label, value };
        });
        
        logger.info(`Transformed ${options.length} options from ${params.collection}`, { domain: connectionDomain });
      } catch (transformError) {
        logger.error("Failed to transform documents to options", { error: transformError, domain: connectionDomain });
        return NextResponse.json(
          { error: "Failed to process database results", details: transformError instanceof Error ? transformError.message : String(transformError) },
          { status: 500 }
        );
      }

      return NextResponse.json(options);
    } catch (dbError) {
      logger.error("Database connection or query error", { error: dbError, domain: connectionDomain });
      return NextResponse.json(
        { error: "Failed to connect to database", details: dbError instanceof Error ? dbError.message : String(dbError) },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Unexpected error in dropdown options route", { error });
    return NextResponse.json(
      { 
        error: "Failed to fetch dropdown options",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 