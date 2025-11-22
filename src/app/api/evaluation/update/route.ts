import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
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
    const username = user.username;

    const body = await request.json();
    const { _id, data } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Evaluation ID is required" },
        { status: 400 }
      );
    }

    if (
      !data.teacherCode ||
      !data.assessorCode ||
      !data.evaluationMonth ||
      !data.items
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify assessorCode matches current user (allow admin prefix)
    const expectedAssessorCode = username;
    const adminAssessorCode = `admin_${username}`;
    if (data.assessorCode !== expectedAssessorCode && data.assessorCode !== adminAssessorCode) {
      return NextResponse.json(
        { error: "Unauthorized: assessorCode must match current user" },
        { status: 403 }
      );
    }

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("teacherEvaluations");

    // Verify the evaluation exists and belongs to the current user (check both formats)
    const existing = await collection.findOne({
      _id: new mongoose.Types.ObjectId(_id),
      $or: [
        { "data.assessorCode": username },
        { "data.assessorCode": adminAssessorCode },
      ],
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Evaluation not found or unauthorized" },
        { status: 404 }
      );
    }

    const updateResult = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(_id) },
      {
        $set: {
          "data.items": data.items,
          "data.updatedAt": new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }

    // Fetch updated document
    const updated = await collection.findOne({
      _id: new mongoose.Types.ObjectId(_id),
    });

    logger.info("Evaluation updated successfully", {
      domain,
      evaluationId: _id,
    });

    return NextResponse.json({ evaluation: updated });
  } catch (error) {
    logger.error("Error updating evaluation:", error);
    return NextResponse.json(
      { error: "Failed to update evaluation" },
      { status: 500 }
    );
  }
}

