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

      // Get unique student codes
      const studentCodes = Array.from(studentMap.keys());

      // Fetch student names from students collection
      const studentsCollection = connection.collection("students");
      const students = await studentsCollection
        .find({
          "data.studentCode": { $in: studentCodes },
          "data.schoolCode": schoolCode,
        })
        .project({
          "data.studentCode": 1,
          "data.studentName": 1,
          "data.studentFamily": 1,
          "data.studentlname": 1, // Some collections use studentlname instead of studentFamily
        })
        .toArray();

      // Create a map of studentCode to student info
      const studentInfoMap = new Map<string, { studentName: string; studentFamily: string }>();
      students.forEach((student: any) => {
        const code = student.data.studentCode;
        const name = student.data.studentName || "";
        const family = student.data.studentFamily || student.data.studentlname || "";
        studentInfoMap.set(code, { studentName: name, studentFamily: family });
      });

      // Enrich disciplinary data with student names
      const enrichedData = disciplinaryData.map((data) => {
        const studentInfo = studentInfoMap.get(data.studentCode) || {
          studentName: data.studentCode, // Fallback to studentCode if not found
          studentFamily: "",
        };

        return {
          ...data,
          studentName: studentInfo.studentName,
          studentFamily: studentInfo.studentFamily,
        };
      });

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

      logger.info(`Found ${enrichedData.length} students with disciplinary records`);

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

