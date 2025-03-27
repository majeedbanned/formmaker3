import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// GET - Retrieve all assessment options for a given school and teacher
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const schoolCode = url.searchParams.get("schoolCode");
    const teacherCode = url.searchParams.get("teacherCode");

    if (!schoolCode) {
      return NextResponse.json(
        { error: "School code is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI || "");
    await client.connect();
    
    const db = client.db();
    const collection = db.collection("assessments");

    // Find assessment options based on the query parameters
    const query: { schoolCode: string; teacherCode?: string } = { schoolCode };
    if (teacherCode) {
      query.teacherCode = teacherCode;
    }

    const assessmentOptions = await collection.find(query).toArray();
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      data: assessmentOptions
    });
  } catch (error) {
    console.error("Error fetching assessment options:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment options" },
      { status: 500 }
    );
  }
}

// POST - Add a new assessment option
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schoolCode, teacherCode, type, value, weight = 0, isGlobal = false } = body;
    
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

    // Connect to MongoDB
    const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI || "");
    await client.connect();
    
    const db = client.db();
    const collection = db.collection("assessments");
    
    // Check if the exact same assessment option already exists
    const existingOption = await collection.findOne({
      schoolCode,
      ...(teacherCode ? { teacherCode } : {}),
      type,
      value
    });

    if (existingOption) {
      await client.close();
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
    
    const result = await collection.insertOne(assessmentData);

    await client.close();
    
    return NextResponse.json({
      success: true,
      message: "Assessment option added successfully",
      id: result.insertedId
    });
  } catch (error) {
    console.error("Error adding assessment option:", error);
    return NextResponse.json(
      { error: "Failed to add assessment option" },
      { status: 500 }
    );
  }
} 