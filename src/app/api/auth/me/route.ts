import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = await verifyAuth(token);
    
    return NextResponse.json({
      user: {
        id: payload.userId,
        userType: payload.userType,
        schoolCode: payload.schoolCode,
        username: payload.username,
        name: payload.name,
        role: payload.role,
        permissions: payload.permissions,
      }
    });
  } catch (error) {
    console.error("Error getting user info:", error);
    return NextResponse.json(
      { message: "خطا در دریافت اطلاعات کاربر" },
      { status: 401 }
    );
  }
} 