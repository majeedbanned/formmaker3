import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const teacherCode = searchParams.get("teacherCode");
    const schoolCode = searchParams.get("schoolCode");

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("teachers");

    let query: Record<string, unknown> = {};

    if (schoolCode) {
      query["data.schoolCode"] = schoolCode;
    }

    if (teacherCode) {
      query["data.teacherCode"] = teacherCode;
    } else if (search) {
      // Search in teacherName, teacherFamily, and teacherCode
      query.$or = [
        { "data.teacherName": { $regex: search, $options: "i" } },
        { "data.teacherFamily": { $regex: search, $options: "i" } },
        { "data.teacherCode": { $regex: search, $options: "i" } },
      ];
    }

    const teachers = await collection.find(query).limit(20).toArray();

    logger.info(`Found ${teachers.length} teachers`, { domain, search });

    return NextResponse.json({ teachers });
  } catch (error) {
    logger.error("Error searching teachers:", error);
    return NextResponse.json(
      { error: "Failed to search teachers" },
      { status: 500 }
    );
  }
}

