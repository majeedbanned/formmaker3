import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.userType !== "school") {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const { id } = await params;
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

    const result = await collection.updateOne(
      {
        _id: new ObjectId(id),
        "data.schoolCode": user.schoolCode,
      },
      {
        $set: {
          "data.title": title.trim(),
          "data.description": description.trim(),
          "data.updatedAt": new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "الگو یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating ticket template:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی الگو" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.userType !== "school") {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const { id } = await params;
    const domain = request.headers.get("x-domain") || "localhost:3000";

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("ticketing_templates");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      "data.schoolCode": user.schoolCode,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "الگو یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting ticket template:", error);
    return NextResponse.json(
      { error: "خطا در حذف الگو" },
      { status: 500 }
    );
  }
}



