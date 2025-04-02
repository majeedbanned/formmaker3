import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { ObjectId } from "mongodb";

// DELETE - Remove an assessment option
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Deleting assessment option with ID: ${id} for domain: ${domain}`);
    
    if (!id) {
      return NextResponse.json(
        { error: "Assessment ID is required" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the assessments collection directly from the connection
      const assessmentsCollection = connection.collection("assessments");
      
      // Delete the assessment option
      const result = await assessmentsCollection.deleteOne({
        _id: new ObjectId(id)
      });
      
      if (result.deletedCount === 0) {
        logger.warn(`Assessment option not found with ID: ${id}`);
        return NextResponse.json(
          { error: "Assessment option not found" },
          { status: 404 }
        );
      }
      
      logger.info(`Successfully deleted assessment option with ID: ${id}`);
      return NextResponse.json({
        success: true,
        message: "Assessment option deleted successfully"
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error deleting assessment option:", error);
    return NextResponse.json(
      { error: "Failed to delete assessment option" },
      { status: 500 }
    );
  }
} 