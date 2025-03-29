import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const formId = searchParams.get("formId");
    const schoolCode = searchParams.get("schoolCode");

    // Validate required parameters
    if (!formId) {
      return NextResponse.json(
        { error: "Required parameter missing: formId is required" },
        { status: 400 }
      );
    }

    // Get connection string from environment variable
    const connectionString = process.env.NEXT_PUBLIC_MONGODB_URI;
    if (!connectionString) {
      return NextResponse.json(
        { error: "Database connection string is not configured" },
        { status: 500 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase(connectionString);

    try {
      // Build query object
      const filter: Record<string, string> = { formId };

      // Add schoolCode to query if provided
      if (schoolCode) {
        filter.schoolCode = schoolCode;
      }

      // Find all form inputs for this form
      const inputs = await mongoose.connection
        .collection("formsInput")
        .find(filter)
        .sort({ createdAt: -1 }) // Newest first
        .toArray();

      // Return the results
      return NextResponse.json({
        success: true,
        inputs,
      });
    } catch (dbError) {
      console.error("Database query error:", dbError);
      return NextResponse.json(
        { error: "Error querying the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching form inputs:", error);
    return NextResponse.json(
      { error: "Failed to fetch form inputs" },
      { status: 500 }
    );
  }
} 