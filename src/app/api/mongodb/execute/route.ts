import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await request.json();
    const { collection, operation, query, explain } = body;

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Log the query for debugging purposes
    logger.info(`MongoDB Query: ${operation} on ${collection}`);
    logger.debug("Query details:", { 
      operation, 
      collection,
      query: JSON.stringify(query),
      domain,
      explain: explain || "none"
    });

    // Validate required fields
    if (!collection) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    if (!operation) {
      return NextResponse.json(
        { error: "Operation type is required (find or aggregate)" },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    if (operation !== "find" && operation !== "aggregate") {
      return NextResponse.json(
        { error: "Operation must be 'find' or 'aggregate'" },
        { status: 400 }
      );
    }

    try {
      // Connect to the database
      const connection = await connectToDatabase(domain);
      
      if (!connection.db) {
        throw new Error("Database connection failed");
      }

      // Get the collection
      const coll = connection.db.collection(collection);
      let results = [];
      let explainResult = null;

      // Execute the query
      if (operation === "find") {
        // For find operations
        const cursor = coll.find(query);
        
        // Apply limit to prevent excessive data retrieval
        const limitedCursor = cursor.limit(100);
        
        // If explain option is provided
        if (explain) {
          explainResult = await limitedCursor.explain(explain);
          logger.debug("Explain result available");
        }
        
        // Convert cursor to array
        results = await limitedCursor.toArray();
      } else {
        // For aggregate operations
        let aggregateQuery = Array.isArray(query) ? query : [query];
        
        // Apply limit to prevent excessive data retrieval if not already present
        let hasLimit = false;
        
        for (const stage of aggregateQuery) {
          if (stage.$limit !== undefined) {
            hasLimit = true;
            break;
          }
        }
        
        if (!hasLimit) {
          // Add a $limit stage at the end to prevent excessive results
          aggregateQuery = [...aggregateQuery, { $limit: 100 }];
        }
        
        // Create the aggregation pipeline
        const pipeline = coll.aggregate(aggregateQuery);
        
        // If explain option is provided
        if (explain) {
          explainResult = await pipeline.explain(explain);
          logger.debug("Explain result available");
        }
        
        // Execute the aggregation
        results = await pipeline.toArray();
      }

      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      // Log execution stats
      logger.info(`Query executed in ${executionTime}ms. Results count: ${results.length}`);

      // Return the results
      return NextResponse.json({
        success: true,
        results,
        count: results.length,
        executionTime,
        explain: explainResult,
      });
    } catch (dbError) {
      logger.error(`Database error:`, dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError instanceof Error ? dbError.message : String(dbError)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error in MongoDB execute API:", error);
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 