import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // Get user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school users can access SMS history
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Only school administrators can access SMS history" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const section = searchParams.get('section'); // "absent" or "late"
    const status = searchParams.get('status'); // "success" or "failed"
    const search = searchParams.get('search'); // search in message content
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Build query
    const query: any = {
      schoolCode: user.schoolCode
    };

    // Add filters
    if (section) {
      query.section = section;
    }

    if (status) {
      query["smsResult.success"] = status === "success";
    }

    if (search) {
      query.message = { $regex: search, $options: "i" };
    }

    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) {
        query.sentAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.sentAt.$lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const totalCount = await connection.collection("sms_responses").countDocuments(query);

    // Fetch SMS history with pagination
    const smsHistory = await connection.collection("sms_responses")
      .find(query)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Format the response
    const formattedHistory = smsHistory.map(record => ({
      id: record._id,
      messageId: record.messageId,
      fromNumber: record.fromNumber,
      toNumbers: record.toNumbers,
      message: record.message,
      recipientCount: record.recipientCount,
      section: record.section,
      smsResult: record.smsResult,
      sentAt: record.sentAt,
      status: record.smsResult?.success ? 'success' : 'failed'
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({ 
      success: true,
      history: formattedHistory,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error("Error fetching SMS history:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS history" },
      { status: 500 }
    );
  }
}
