import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { logger } from "@/lib/logger";

interface IncomingTeacher {
  teacherCode?: string;
  teacherName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.userType !== "school") {
      return NextResponse.json({ error: "غیر مجاز" }, { status: 401 });
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const body = await request.json();
    const teachers: IncomingTeacher[] = Array.isArray(body?.teachers)
      ? body.teachers
      : [];

    if (teachers.length === 0) {
      return NextResponse.json(
        { error: "لیست معلمان برای وارد کردن خالی است" },
        { status: 400 }
      );
    }

    const processed: Array<{
      line: number;
      teacherCode: string;
      teacherName: string;
    }> = [];
    const invalidRows: Array<{ line: number; reason: string }> = [];
    const duplicateInPayload: string[] = [];
    const seenCodes = new Set<string>();

    teachers.forEach((item, index) => {
      const teacherCode = String(item?.teacherCode ?? "").trim();
      const teacherName = String(item?.teacherName ?? "").trim();

      if (!teacherCode || !teacherName) {
        invalidRows.push({
          line: index + 1,
          reason: "کد یا نام معلم خالی است",
        });
        return;
      }

      if (seenCodes.has(teacherCode)) {
        duplicateInPayload.push(teacherCode);
        return;
      }

      seenCodes.add(teacherCode);
      processed.push({
        line: index + 1,
        teacherCode,
        teacherName,
      });
    });

    if (processed.length === 0) {
      return NextResponse.json(
        {
          error: "هیچ ردیف معتبری برای وارد کردن یافت نشد",
          invalidRows,
          duplicateInPayload,
        },
        { status: 400 }
      );
    }

    const connection = await connectToDatabase(domain);
    const collection = connection.collection("teachers");

    const existingDocs = await collection
      .find({
        "data.schoolCode": user.schoolCode,
        "data.teacherCode": { $in: processed.map((row) => row.teacherCode) },
      })
      .toArray();

    const existingCodes = new Set<string>(
      existingDocs
        .map((doc) => {
          if (doc?.data instanceof Map) {
            return String(doc.data.get("teacherCode") ?? "").trim();
          }
          return String(doc?.data?.teacherCode ?? doc?.teacherCode ?? "").trim();
        })
        .filter((code) => code.length > 0)
    );

    const documentsToInsert = processed
      .filter((row) => !existingCodes.has(row.teacherCode))
      .map((row) => ({
        data: new Map(
          Object.entries({
            teacherCode: row.teacherCode,
            teacherName: row.teacherName,
            schoolCode: user.schoolCode,
            isActive: true,
            password: row.teacherCode,
          })
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    let insertedCount = 0;
    if (documentsToInsert.length > 0) {
      const insertResult = await collection.insertMany(documentsToInsert, {
        ordered: false,
      });
      insertedCount = insertResult.insertedCount ?? documentsToInsert.length;
    }

    const skippedExisting = processed
      .filter((row) => existingCodes.has(row.teacherCode))
      .map((row) => row.teacherCode);

    logger.info("Teacher import completed", {
      domain,
      schoolCode: user.schoolCode,
      insertedCount,
    });

    return NextResponse.json({
      success: true,
      insertedCount,
      skippedExisting,
      duplicateInPayload: Array.from(new Set(duplicateInPayload)),
      invalidRows,
    });
  } catch (error) {
    logger.error("Error importing teachers:", error);
    return NextResponse.json(
      { error: "خطا در وارد کردن معلمان" },
      { status: 500 }
    );
  }
}


