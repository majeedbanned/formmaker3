import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classCode, teacherCode, courseCode, schoolCode } = body;

    // console.log("Fetching cell data for:", { classCode, teacherCode, courseCode, schoolCode });

    if (!classCode || !teacherCode || !courseCode || !schoolCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI || "");
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

    // console.log("Found cell data entries:", cellData.length);
    
    // Log a sample of unique date formats for debugging
    if (cellData.length > 0 && process.env.NODE_ENV === "development") {
      const uniqueDates = new Set(cellData.map(cell => cell.date));
      // console.log("Sample of date formats in database:", Array.from(uniqueDates).slice(0, 5));
      
      // Check for potential duplicate cells with different date formats
      const cellIdentifiers = cellData.map(cell => {
        // Create a simplified identifier without the time component
        const simpleDate = new Date(cell.date).toISOString().split('T')[0];
        return `${cell.classCode}_${cell.studentCode}_${simpleDate}_${cell.timeSlot}`;
      });
      
      // Count occurrences of each identifier
      const counts: Record<string, number> = {};
      cellIdentifiers.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });
      
      // Find duplicates
      const duplicates = Object.entries(counts)
        .filter(entry => entry[1] > 1)
        .map(entry => entry[0]);
      
      if (duplicates.length > 0) {
        // console.log("Potential duplicate cells detected:", duplicates.length);
        // console.log("First few duplicates:", duplicates.slice(0, 3));
      }
    }
    
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