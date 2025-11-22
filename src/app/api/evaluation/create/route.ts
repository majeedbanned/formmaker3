import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
    const { data } = body;

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

    // Check if evaluation already exists (check both assessorCode formats to prevent duplicates)
    const existing = await collection.findOne({
      "data.teacherCode": data.teacherCode,
      "data.evaluationMonth": data.evaluationMonth,
      $or: [
        { "data.assessorCode": data.assessorCode },
        { "data.assessorCode": expectedAssessorCode },
        { "data.assessorCode": adminAssessorCode },
      ],
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Evaluation already exists for this teacher and month",
          evaluation: existing,
        },
        { status: 409 }
      );
    }

    const document = {
      _id: new mongoose.Types.ObjectId(),
      data: {
        teacherCode: data.teacherCode,
        assessorCode: data.assessorCode,
        evaluationMonth: data.evaluationMonth,
        items: data.items,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(document);

    logger.info("Evaluation created successfully", {
      domain,
      teacherCode: data.teacherCode,
      evaluationMonth: data.evaluationMonth,
    });

    return NextResponse.json({ evaluation: document }, { status: 201 });
  } catch (error) {
    logger.error("Error creating evaluation:", error);
    return NextResponse.json(
      { error: "Failed to create evaluation" },
      { status: 500 }
    );
  }
}

