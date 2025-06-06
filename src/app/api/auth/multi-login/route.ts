import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { userType, schoolCode, username, password } = await request.json();

    // Validate required fields
    if (!userType || !schoolCode || !username || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Get the current domain
    const domain = request.headers.get("host") || "localhost:3000";

    // Authenticate user
    const authResult = await authenticateUser(
      domain,
      userType,
      schoolCode,
      username,
      password
    );

    if (!authResult) {
      return NextResponse.json(
        { message: "Authentication failed" },
        { status: 401 }
      );
    }

    const { token, user } = authResult;

    // Get existing tokens from cookies
    const cookieStore = await cookies();
    const existingTokens = cookieStore.get("multi-auth-tokens")?.value;
    let tokens: string[] = [];
    
    if (existingTokens) {
      try {
        tokens = JSON.parse(existingTokens);
      } catch (error) {
        console.error("Error parsing existing tokens:", error);
        tokens = [];
      }
    }

    // Add new token to the list (if not already present)
    if (!tokens.includes(token)) {
      tokens.push(token);
    }

    // Set the new token as the primary auth token
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Store all tokens for multi-user switching
    cookieStore.set("multi-auth-tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Store the active user ID
    cookieStore.set("active-user-id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return NextResponse.json({
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    console.error("Multi-login error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "خطا در ورود به سیستم" },
      { status: 500 }
    );
  }
} 