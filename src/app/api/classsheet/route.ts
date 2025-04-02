import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classCode, teacherCode, courseCode, schoolCode } = body;

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching classsheet data for domain: ${domain}, schoolCode: ${schoolCode}`);

    if (!classCode || !teacherCode || !courseCode || !schoolCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the classsheet collection directly from the connection
      const classheetCollection = connection.collection("classsheet");

      // Find all cell data for this class, teacher, and course
      const cellData = await classheetCollection
        .find({
          classCode,
          teacherCode,
          courseCode,
          schoolCode,
        })
        .toArray();

      logger.info(`Found ${cellData.length} classsheet entries for query parameters`);
      
      // Log a sample of unique date formats for debugging
      if (cellData.length > 0 && process.env.NODE_ENV === "development") {
        const uniqueDates = new Set(cellData.map(cell => cell.date));
        logger.debug("Sample of date formats in database:", Array.from(uniqueDates).slice(0, 5));
        
        // Check for potential duplicate cells with different date formats
        const cellIdentifiers = cellData.map(cell => {
          // Create a simplified identifier without the time component
          const simpleDate = new Date(cell.date).toISOString().split('T')[0];
          return `${cell.classCode}_${cell.studentCode}_${simpleDate}_${cell.timeSlot}`;
        });
        
        // Count occurrences of each identifier
        const counts: Record<string, number> = {};
        cellIdentifiers.forEach(id => {
          counts[id] = (counts[id] || 0) + 1;
        });
        
        // Find duplicates
        const duplicates = Object.entries(counts)
          .filter(entry => entry[1] > 1)
          .map(entry => entry[0]);
        
        if (duplicates.length > 0) {
          logger.warn("Potential duplicate cells detected:", duplicates.length);
          logger.debug("First few duplicates:", duplicates.slice(0, 3));
        }
      }
      
      return NextResponse.json(cellData);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing classsheet request:", error);
    return NextResponse.json(
      { error: "Failed to fetch classsheet data" },
      { status: 500 }
    );
  }
} 