import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";
import { getSmsRecordModel } from "../models/smsRecord";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    const SmsRecordModel = getSmsRecordModel(connection);
    
    // Get SMS records for this user
    const records = await SmsRecordModel.find({ userId: user.username })
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalCount = await SmsRecordModel.countDocuments({ userId: user.username });
    
    return NextResponse.json({ 
      records,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching SMS records:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS records" },
      { status: 500 }
    );
  }
} 