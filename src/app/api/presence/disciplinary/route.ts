import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const schoolCode = searchParams.get("schoolCode");
    const classCode = searchParams.get("classCode");

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    logger.info(`Fetching disciplinary report data for domain: ${domain}, schoolCode: ${schoolCode}`);

    // Validate required parameter
    if (!schoolCode) {
      return NextResponse.json(
        { error: "Missing required parameter: schoolCode" },
        { status: 400 }
      );
    }

    try {
      // Connect to the domain-specific database
      const connection = await connectToDatabase(domain);
      const classsheetCollection = connection.collection("classsheet");

      // Build the query
      const query: Record<string, any> = {
        schoolCode: schoolCode,
        presenceStatus: { $in: ["absent", "late"] } // Only get absences and delays
      };

      // Add class filter if provided
      if (classCode) {
        const classCodes = classCode.split(",").map(code => code.trim()).filter(Boolean);
        if (classCodes.length > 1) {
          query.classCode = { $in: classCodes };
        } else if (classCodes.length === 1) {
          query.classCode = classCodes[0];
        }
      }

      // Fetch all absence and late records
      const records = await classsheetCollection.find(query).toArray();

      // Group by student
      const studentMap = new Map<string, {
        studentCode: string;
        totalAbsences: number;
        acceptableAbsences: number;
        acceptableAbsenceNotes: string[];
        totalLate: number;
      }>();

      records.forEach((record: any) => {
        const studentCode = record.studentCode;
        
        if (!studentMap.has(studentCode)) {
          studentMap.set(studentCode, {
            studentCode,
            totalAbsences: 0,
            acceptableAbsences: 0,
            acceptableAbsenceNotes: [],
            totalLate: 0,
          });
        }

        const studentData = studentMap.get(studentCode)!;

        if (record.presenceStatus === "absent") {
          studentData.totalAbsences++;
          if (record.absenceAcceptable === true && record.absenceDescription) {
            studentData.acceptableAbsences++;
            studentData.acceptableAbsenceNotes.push(record.absenceDescription);
          }
        } else if (record.presenceStatus === "late") {
          studentData.totalLate++;
        }
      });

      // Convert map to array
      const disciplinaryData = Array.from(studentMap.values());

      logger.info(`Found ${disciplinaryData.length} students with disciplinary records`);

      return NextResponse.json(disciplinaryData);
    } catch (dbError) {
      logger.error(`Database error for domain ${domain}:`, dbError);
      return NextResponse.json(
        { error: "Error connecting to the database" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error processing disciplinary report request:", error);
    return NextResponse.json(
      { error: "Failed to fetch disciplinary report data" },
      { status: 500 }
    );
  }
}

