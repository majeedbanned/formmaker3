import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const multiTokens = cookieStore.get("multi-auth-tokens")?.value;
    const activeUserId = cookieStore.get("active-user-id")?.value;
    
    if (!multiTokens) {
      return NextResponse.json({
        users: [],
        activeUser: null,
      });
    }

    let tokens: string[] = [];
    try {
      tokens = JSON.parse(multiTokens);
    } catch (error) {
      console.error("Error parsing multi-auth tokens:", error);
      return NextResponse.json({
        users: [],
        activeUser: null,
      });
    }

    const users = [];
    const validTokens = [];
    let activeUser = null;

    for (const token of tokens) {
      try {
        const payload = await verifyJWT(token) as AuthPayload;
        
        const user = {
          id: payload.userId,
          userType: payload.userType,
          schoolCode: payload.schoolCode,
          username: payload.username,
          name: payload.name,
          domain: payload.domain,
          role: payload.role,
          permissions: payload.permissions,
          classCode: payload.classCode || [],
          groups: payload.groups || [],
          maghta: payload.maghta,
          grade: payload.grade,
        };

        users.push(user);
        validTokens.push(token);

        // Set active user
        if (activeUserId === payload.userId) {
          activeUser = user;
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        // Skip invalid tokens
      }
    }

    // If no active user is set but we have users, set the first one as active
    if (!activeUser && users.length > 0) {
      activeUser = users[0];
      
      // Update the active user cookie
      cookieStore.set("active-user-id", activeUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
    }

    // Update the multi-auth tokens to remove invalid ones
    if (validTokens.length !== tokens.length) {
      cookieStore.set("multi-auth-tokens", JSON.stringify(validTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
    }

    return NextResponse.json({
      users,
      activeUser,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { message: "Failed to get users" },
      { status: 500 }
    );
  }
} 