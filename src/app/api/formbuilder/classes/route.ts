import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Filter classes based on schoolCode if user is not admin
    const filter = user.userType === 'admin' ? {} : { "data.schoolCode": user.schoolCode };
    
    // Fetch classes
    const classes = await connection
      .collection("classes")
      .find(filter)
      .project({
        "_id": 1,
        "data.className": 1,
        "data.classCode": 1,
        "data.Grade": 1,
        "data.major": 1,
        "data.schoolCode": 1
      })
      .toArray();

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
} 