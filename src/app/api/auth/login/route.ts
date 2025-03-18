import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateUser } from "@/lib/auth";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    console.log("Login request received");
    const body = await request.json();
    const { userType, schoolCode, username, password } = body;
    console.log("Login attempt for:", { userType, schoolCode, username });

    const { token, user } = await authenticateUser(userType, schoolCode, username, password);
    console.log("Authentication successful for user:", { 
      id: user.id, 
      userType: user.userType, 
      schoolCode: user.schoolCode, 
      username: user.username 
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });
    console.log("Auth token cookie set successfully");

    const response = {
      message: "ورود موفقیت‌آمیز",
      user: {
        id: user.id,
        userType: user.userType,
        schoolCode: user.schoolCode,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      }
    };
    console.log("Sending successful response:", response);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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