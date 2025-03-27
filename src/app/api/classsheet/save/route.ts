import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      classCode, 
      studentCode, 
      teacherCode, 
      courseCode, 
      date, 
      timeSlot, 
      note, 
      schoolCode, 
      grades, 
      presenceStatus, 
      descriptiveStatus, 
      assessments 
    } = body;

    // Create a unique identifier for debugging
    const cellIdentifier = `${classCode}_${studentCode}_${teacherCode}_${courseCode}_${schoolCode}_${date}_${timeSlot}`;
    console.log("Saving cell data with identifier:", cellIdentifier);
    console.log("Data includes:", { 
      presenceStatus, 
      descriptiveStatus: descriptiveStatus || 'None',
      gradeCount: grades?.length || 0,
      assessmentCount: assessments?.length || 0,
      hasNote: note ? 'Yes' : 'No' 
    });

    // Validate required fields
    if (!classCode || !studentCode || !teacherCode || !courseCode || !date || !timeSlot || !schoolCode) {
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
    
    // Query to find if this cell data already exists (for debugging)
    const existingRecord = await collection.findOne({
      classCode,
      studentCode,
      teacherCode,
      courseCode,
      schoolCode,
      date,
      timeSlot,
    });

    console.log("Existing record found:", existingRecord ? "Yes" : "No");
    
    // Create or update the cell data
    const result = await collection.updateOne(
      {
        classCode,
        studentCode,
        teacherCode,
        courseCode,
        schoolCode,
        date,
        timeSlot,
      },
      {
        $set: {
          note,
          grades: grades || [],
          presenceStatus,
          descriptiveStatus: descriptiveStatus || "",
          assessments: assessments || [],
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log("Save result:", {
      cellIdentifier,
      upserted: result.upsertedCount > 0,
      modified: result.modifiedCount > 0
    });

    await client.close();
    
    return NextResponse.json({
      success: true,
      message: "Cell data saved successfully",
      upserted: result.upsertedCount > 0,
      modified: result.modifiedCount > 0,
    });
  } catch (error) {
    console.error("Error saving classsheet data:", error);
    return NextResponse.json(
      { error: "Failed to save classsheet data" },
      { status: 500 }
    );
  }
} 