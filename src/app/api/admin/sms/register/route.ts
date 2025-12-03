import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // Validate required fields
    const requiredFields = [
      "register_personality",
      "first_name",
      "last_name",
      "father",
      "gender",
      "username",
      "password",
      "password_repeat",
      "date",
      "shenasname",
      "melli_code",
      "email",
      "mobile",
      "tel",
      "fax",
      "post_code",
      "addr",
    ];

    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          status: 400,
          message: `فیلدهای الزامی زیر پر نشده‌اند: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate password match
    if (formData.password !== formData.password_repeat) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          result: 17,
          message: "رمز عبور و تکرار آن باید یکسان باشند",
        },
        { status: 400 }
      );
    }

    // Format mobile number: add +98 prefix and remove leading 0
    let formattedMobile = formData.mobile.trim();
    if (formattedMobile.startsWith("0")) {
      formattedMobile = formattedMobile.substring(1);
    }
    if (!formattedMobile.startsWith("+98")) {
      formattedMobile = "+98" + formattedMobile;
    }

    // Prepare data for API with formatted mobile
    const apiData = {
      ...formData,
      mobile: formattedMobile,
    };

    // Result code to message mapping
    const resultMessages: Record<number, string> = {
      0: "ثبت‌نام کاربر با موفقیت انجام شده است.",
      10: "نام کاربری ارسال شده نامعتبر است.",
      11: "موبایل ارسال شده نامعتبر است.",
      12: "کد ملی ارسال شده نامعتبر است.",
      13: "ایمیل ارسال شده نامعتبر است.",
      14: "مدیر کاربر درخواستی دسترسی کافی ندارد.",
      15: "نام کاربری ارسال شده قبلا ثبت شده است.",
      16: "پکیج درخواستی اشتباه است.",
      17: "رمزعبور و تکرار آن هماهنگ نیست.",
    };

    // Call the external SMS registration API
    const token = "fb3db9d227b9a0a6e8c5a66bc00d7026abce89f6";
    const response = await fetch(
      "https://ws.panel-payamak.com/api/v1/rest/user/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Token": token,
        },
        body: JSON.stringify(apiData),
      }
    );

    const data = await response.json();

    // Handle the response format: {status: 200, result: 0}
    const resultCode = data.result !== undefined ? data.result : (data.status === 200 ? 0 : -1);
    const message = resultMessages[resultCode] || data.message || "خطا در ثبت‌نام";

    if (data.status === 200 && resultCode === 0) {
      // Save SMS credentials to schools collection
      try {
        const user = await getCurrentUser();
        if (user && user.schoolCode) {
          const domain = request.headers.get("x-domain") || "localhost:3000";
          const connection = await connectToDatabase(domain);
          const schoolsCollection = connection.collection("schools");
          
          await schoolsCollection.updateOne(
            { "data.schoolCode": user.schoolCode },
            {
              $set: {
                "data.SMS_USERNAME": formData.username,
                "data.SMS_PASSWORD": formData.password,
              },
            }
          );
          
          logger.info(`SMS credentials saved for school: ${user.schoolCode}`);
        }
      } catch (dbError) {
        logger.error("Error saving SMS credentials to database:", dbError);
        // Don't fail the request if DB update fails, registration was successful
      }

      return NextResponse.json({
        success: true,
        status: data.status,
        result: resultCode,
        message: message,
        data: data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          status: data.status || response.status || 400,
          result: resultCode,
          message: message,
          data: data,
        },
        { status: data.status || response.status || 400 }
      );
    }
  } catch (error: any) {
    logger.error("Error in SMS registration:", error);
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

