import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newPassword } = body;

    // Validate input
    if (!newPassword) {
      return NextResponse.json(
        { error: "رمز عبور جدید الزامی است" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد" },
        { status: 400 }
      );
    }

    // Get domain from headers
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    // Only school users can change password
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "فقط مدیران مدرسه می‌توانند رمز عبور را تغییر دهند" },
        { status: 403 }
      );
    }

    // Connect to database
    const connection = await connectToDatabase(domain);

    // Find the school user
    const school = await connection.collection("schools").findOne({
    //   "data.domain": domain,
      "data.schoolCode": user.schoolCode,
    });

    if (!school) {
      return NextResponse.json(
        { error: "مدرسه یافت نشد" },
        { status: 404 }
      );
    }

    // Hash new password
    //const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password in database
    const updateResult = await connection.collection("schools").updateOne(
      {
        "data.schoolCode": user.schoolCode,
      },
      {
        $set: {
          "data.password": newPassword,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "خطا در به‌روزرسانی رمز عبور" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "رمز عبور با موفقیت تغییر کرد",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "خطا در تغییر رمز عبور" },
      { status: 500 }
    );
  }
}
