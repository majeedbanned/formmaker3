import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  
  // Remove the auth token cookie
  cookieStore.delete("auth-token");

  return NextResponse.json({ message: "خروج موفقیت‌آمیز" });
} 