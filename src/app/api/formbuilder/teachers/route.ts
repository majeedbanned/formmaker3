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
    
    // Filter teachers based on schoolCode if user is not admin
    const filter = user.userType === 'admin' ? {} : { "data.schoolCode": user.schoolCode };
    
    // Fetch teachers
    const teachers = await connection
      .collection("teachers")
      .find(filter)
      .project({
        "_id": 1,
        "data.teacherName": 1,
        "data.teacherFamily": 1,
        "data.teacherCode": 1,
        "data.schoolCode": 1
      })
      .toArray();

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
} 