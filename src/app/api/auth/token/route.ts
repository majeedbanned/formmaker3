import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Set runtime to nodejs
export const runtime = 'nodejs';

/**
 * GET handler for retrieving the auth token from cookies
 * This allows client components to access the token without directly accessing cookies
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Authentication token not found" },
        { status: 401 }
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error retrieving auth token:", error);
    return NextResponse.json(
      { message: "Error retrieving authentication token" },
      { status: 500 }
    );
  }
} 