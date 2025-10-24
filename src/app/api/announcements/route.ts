import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../chatbot7/config/route";
import fs from "fs";
import path from "path";

// GET endpoint to fetch unread announcements for the logged-in user
export async function GET(request: NextRequest) {
  try {
    console.log("📢 [API] /api/announcements - Starting request");
    
    const user = await getCurrentUser();
    console.log("📢 [API] Current user:", user ? { id: user.id, userType: user.userType, role: user.role } : "null");
    
    if (!user) {
      console.log("📢 [API] No user found - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    console.log("📢 [API] Domain:", domain);

    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);

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

    if (applicableAnnouncements.length === 0) {
      console.log("📢 [API] No applicable announcements - returning empty array");
      return NextResponse.json({ announcements: [] });
    }

    // Get user's dismissed announcements from database
    const userPreferences = await connection
      .collection("user_announcement_preferences")
      .findOne({
        userId: user.id,
      });

    const dismissedAnnouncements = userPreferences?.dismissedAnnouncements || [];
    console.log("📢 [API] Dismissed announcements:", dismissedAnnouncements);

    // Filter out dismissed announcements
    const unreadAnnouncements = applicableAnnouncements.filter(
      (ann: any) => !dismissedAnnouncements.includes(ann.id)
    );
    console.log("📢 [API] Unread announcements:", unreadAnnouncements.length);

    // Sort by creation date (newest first)
    unreadAnnouncements.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log("📢 [API] Returning", unreadAnnouncements.length, "announcements");
    return NextResponse.json({ announcements: unreadAnnouncements });
  } catch (error) {
    console.error("📢 [API] Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

