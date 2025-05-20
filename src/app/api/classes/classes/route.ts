import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// GET - Fetch all classes for the current user's school
export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching classes for domain: ${domain}, schoolCode: ${user.schoolCode}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the classes collection directly from the connection
      const classesCollection = connection.collection("classes");

      // Query for classes in the user's school
      const query = { "data.schoolCode": user.schoolCode };
      
      // Fetch classes from the database
      const classes = await classesCollection.find(query).toArray();

      logger.info(`Found ${classes.length} classes for school ${user.schoolCode}`);
      
      // Transform the data to match the expected format in the frontend
      const transformedClasses = classes.map(cls => {
        const classData = cls.data || cls;
        return {
          _id: cls._id,
          classCode: classData.classCode,
          className: classData.className,
          data: classData
        };
      });

      // Return the classes data
      return NextResponse.json(transformedClasses || []);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing classes request:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
} 