import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../chatbot7/config/route";
import fs from "fs";
import path from "path";

// GET endpoint to fetch ALL announcements for the logged-in user (including dismissed ones)
export async function GET(request: NextRequest) {
  try {
    console.log("📢 [API] /api/announcements/all - Starting request");
    
    const user = await getCurrentUser();
    console.log("📢 [API] Current user:", user ? { id: user.id, userType: user.userType, role: user.role } : "null");
    
    if (!user) {
      console.log("📢 [API] No user found - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read announcements from static JSON file
    const announcementsPath = path.join(
      process.cwd(),
      "public",
      "announcements.json"
    );
    console.log("📢 [API] Reading file from:", announcementsPath);
    
    const fileContent = fs.readFileSync(announcementsPath, "utf-8");
    const { announcements } = JSON.parse(fileContent);
    console.log("📢 [API] Total announcements in file:", announcements.length);

    // Filter announcements by user role and active status
    const userRole = user.userType || user.role;
    console.log("📢 [API] User role:", userRole);
    
    const applicableAnnouncements = announcements.filter(
      (ann: any) =>
        ann.active &&
        ann.roles &&
        ann.roles.includes(userRole)
    );
    console.log("📢 [API] Applicable announcements for role:", applicableAnnouncements.length);

    // Sort by creation date (newest first)
    applicableAnnouncements.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log("📢 [API] Returning ALL", applicableAnnouncements.length, "announcements (including dismissed)");
    return NextResponse.json({ announcements: applicableAnnouncements });
  } catch (error) {
    console.error("📢 [API] Error fetching all announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

