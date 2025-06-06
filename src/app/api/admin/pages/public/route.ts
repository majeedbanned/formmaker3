import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// GET - Fetch public pages (for navigation suggestions)
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_pages');
    
    // Only return active pages with basic info
    const pages = await collection
      .find({ isActive: true })
      .project({ _id: 1, title: 1, slug: 1 })
      .sort({ title: 1 })
      .toArray();

    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error('Error fetching public pages:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 