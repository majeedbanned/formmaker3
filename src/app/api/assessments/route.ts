import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

// GET - Retrieve all assessment options for a given school and teacher
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const schoolCode = url.searchParams.get("schoolCode");
    const teacherCode = url.searchParams.get("teacherCode");

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching assessment options for domain: ${domain}, schoolCode: ${schoolCode}`);

    if (!schoolCode) {
      return NextResponse.json(
        { error: "School code is required" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the assessments collection directly from the connection
      const assessmentsCollection = connection.collection("assessments");

      // Find assessment options based on the query parameters
      const query: { schoolCode: string; teacherCode?: string } = { schoolCode };
      if (teacherCode) {
        query.teacherCode = teacherCode;
      }

      const assessmentOptions = await assessmentsCollection.find(query).toArray();
      
      logger.info(`Found ${assessmentOptions.length} assessment options for query parameters`);
      
      return NextResponse.json({
        success: true,
        data: assessmentOptions
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing assessment options request:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment options" },
      { status: 500 }
    );
  }
}

// POST - Add a new assessment option
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolCode, teacherCode, type, value, weight = 0, isGlobal = false } = body;
    
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Creating assessment option for domain: ${domain}, schoolCode: ${schoolCode}`);
    
    // Validate required fields
    if (!schoolCode || !type || !value) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isGlobal && !teacherCode) {
      return NextResponse.json(
        { error: "Teacher code is required for non-global assessments" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the assessments collection directly from the connection
      const assessmentsCollection = connection.collection("assessments");
      
      // Check if the exact same assessment option already exists
      const existingOption = await assessmentsCollection.findOne({
        schoolCode,
        ...(teacherCode ? { teacherCode } : {}),
        type,
        value
      });

      if (existingOption) {
        logger.warn(`Assessment option already exists: ${type}, ${value}`);
        return NextResponse.json(
          { error: "This assessment option already exists" },
          { status: 409 }
        );
      }
      
      // Insert the new assessment option
      // Include weight only for value type assessments
      const assessmentData = {
        schoolCode,
        ...(teacherCode ? { teacherCode } : {}),
        type, // 'title' or 'value'
        value,
        ...(type === 'value' ? { weight: Number(weight) } : {}), // Store weight only for values
        isGlobal,
        createdAt: new Date()
      };
      
      const result = await assessmentsCollection.insertOne(assessmentData);

      if (!result.acknowledged) {
        throw new Error("Failed to insert assessment option");
      }

      logger.info(`Created new assessment option with ID: ${result.insertedId}`);
      
      return NextResponse.json({
        success: true,
        message: "Assessment option added successfully",
        id: result.insertedId
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error creating assessment option:", error);
    return NextResponse.json(
      { error: "Failed to add assessment option" },
      { status: 500 }
    );
  }
} 