import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { connectToDatabase } from  "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);
    
    // if (!session?.user || (session.user as any).userType !== "school") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const domain = request.headers.get("x-domain");
    if (!domain) {
      return NextResponse.json({ error: "Domain header required" }, { status: 400 });
    }

    const db = await connectToDatabase(domain);
    const contactMessages = db.collection("contactMessages");
    
    const messages = await contactMessages
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 