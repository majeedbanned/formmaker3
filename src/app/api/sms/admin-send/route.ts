import { NextResponse } from "next/server";
import { smsApi } from "@/lib/smsService";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

// This endpoint sends SMS using hardcoded admin credentials
// Used for system notifications like feedback alerts
export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get request body
    const { fromNumber, toNumbers, message } = await request.json();
    
    // Validate required fields
    if (!fromNumber || !toNumbers || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Ensure toNumbers is an array
    const recipients = Array.isArray(toNumbers) ? toNumbers : [toNumbers];
    
    // Send SMS using admin credentials
    const messageIds = await smsApi.sendAdminSMS(fromNumber, recipients, message);
    
    return NextResponse.json({ 
      success: true,
      messageIds,
      message: 'SMS sent successfully using admin credentials'
    });
  } catch (error) {
    console.error("Error sending admin SMS:", error);
    return NextResponse.json(
      { 
        error: "Failed to send SMS",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

