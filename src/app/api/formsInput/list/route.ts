import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const formId = searchParams.get("formId");
    const schoolCode = searchParams.get("schoolCode");

    // Get domain from request headers
    const domain = req.headers.get("x-domain") || "localhost:3000";

    // Validate required parameters
    if (!formId) {
      logger.warn(`Missing required parameter 'formId' for form inputs list on domain: ${domain}`);
      return NextResponse.json(
        { error: "Required parameter missing: formId is required" },
        { status: 400 }
      );
    }

    logger.info(`Fetching form inputs list for domain: ${domain}, formId: ${formId}, schoolCode: ${schoolCode || 'all'}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the formsInput collection directly from the connection
      const formsInputCollection = connection.collection("formsInput");

      // Build query object
      const filter: Record<string, string> = { formId };

      // Add schoolCode to query if provided
      if (schoolCode) {
        filter.schoolCode = schoolCode;
      }

      // Find all form inputs for this form
      const inputs = await formsInputCollection
        .find(filter)
        .sort({ createdAt: -1 }) // Newest first
        .toArray();

      logger.info(`Found ${inputs.length} form inputs for formId: ${formId}, domain: ${domain}`);
      
      // Return the results
      return NextResponse.json({
        success: true,
        inputs,
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error querying the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error fetching form inputs:", error);
    return NextResponse.json(
      { error: "Failed to fetch form inputs" },
      { status: 500 }
    );
  }
} 