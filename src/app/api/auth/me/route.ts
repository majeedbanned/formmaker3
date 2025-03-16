import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { JWTPayload } from "jose";

interface Permission {
  systems: string;
  access: string[];
}

interface User {
  id: string;
  userType: 'school' | 'teacher' | 'student';
  schoolCode: string;
  username: string;
  name: string;
  role: string;
  permissions: Permission[];
  maghta?: string;
  grade?: string;
}

interface AuthPayload extends JWTPayload {
  userId: string;
  userType: 'school' | 'teacher' | 'student';
  schoolCode: string;
  username: string;
  name: string;
  role: string;
  permissions: Permission[];
  maghta?: string;
  grade?: string;
}

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

    const payload = await verifyAuth(token) as AuthPayload;
    
    const user: User = {
      id: payload.userId,
      userType: payload.userType,
      schoolCode: payload.schoolCode,
      username: payload.username,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions,
    };

    // Add maghta and grade for school users
    if (payload.userType === 'school') {
      user.maghta = payload.maghta;
      user.grade = payload.grade;
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error getting user info:", error);
    return NextResponse.json(
      { message: "خطا در دریافت اطلاعات کاربر" },
      { status: 401 }
    );
  }
} 