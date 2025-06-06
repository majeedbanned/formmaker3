import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";

interface AuthPayload {
  userId: string;
  userType: 'school' | 'teacher' | 'student';
  schoolCode: string;
  username: string;
  name: string;
  domain: string;
  role: string;
  permissions: Array<{systems: string, access: string[]}>;
  classCode?: Array<{value: string, label: string}>;
  groups?: Array<{value: string, label: string}>;
  maghta?: string;
  grade?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const multiTokens = cookieStore.get("multi-auth-tokens")?.value;
    
    if (!multiTokens) {
      return NextResponse.json(
        { message: "No multi-auth tokens found" },
        { status: 401 }
      );
    }

    let tokens: string[] = [];
    try {
      tokens = JSON.parse(multiTokens);
    } catch (error) {
      console.error("Error parsing multi-auth tokens:", error);
      return NextResponse.json(
        { message: "Invalid token format" },
        { status: 400 }
      );
    }

    // Find the token for the requested user
    let targetToken: string | null = null;
    let targetUser: AuthPayload | null = null;

    for (const token of tokens) {
      try {
        const payload = await verifyJWT(token) as AuthPayload;
        if (payload.userId === userId) {
          targetToken = token;
          targetUser = payload;
          break;
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        // Remove invalid token from the list
        tokens = tokens.filter(t => t !== token);
      }
    }

    if (!targetToken || !targetUser) {
      return NextResponse.json(
        { message: "User not found in authenticated sessions" },
        { status: 404 }
      );
    }

    // Update cookies to switch to the target user
    cookieStore.set("auth-token", targetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    cookieStore.set("active-user-id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Update the multi-auth tokens (remove invalid ones)
    cookieStore.set("multi-auth-tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    const user = {
      id: targetUser.userId,
      userType: targetUser.userType,
      schoolCode: targetUser.schoolCode,
      username: targetUser.username,
      name: targetUser.name,
      domain: targetUser.domain,
      role: targetUser.role,
      permissions: targetUser.permissions,
      classCode: targetUser.classCode || [],
      groups: targetUser.groups || [],
      maghta: targetUser.maghta,
      grade: targetUser.grade,
    };

    return NextResponse.json({
      message: "User switched successfully",
      user,
    });
  } catch (error) {
    console.error("Switch user error:", error);
    return NextResponse.json(
      { message: "Failed to switch user" },
      { status: 500 }
    );
  }
} 