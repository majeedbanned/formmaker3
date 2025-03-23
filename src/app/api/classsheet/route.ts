import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classCode, teacherCode, courseCode, schoolCode } = body;

    console.log("Fetching cell data for:", { classCode, teacherCode, courseCode, schoolCode });

    if (!classCode || !teacherCode || !courseCode || !schoolCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI || "");
    await client.connect();
    
    const db = client.db();
    const collection = db.collection("classsheet");

    // Find all cell data for this class, teacher, and course
    const cellData = await collection
      .find({
        classCode,
        teacherCode,
        courseCode,
        schoolCode,
      })
      .toArray();

    console.log("Found cell data entries:", cellData.length);
    
    await client.close();
    
    return NextResponse.json(cellData);
  } catch (error) {
    console.error("Error fetching classsheet data:", error);
    return NextResponse.json(
      { error: "Failed to fetch classsheet data" },
      { status: 500 }
    );
  }
} 