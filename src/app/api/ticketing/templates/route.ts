import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("ticketing_templates");

    const templates = await collection
      .find({
        "data.schoolCode": user.schoolCode,
      })
      .sort({ "data.title": 1 })
      .toArray();

    return NextResponse.json({ templates });
  } catch (error) {
    logger.error("Error fetching ticket templates:", error);
    return NextResponse.json(
      { error: "خطا در دریافت الگوها" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.userType !== "school") {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const { title, description } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "عنوان الگو الزامی است" },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "توضیحات الگو الزامی است" },
        { status: 400 }
      );
    }

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("ticketing_templates");

    const templateData = {
      data: {
        title: title.trim(),
        description: description.trim(),
        schoolCode: user.schoolCode,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const result = await collection.insertOne(templateData);

    return NextResponse.json({
      success: true,
      template: {
        _id: result.insertedId,
        ...templateData,
      },
    });
  } catch (error) {
    logger.error("Error creating ticket template:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد الگو" },
      { status: 500 }
    );
  }
}


