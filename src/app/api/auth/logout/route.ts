import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Remove the auth token cookie
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");

    return NextResponse.json(
      { message: "خروج موفقیت‌آمیز" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "خطا در خروج از سیستم" },
      { status: 500 }
    );
  }
} 