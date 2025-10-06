import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // Get domain from headers
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to database
    const connection = await connectToDatabase(domain);

    // Find the school by domain
    const school = await connection.collection("schools").findOne({
      "data.domain": domain
    });

    if (!school) {
      return NextResponse.json({
        success: true,
        schoolName: "مدرسه من" // Default fallback
      });
    }

    const schoolName = school.data.schoolName || "مدرسه من";

    return NextResponse.json({
      success: true,
      schoolName: schoolName
    });

  } catch (error) {
    console.error("Error fetching school name:", error);
    return NextResponse.json({
      success: true,
      schoolName: "مدرسه من" // Default fallback on error
    });
  }
}
