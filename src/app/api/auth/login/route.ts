import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schoolCode, password } = body;

    const { token, user } = await authenticateUser(schoolCode, password);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json(
      { 
        message: "ورود موفقیت‌آمیز",
        user: {
          id: user.id,
          schoolCode: user.schoolCode,
          schoolName: user.schoolName,
          role: user.role,
          permissions: user.permissions,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "خطا در ورود به سیستم" },
      { status: 500 }
    );
  }
} 