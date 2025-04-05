import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

interface MongoQuery {
  collection: string;
  operation: "find" | "aggregate";
  query: Record<string, unknown> | Array<Record<string, unknown>>;
}

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Get request body
    const body = await request.json();
    let { mongoQuery } = body;
    
    // Parse the query if it's a string
    if (typeof mongoQuery === "string") {
      try {
        mongoQuery = JSON.parse(mongoQuery);
      } catch (parseError) {
        logger.error("Error parsing MongoDB query:", parseError);
        return NextResponse.json(
          { success: false, message: "Invalid MongoDB query format" },
          { status: 400 }
        );
      }
    }
    
    // Validate the MongoDB query
    const { collection, operation, query } = mongoQuery as MongoQuery;
    
    if (!collection || !operation || !query) {
      return NextResponse.json(
        { success: false, message: "Invalid MongoDB query structure" },
        { status: 400 }
      );
    }
    
    if (operation !== "find" && operation !== "aggregate") {
      return NextResponse.json(
        { success: false, message: "Operation must be 'find' or 'aggregate'" },
        { status: 400 }
      );
    }
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    if (!connection.db) {
      throw new Error("Database connection failed");
    }
    
    // Get the collection
    const coll = connection.db.collection(collection);
    
    // Store debug info
    const debug = {
      executedQuery: "",
      mongoCommand: "",
      executionTime: 0,
      collection,
      operation
    };
    
    // Execute the query
    let results = [];
    const startTime = Date.now();
    
    if (operation === "find") {
      // For find operations
      const findQuery = query as Record<string, unknown>;
      const cursor = coll.find(findQuery);
      
      // Format the executed query for debugging
      debug.mongoCommand = `db.${collection}.find(${JSON.stringify(findQuery, null, 2)})`;
      debug.executedQuery = `db.getCollection('${collection}').find(${JSON.stringify(findQuery)})`;
      
      // Apply limit to prevent excessive data retrieval
      const limitedCursor = cursor.limit(100);
      
      // Convert cursor to array
      results = await limitedCursor.toArray();
    } else {
      // For aggregate operations
      const aggregateQuery = query as Array<Record<string, unknown>>;
      
      // Apply limit to prevent excessive data retrieval if not already present
      let hasLimit = false;
      let queryToExecute = [...aggregateQuery];
      
      for (const stage of aggregateQuery) {
        if (stage.$limit !== undefined) {
          hasLimit = true;
          break;
        }
      }
      
      if (!hasLimit) {
        // Add a $limit stage at the end
        queryToExecute = [...aggregateQuery, { $limit: 100 }];
      }
      
      // Format the executed query for debugging
      debug.mongoCommand = `db.${collection}.aggregate(${JSON.stringify(queryToExecute, null, 2)})`;
      debug.executedQuery = `db.getCollection('${collection}').aggregate(${JSON.stringify(queryToExecute)})`;
      
      // Execute the aggregation
      const cursor = coll.aggregate(queryToExecute);
      results = await cursor.toArray();
    }
    
    // Calculate execution time
    debug.executionTime = Date.now() - startTime;
    
    // Log the executed query for debugging
    logger.info(`Executed MongoDB query: ${debug.mongoCommand}`);
    logger.info(`Query execution time: ${debug.executionTime}ms`);
    logger.info(`Results count: ${results.length}`);
    
    // Return results with debug info
    return NextResponse.json(
      { 
        success: true, 
        results,
        count: results.length,
        debug
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error executing MongoDB query:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to execute MongoDB query",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
} 