import { NextRequest, NextResponse } from "next/server";
import { getUsersFromAccess } from "@/utils/getUsersFromAccess";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {  recipients } = body;

    // if (!domain) {
    //   return NextResponse.json(
    //     { error: "Domain is required" },
    //     { status: 400 }
    //   );
    // }

    if (!recipients) {
      return NextResponse.json(
        { error: "Recipients data is required" },
        { status: 400 }
      );
    }
    const domain=req.headers.get("x-domain") || "localhost:3000";
    const users = await getUsersFromAccess(domain, { recipients });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error in exam/users API:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
} 