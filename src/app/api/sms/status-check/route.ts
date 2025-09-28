import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school users can check SMS status
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Only school administrators can check SMS status" },
        { status: 403 }
      );
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Check if school has SMS credentials
    const school = await connection.collection("schools").findOne({
      "data.schoolCode": user.schoolCode
    });

    if (!school || !school.data) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    const smsUsername = school.data.SMS_USERNAME;
    const smsPassword = school.data.SMS_PASSWORD;
    
    const isSmsEnabled = !!(smsUsername && smsPassword && smsUsername.trim() !== "" && smsPassword.trim() !== "");

    return NextResponse.json({ 
      success: true,
      isSmsEnabled,
      schoolName: school.data.schoolName || "نامشخص"
    });

  } catch (error) {
    console.error("Error checking SMS status:", error);
    return NextResponse.json(
      { error: "Failed to check SMS status" },
      { status: 500 }
    );
  }
}
