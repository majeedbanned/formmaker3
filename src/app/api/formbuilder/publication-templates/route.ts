import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

// GET endpoint to fetch templates for a school
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get("schoolCode");

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
    
    const templates = await connection
      .collection("publication-templates")
      .find({ schoolCode })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new template
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, description, originalTitle, schoolCode, printOptions } = body;

    if (!title || !content || !schoolCode) {
      return NextResponse.json(
        { error: "Title, content, and schoolCode are required" },
        { status: 400 }
      );
    }

    // Additional authorization check
    if (user.schoolCode !== schoolCode && user.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized to create templates for this school" },
        { status: 403 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    const result = await connection.collection("publication-templates").insertOne({
      title,
      content,
      description: description || "",
      originalTitle: originalTitle || title,
      schoolCode,
      creatorId: user.id,
      creatorType: user.userType,
      printOptions: printOptions,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      templateId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
} 