import { NextResponse } from "next/server";
import { smsApi } from "@/lib/smsService";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get account credit
    const credit = await smsApi.getCredit();
    
    return NextResponse.json({ credit: credit || '0' });
  } catch (error) {
    console.error("Error fetching SMS credit:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS credit" },
      { status: 500 }
    );
  }
} 