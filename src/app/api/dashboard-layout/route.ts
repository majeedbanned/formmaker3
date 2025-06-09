import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { ObjectId } from "mongodb";

// GET - Retrieve user's dashboard layout
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching dashboard layout for domain: ${domain}, user: ${user.id}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the dashboard layouts collection directly from the connection
      const dashboardLayoutsCollection = connection.collection("dashboard_layouts");

      // Find user's layout
      const layout = await dashboardLayoutsCollection.findOne({ 
        userId: user.id,
        schoolCode: user.schoolCode 
      });

      if (!layout) {
        // Return default layout if none exists
        const defaultLayout = [
          {
            id: 'survey-widget',
            widgetType: 'SurveyWidget',
            position: { row: 0, col: 0, width: 2, height: 1 },
            config: {}
          },
          {
            id: 'birthdate-widget',
            widgetType: 'BirthdateWidget',
            position: { row: 0, col: 2, width: 1, height: 1 },
            config: {}
          }
        ];

        logger.info(`Returning default layout for user: ${user.id}`);
        return NextResponse.json({ layout: defaultLayout });
      }

      logger.info(`Found saved layout for user: ${user.id}`);
      return NextResponse.json({ layout: layout.layout });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error fetching dashboard layout:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard layout" },
      { status: 500 }
    );
  }
}

// POST - Save user's dashboard layout
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { layout } = await request.json();
    
    if (!layout || !Array.isArray(layout)) {
      return NextResponse.json({ error: "Invalid layout data" }, { status: 400 });
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Saving dashboard layout for domain: ${domain}, user: ${user.id}`);

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the dashboard layouts collection directly from the connection
      const dashboardLayoutsCollection = connection.collection("dashboard_layouts");

      // Create/update layout document
      const layoutDocument = {
        userId: user.id,
        schoolCode: user.schoolCode,
        layout,
        updatedAt: new Date(),
      };

      // Use upsert to create or update
      const result = await dashboardLayoutsCollection.findOneAndUpdate(
        { userId: user.id, schoolCode: user.schoolCode },
        { 
          $set: layoutDocument,
          $setOnInsert: { 
            _id: new ObjectId(),
            createdAt: new Date() 
          }
        },
        { 
          upsert: true, 
          returnDocument: 'after'
        }
      );

      logger.info(`Saved layout for user: ${user.id}`);
      return NextResponse.json({ 
        success: true, 
        layout: result?.layout || layout 
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error saving dashboard layout:", error);
    return NextResponse.json(
      { error: "Failed to save dashboard layout" },
      { status: 500 }
    );
  }
} 