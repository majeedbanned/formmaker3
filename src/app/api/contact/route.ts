import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";


export async function POST(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || request.headers.get("host")?.split(":")[0];
    if (!domain) {
      return NextResponse.json({ error: "Domain header required" }, { status: 400 });
    }

    const { firstName, lastName, email, phone, message } = await request.json();

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "نام، نام خانوادگی، ایمیل و پیام الزامی هستند" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase(domain);
    const contactMessages = db.collection("contactMessages");
    
    const contactMessage = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      message: message.trim(),
      isRead: false,
      createdAt: new Date(),
    };

    await contactMessages.insertOne(contactMessage);

    return NextResponse.json({ 
      success: true,
      message: "پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت."
    });
  } catch (error) {
    console.error("Error saving contact message:", error);
    return NextResponse.json(
      { error: "خطا در ارسال پیام. لطفاً دوباره تلاش کنید." },
      { status: 500 }
    );
  }
} 