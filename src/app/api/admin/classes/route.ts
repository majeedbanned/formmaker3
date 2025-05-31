import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get("schoolCode");

    if (!schoolCode) {
      return NextResponse.json(
        { error: "School code is required" },
        { status: 400 }
      );
    }

    // Verify school code matches current user's school code
    if (schoolCode !== currentUser.schoolCode && currentUser.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized access to school data" },
        { status: 403 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    
    const classes = await connection
      .collection("classes")
      .find({ "data.schoolCode": schoolCode })
      .project({
        "_id": 1,
        "data.classCode": 1,
        "data.className": 1,
      })
      .toArray();

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
} 