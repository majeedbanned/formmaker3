import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

// GET endpoint to fetch publication history for a school
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get("schoolCode");
    const creatorId = searchParams.get("creatorId");

    if (!schoolCode) {
      return NextResponse.json(
        { error: "School code is required" },
        { status: 400 }
      );
    }

    // Additional authorization check
    if (user.schoolCode !== schoolCode && user.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized to access this school's data" },
        { status: 403 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Build query based on parameters
    const query: Record<string, string> = { schoolCode };
    
    // If creatorId is provided, add it to the query
    if (creatorId) {
      query.creatorId = creatorId;
      
      // If not admin/school and trying to view someone else's history, restrict access
      if (creatorId !== user.id && user.userType !== "admin" && user.userType !== "school") {
        return NextResponse.json(
          { error: "Unauthorized to view this creator's history" },
          { status: 403 }
        );
      }
    }
    
    const history = await connection
      .collection("publication-history")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching publication history:", error);
    return NextResponse.json(
      { error: "Failed to fetch publication history" },
      { status: 500 }
    );
  }
}

// POST endpoint to add a new history record
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, studentCount, classCount, schoolCode } = body;

    if (!title || !schoolCode) {
      return NextResponse.json(
        { error: "Title and schoolCode are required" },
        { status: 400 }
      );
    }

    // Additional authorization check
    if (user.schoolCode !== schoolCode && user.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized to create records for this school" },
        { status: 403 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    const result = await connection.collection("publication-history").insertOne({
      title,
      studentCount: studentCount || 0,
      classCount: classCount || 0,
      schoolCode,
      creatorId: user.id,
      creatorType: user.userType,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      historyId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating publication history:", error);
    return NextResponse.json(
      { error: "Failed to create publication history" },
      { status: 500 }
    );
  }
} 