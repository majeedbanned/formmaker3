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
        distinctAbsenceDates: Set<string>; // Track distinct dates for absences
        acceptableAbsences: number;
        distinctAcceptableAbsenceDates: Set<string>; // Track distinct dates for acceptable absences
        acceptableAbsenceNotes: string[];
        totalLate: number;
      }>();

      records.forEach((record: any) => {
        const studentCode = record.studentCode;
        
        if (!studentMap.has(studentCode)) {
          studentMap.set(studentCode, {
            studentCode,
            totalAbsences: 0,
            distinctAbsenceDates: new Set<string>(),
            acceptableAbsences: 0,
            distinctAcceptableAbsenceDates: new Set<string>(),
            acceptableAbsenceNotes: [],
            totalLate: 0,
          });
        }

        const studentData = studentMap.get(studentCode)!;

        if (record.presenceStatus === "absent") {
          studentData.totalAbsences++;
          
          // Extract date part (YYYY-MM-DD) from the date string
          const dateStr = record.date;
          if (dateStr) {
            // Handle both ISO format (2024-01-15T00:00:00.000Z) and simple format (2024-01-15)
            const dateOnly = dateStr.split('T')[0].split(' ')[0];
            studentData.distinctAbsenceDates.add(dateOnly);
          }
          
          if (record.absenceAcceptable === true && record.absenceDescription) {
            studentData.acceptableAbsences++;
            studentData.acceptableAbsenceNotes.push(record.absenceDescription);
            
            // Track distinct dates for acceptable absences
            if (dateStr) {
              const dateOnly = dateStr.split('T')[0].split(' ')[0];
              studentData.distinctAcceptableAbsenceDates.add(dateOnly);
            }
          }
        } else if (record.presenceStatus === "late") {
          studentData.totalLate++;
        }
      });

      // Convert map to array and convert Set to count
      const disciplinaryData = Array.from(studentMap.values()).map(data => ({
        studentCode: data.studentCode,
        totalAbsences: data.totalAbsences,
        distinctAbsenceDatesCount: data.distinctAbsenceDates.size,
        acceptableAbsences: data.acceptableAbsences,
        distinctAcceptableAbsenceDatesCount: data.distinctAcceptableAbsenceDates.size,
        acceptableAbsenceNotes: data.acceptableAbsenceNotes,
        totalLate: data.totalLate,
      }));

      // Get unique student codes
      const studentCodes = Array.from(studentMap.keys());

      // Fetch student names from students collection
      const studentsCollection = connection.collection("students");
      
      // Build student query with class filter if provided
      const studentQuery: Record<string, any> = {
        "data.schoolCode": schoolCode,
        "data.isActive": true,
      };

      // If classCode is provided, filter students by class
      if (classCode) {
        const classCodes = classCode.split(",").map(code => code.trim()).filter(Boolean);
        if (classCodes.length > 0) {
          studentQuery["data.classCode.value"] = { $in: classCodes };
        }
      }

      // Fetch all students from the selected classes
      const students = await studentsCollection
        .find(studentQuery)
        .project({
          "data.studentCode": 1,
          "data.studentName": 1,
          "data.studentFamily": 1,
          "data.studentlname": 1, // Some collections use studentlname instead of studentFamily
        })
        .toArray();

      // Create a map of studentCode to student info (handling both with and without leading zeros)
      const studentInfoMap = new Map<string, { studentName: string; studentFamily: string; originalCode: string }>();
      students.forEach((student: any) => {
        const code = student.data.studentCode;
        const name = student.data.studentName || "";
        const family = student.data.studentFamily || student.data.studentlname || "";
        
        if (code && (name || family)) { // Only add students with names
          // Store with original code
          studentInfoMap.set(String(code), { studentName: name, studentFamily: family, originalCode: code });
          // Also store normalized version (trimmed, and as number if possible)
          const normalizedCode = String(code).trim();
          studentInfoMap.set(normalizedCode, { studentName: name, studentFamily: family, originalCode: code });
          // Store as number without leading zeros
          const numericCode = String(parseInt(normalizedCode, 10));
          if (numericCode !== "NaN" && numericCode !== normalizedCode) {
            studentInfoMap.set(numericCode, { studentName: name, studentFamily: family, originalCode: code });
          }
        }
      });

      // Enrich disciplinary data with student names and filter out students without names
      const enrichedData = disciplinaryData
        .map((data) => {
          // Try to find student with exact match first
          let studentInfo = studentInfoMap.get(String(data.studentCode));
          
          // If not found, try normalized version
          if (!studentInfo) {
            studentInfo = studentInfoMap.get(String(data.studentCode).trim());
          }
          
          // If still not found, try numeric version (without leading zeros)
          if (!studentInfo) {
            const numericCode = String(parseInt(String(data.studentCode), 10));
            if (numericCode !== "NaN") {
              studentInfo = studentInfoMap.get(numericCode);
            }
          }

          // If we found the student info, return enriched data
          if (studentInfo && (studentInfo.studentName || studentInfo.studentFamily)) {
            return {
              ...data,
              studentCode: studentInfo.originalCode, // Use the original code from students collection
              studentName: studentInfo.studentName,
              studentFamily: studentInfo.studentFamily,
            };
          }
          
          // Return null for students not found (will be filtered out)
          return null;
        })
        .filter((data): data is NonNullable<typeof data> => data !== null); // Filter out null entries

      // Sort by family name, then by first name
      enrichedData.sort((a, b) => {
        const familyA = a.studentFamily || "";
        const familyB = b.studentFamily || "";
        const nameA = a.studentName || "";
        const nameB = b.studentName || "";

        // First compare by family name
        const familyCompare = familyA.localeCompare(familyB, "fa");
        if (familyCompare !== 0) {
          return familyCompare;
        }

        // If family names are equal, compare by first name
        return nameA.localeCompare(nameB, "fa");
      });

      logger.info(`Processed ${disciplinaryData.length} raw records, found ${enrichedData.length} students with names from selected classes`);

      return NextResponse.json(enrichedData);
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

