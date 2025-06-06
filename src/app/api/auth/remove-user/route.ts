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
    const activeUserId = cookieStore.get("active-user-id")?.value;
    
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

    // Find and remove the token for the specified user
    const validTokens = [];
    let removedUser: AuthPayload | null = null;
    let newActiveUser: AuthPayload | null = null;

    for (const token of tokens) {
      try {
        const payload = await verifyJWT(token) as unknown as AuthPayload;
        if (payload.userId === userId) {
          removedUser = payload;
          // Don't add this token to validTokens (effectively removing it)
        } else {
          validTokens.push(token);
          // Set the first remaining user as the new active user if needed
          if (activeUserId === userId && !newActiveUser) {
            newActiveUser = payload;
          }
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        // Remove invalid tokens
      }
    }

    if (!removedUser) {
      return NextResponse.json(
        { message: "User not found in authenticated sessions" },
        { status: 404 }
      );
    }

    // Update cookies
    if (validTokens.length > 0) {
      // Update multi-auth tokens with remaining valid tokens
      cookieStore.set("multi-auth-tokens", JSON.stringify(validTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      // Update active user if needed
      if (activeUserId === userId && newActiveUser) {
        cookieStore.set("active-user-id", newActiveUser.userId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        // Set the new active user's token as the primary auth token
        cookieStore.set("auth-token", validTokens[0], {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7, // 1 week
        });
      }
    } else {
      // No users left, remove all auth cookies
      cookieStore.delete("multi-auth-tokens");
      cookieStore.delete("active-user-id");
      cookieStore.delete("auth-token");
    }

    return NextResponse.json({
      message: "User removed successfully",
      removedUser: {
        id: removedUser.userId,
        name: removedUser.name,
        userType: removedUser.userType,
      },
      newActiveUser: newActiveUser ? {
        id: newActiveUser.userId,
        name: newActiveUser.name,
        userType: newActiveUser.userType,
      } : null,
      hasRemainingUsers: validTokens.length > 0,
    });
  } catch (error) {
    console.error("Remove user error:", error);
    return NextResponse.json(
      { message: "Failed to remove user" },
      { status: 500 }
    );
  }
} 