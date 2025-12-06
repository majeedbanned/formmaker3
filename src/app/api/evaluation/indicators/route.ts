import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get("schoolCode");

    if (!schoolCode) {
      return NextResponse.json(
        { error: "schoolCode is required" },
        { status: 400 }
      );
    }

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("evaluationIndicators");

    const query: Record<string, unknown> = {
      "data.schoolCode": schoolCode,
    };

    const indicators = await collection
      .find(query)
      .sort({ "data.order": 1, "data.indicatorName": 1 })
      .toArray();

    logger.info(`Found ${indicators.length} evaluation indicators`, {
      domain,
      schoolCode,
    });

    return NextResponse.json({ indicators });
  } catch (error) {
    logger.error("Error fetching evaluation indicators:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluation indicators" },
      { status: 500 }
    );
  }
}


