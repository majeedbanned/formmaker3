import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { getNotificationRecordModel } from "../models/notificationRecord";
import { logger } from "@/lib/logger";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || 'localhost:3000';
    
    logger.info(`[NotificationHistory][${domain}] Fetching notification history`);
    
    // Get the authenticated user
    const user = await getCurrentUser();
    if (!user) {
      logger.warn(`[NotificationHistory][${domain}] Unauthorized access attempt`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    logger.info(`[NotificationHistory][${domain}] User: ${user.username}, School: ${user.schoolCode}`);

    // Connect to database
    const connection = await connectToDatabase(domain);
    const NotificationRecordModel = getNotificationRecordModel(connection);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status'); // 'sent', 'failed', 'pending', or null for all

    // Build query
    const query: any = {
      schoolCode: user.schoolCode,
    };

    if (status && ['sent', 'failed', 'pending'].includes(status)) {
      query.status = status;
    }

    logger.info(`[NotificationHistory][${domain}] Query:`, query, `Limit: ${limit}, Skip: ${skip}`);

    // Fetch notification records (sorted by most recent first)
    // Don't return pushTokens to client for privacy
    const records = await NotificationRecordModel
      .find(query)
      .select('-pushTokens -expoResponse') // Exclude pushTokens and expoResponse from response
      .sort({ sentAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();

    // Get total count for pagination
    const total = await NotificationRecordModel.countDocuments(query);

    logger.info(`[NotificationHistory][${domain}] Found ${records.length} records out of ${total} total`);

    return NextResponse.json({
      records,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + records.length < total,
      }
    }, { status: 200 });
    
  } catch (error) {
    logger.error("[NotificationHistory] Error fetching notification history:", error);
    
    return NextResponse.json(
      { message: "خطا در بارگذاری تاریخچه اعلان‌ها" },
      { status: 500 }
    );
  }
}


