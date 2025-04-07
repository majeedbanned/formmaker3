import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
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
      assessments,
      persianDate,
      persianMonth
    } = body;

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Create a unique identifier for debugging
    const cellIdentifier = `${classCode}_${studentCode}_${teacherCode}_${courseCode}_${schoolCode}_${date}_${timeSlot}`;
    logger.info(`Saving classsheet data for domain: ${domain}, identifier: ${cellIdentifier}`);
    logger.debug("Data includes:", { 
      presenceStatus, 
      descriptiveStatus: descriptiveStatus || 'None',
      gradeCount: grades?.length || 0,
      assessmentCount: assessments?.length || 0,
      hasNote: note ? 'Yes' : 'No',
      persianDate: persianDate || 'Not provided',
      persianMonth: persianMonth || 'Not provided'
    });

    // Validate required fields
    if (!classCode || !studentCode || !teacherCode || !courseCode || !date || !timeSlot || !schoolCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      
      // Get the classsheet collection directly from the connection
      const classheetCollection = connection.collection("classsheet");
      
      // Query to find if this cell data already exists (for debugging)
      const existingRecord = await classheetCollection.findOne({
        classCode,
        studentCode,
        teacherCode,
        courseCode,
        schoolCode,
        date,
        timeSlot,
      });

      logger.debug(`Existing record found: ${existingRecord ? "Yes" : "No"}`);
      
      // Create or update the cell data
      const result = await classheetCollection.updateOne(
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
            persianDate: persianDate || "",
            persianMonth: persianMonth || "",
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      logger.info(`Save result for ${cellIdentifier}: upserted=${result.upsertedCount > 0}, modified=${result.modifiedCount > 0}`);
      
      return NextResponse.json({
        success: true,
        message: "Cell data saved successfully",
        upserted: result.upsertedCount > 0,
        modified: result.modifiedCount > 0,
      });
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error in classsheet save API:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
} 