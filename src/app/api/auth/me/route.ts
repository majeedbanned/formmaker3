import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";
import { JWTPayload } from "jose";
import { getDynamicModel } from "@/lib/mongodb";
import type { Model } from "mongoose";

// Set runtime to nodejs
export const runtime = 'nodejs';

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

interface School {
  data: Map<string, unknown>;
  _id: string;
}

export async function GET() {
  try {
    console.log("GET /api/auth/me request received");
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      console.log("No auth token found in cookies");
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }
    console.log("Auth token found in cookies");

    const payload = await verifyJWT(token) as AuthPayload;
    // console.log("JWT verified successfully. Payload:", {
    //   userId: payload.userId,
    //   userType: payload.userType,
    //   schoolCode: payload.schoolCode,
    //   username: payload.username
    // });
    
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
      console.log("User is a school, adding maghta and grade from payload");
      user.maghta = payload.maghta;
      user.grade = payload.grade;
    } 
    // For teachers and students, fetch maghta from their school
    else if (payload.userType === 'teacher' || payload.userType === 'student') {
      console.log(`User is a ${payload.userType}, fetching maghta from school`);
      const SchoolModel = getDynamicModel('schools') as Model<School>;
      const school = await SchoolModel.findOne({ 'data.schoolCode': payload.schoolCode });
      
      if (school) {
        console.log("School found, adding maghta from school data");
        user.maghta = school.data.get('maghta') as string;
      } else {
        console.log("No school found for user");
      }
    }
    
    console.log("Sending user data:", {
      id: user.id,
      userType: user.userType,
      schoolCode: user.schoolCode,
      username: user.username,
      maghta: user.maghta,
      grade: user.grade
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { message: "خطا در دریافت اطلاعات کاربر" },
      { status: 401 }
    );
  }
} 