import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function PUT(
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
    const { name, description, assignedTeachers } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "نام بخش الزامی است" },
        { status: 400 }
      );
    }

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection("ticketing_departments");

    // Check if department name already exists for this school (excluding current department)
    const existingDept = await collection.findOne({
      "data.schoolCode": user.schoolCode,
      "data.name": name.trim(),
      "_id": { $ne: new ObjectId(id) }
    });

    if (existingDept) {
      return NextResponse.json(
        { error: "بخشی با این نام قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    // Update department
    const result = await collection.updateOne(
      { 
        "_id": new ObjectId(id),
        "data.schoolCode": user.schoolCode 
      },
      {
        $set: {
          "data.name": name.trim(),
          "data.description": description?.trim() || "",
          "data.assignedTeachers": assignedTeachers || [],
          "data.updatedAt": new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "بخش یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating department:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی بخش" },
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

    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Check if department has any tickets
    const ticketsCollection = connection.collection("ticketing_tickets");
    const hasTickets = await ticketsCollection.findOne({
      "data.departmentId": id,
      "data.schoolCode": user.schoolCode
    });

    if (hasTickets) {
      return NextResponse.json(
        { error: "نمی‌توان بخشی را که دارای تیکت است حذف کرد" },
        { status: 400 }
      );
    }

    const collection = connection.collection("ticketing_departments");
    const result = await collection.deleteOne({
      "_id": new ObjectId(id),
      "data.schoolCode": user.schoolCode
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "بخش یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting department:", error);
    return NextResponse.json(
      { error: "خطا در حذف بخش" },
      { status: 500 }
    );
  }
}


