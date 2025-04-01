import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    logger.info("Login request received", { domain });
    
    const body = await request.json();
    const { userType, schoolCode, username, password } = body;

    const { token, user } = await authenticateUser(
      domain,
      userType,
      schoolCode,
      username,
      password
    );

    // Set cookie with token
    const response = NextResponse.json({
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
    }, { status: 200 });

    // Set the cookie in the response
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    });

    logger.info("Auth token cookie set successfully", { domain });
    return response;

  } catch (error) {
    logger.error("Login error:", error);
    if (error instanceof Error) {
      logger.error("Error details:", {
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