import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to domain-specific database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection("ticketing_departments");

    // Build query based on user type
    let query: Record<string, unknown> = {
      "data.schoolCode": user.schoolCode
    };

    // Get all departments for this school
    const departments = await collection
      .find(query)
      .sort({ "data.name": 1 })
      .toArray();

    return NextResponse.json({ departments });
  } catch (error) {
    logger.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "خطا در دریافت بخش‌ها" },
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

    // Check if department name already exists for this school
    const existingDept = await collection.findOne({
      "data.schoolCode": user.schoolCode,
      "data.name": name.trim()
    });

    if (existingDept) {
      return NextResponse.json(
        { error: "بخشی با این نام قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    // Create department
    const departmentData = {
      data: {
        name: name.trim(),
        description: description?.trim() || "",
        schoolCode: user.schoolCode,
        assignedTeachers: assignedTeachers || [],
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }
    };

    const result = await collection.insertOne(departmentData);

    return NextResponse.json({
      success: true,
      department: {
        _id: result.insertedId,
        ...departmentData
      }
    });
  } catch (error) {
    logger.error("Error creating department:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد بخش" },
      { status: 500 }
    );
  }
}


