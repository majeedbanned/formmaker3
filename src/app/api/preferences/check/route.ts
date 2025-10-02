import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../chatbot7/config/route";
import { canStudentsChangeProfile } from "@/utils/preferences";

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد شوید" },
        { status: 401 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';

    // Check if students can change their profile
    const canChange = await canStudentsChangeProfile(user.schoolCode, domain);

    return NextResponse.json({
      success: true,
      canStudentsChangeProfile: canChange,
    });

  } catch (error) {
    console.error("Error checking student profile permissions:", error);
    return NextResponse.json(
      { error: "خطا در بررسی مجوزها" },
      { status: 500 }
    );
  }
}

