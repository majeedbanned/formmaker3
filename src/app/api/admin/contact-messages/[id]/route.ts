import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "../../../auth/[...nextauth]/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

import { ObjectId } from "mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // const session = await getServerSession(authOptions);
    
    // if (!session?.user || (session.user as any).userType !== "school") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const domain = request.headers.get("x-domain");
    if (!domain) {
      return NextResponse.json({ error: "Domain header required" }, { status: 400 });
    }

    const { isRead } = await request.json();
    
    const db = await connectToDatabase(domain);
    const contactMessages = db.collection("contactMessages");
    
    const result = await contactMessages.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { isRead, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating contact message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const result = await contactMessages.deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 