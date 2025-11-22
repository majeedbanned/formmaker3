import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
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

    if (!teacherCode) {
      return NextResponse.json(
        { error: "teacherCode is required" },
        { status: 400 }
      );
    }

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("teacherEvaluations");

    // Get all evaluations for this teacher by the current user (or admin)
    const expectedAssessorCode = user.username;
    const adminAssessorCode = `admin_${user.username}`;

    const evaluations = await collection
      .find({
        "data.teacherCode": teacherCode,
        $or: [
          { "data.assessorCode": expectedAssessorCode },
          { "data.assessorCode": adminAssessorCode },
        ],
      })
      .sort({ "data.evaluationMonth": 1 })
      .toArray();

    // Process evaluations to calculate sum scores per month
    const monthlyData = evaluations.map((evaluation) => {
      const items = evaluation.data?.items || [];
      const totalScore = items.reduce((sum: number, item: { score?: number }) => {
        return sum + (item.score || 0);
      }, 0);

      return {
        month: evaluation.data?.evaluationMonth || "",
        totalScore: Math.round(totalScore * 100) / 100,
        evaluationId: evaluation._id.toString(),
      };
    });

    logger.info(`Fetched ${monthlyData.length} evaluations for teacher ${teacherCode}`, {
      domain,
      teacherCode,
    });

    return NextResponse.json({ monthlyData });
  } catch (error) {
    logger.error("Error fetching evaluation history:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluation history" },
      { status: 500 }
    );
  }
}

