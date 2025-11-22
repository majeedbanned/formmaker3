import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { searchParams } = new URL(request.url);
    const teacherCode = searchParams.get("teacherCode");
    const assessorCode = searchParams.get("assessorCode");
    const evaluationMonth = searchParams.get("evaluationMonth");

    if (!teacherCode || !assessorCode || !evaluationMonth) {
      return NextResponse.json(
        { error: "teacherCode, assessorCode, and evaluationMonth are required" },
        { status: 400 }
      );
    }

    // Verify assessorCode matches current user (allow admin prefix)
    const expectedAssessorCode = user.username;
    const adminAssessorCode = `admin_${user.username}`;
    if (assessorCode !== expectedAssessorCode && assessorCode !== adminAssessorCode) {
      return NextResponse.json(
        { error: "Unauthorized: assessorCode must match current user" },
        { status: 403 }
      );
    }

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("teacherEvaluations");

    const evaluation = await collection.findOne({
      "data.teacherCode": teacherCode,
      "data.assessorCode": assessorCode,
      "data.evaluationMonth": evaluationMonth,
    });

    logger.info("Evaluation fetch", {
      domain,
      teacherCode,
      assessorCode,
      evaluationMonth,
      found: !!evaluation,
    });

    return NextResponse.json({ evaluation });
  } catch (error) {
    logger.error("Error fetching evaluation:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluation" },
      { status: 500 }
    );
  }
}

