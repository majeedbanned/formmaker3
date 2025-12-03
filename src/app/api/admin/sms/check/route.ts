import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "فقط مدیران مدرسه می‌توانند به این اطلاعات دسترسی داشته باشند" },
        { status: 403 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const schoolsCollection = connection.collection("schools");

    const school = await schoolsCollection.findOne({
      "data.schoolCode": user.schoolCode,
    });

    if (school && school.data?.SMS_USERNAME && school.data?.SMS_PASSWORD) {
      return NextResponse.json({
        registered: true,
        username: school.data.SMS_USERNAME,
        password: school.data.SMS_PASSWORD,
      });
    }

    return NextResponse.json({
      registered: false,
    });
  } catch (error: any) {
    logger.error("Error checking SMS registration:", error);
    return NextResponse.json(
      {
        error: "خطا در بررسی وضعیت ثبت‌نام",
        registered: false,
      },
      { status: 500 }
    );
  }
}

