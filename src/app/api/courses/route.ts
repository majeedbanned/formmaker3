import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Connect to MongoDB function
async function connectToDB() {
  const uri = process.env.NEXT_PUBLIC_MONGODB_URI;
  if (!uri) {
    throw new Error("MongoDB connection string not found in environment variables");
  }
  
  const client = new MongoClient(uri);
  await client.connect();
  return client.db();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get("courseCode");
    const schoolCode = searchParams.get("schoolCode");

    // Validate required parameters
    if (!courseCode || !schoolCode) {
      return NextResponse.json(
        { error: "Required parameters missing: courseCode, schoolCode" },
        { status: 400 }
      );
    }

    const db = await connectToDB();
    const coursesCollection = db.collection("courses");

    // Query for course with the specified code and school
    const query = {
      "data.courseCode": courseCode,
      "data.schoolCode": schoolCode,
    };

    const courses = await coursesCollection.find(query).toArray();

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching course data:", error);
    return NextResponse.json(
      { error: "Failed to fetch course data" },
      { status: 500 }
    );
  }
} 