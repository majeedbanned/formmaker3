import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

interface Permission {
  type: "class" | "group" | "teacher" | "student";
  code: string;
  name: string;
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school and teacher users can manage permissions
    if (currentUser.userType === "student") {
      return NextResponse.json(
        { error: "Students cannot manage folder permissions" },
        { status: 403 }
      );
    }

    const { id, permissions }: { id: string; permissions: Permission[] } = await request.json();

    if (!id || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Folder ID and permissions array are required" },
        { status: 400 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);

    // Verify folder exists and user has permission to modify it
    const folder = await connection.collection("Folder").findOne({ _id: new ObjectId(id) });
    
    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // Verify user owns the folder or is a school admin
    if (folder.username !== currentUser.username && currentUser.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized to modify this folder's permissions" },
        { status: 403 }
      );
    }

    // Update folder permissions
    const result = await connection.collection("Folder").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          permissions: permissions,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Folder permissions updated successfully",
      permissions: permissions
    });
  } catch (error) {
    console.error("Error updating folder permissions:", error);
    return NextResponse.json(
      { error: "Failed to update folder permissions" },
      { status: 500 }
    );
  }
} 