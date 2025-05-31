import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../../chatbot7/config/route";

export const runtime = 'nodejs';

// GET - Fetch transaction summary for a specific person
export async function GET(
  request: NextRequest,
  { params }: { params: { personId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can access accounting
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized. Only school admins can access accounting." },
        { status: 403 }
      );
    }

    const { personId } = params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!personId) {
      return NextResponse.json(
        { error: "Person ID is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Build query filter
    const query: Record<string, unknown> = { 
      schoolCode: user.schoolCode,
      personId 
    };
    
    // Date range filter
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) (query.transactionDate as Record<string, Date>).$gte = new Date(startDate);
      if (endDate) (query.transactionDate as Record<string, Date>).$lte = new Date(endDate);
    }
    
    // Get recent transactions
    const recentTransactions = await connection
      .collection("financial_transactions")
      .find(query)
      .sort({ transactionDate: -1 })
      .limit(10)
      .toArray();

    // Get summary statistics
    const summary = await connection
      .collection("financial_transactions")
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: "$transactionType",
            total: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    // Get category breakdown
    const categoryBreakdown = await connection
      .collection("financial_transactions")
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              category: "$category",
              transactionType: "$transactionType"
            },
            total: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: "$_id.category",
            debit: {
              $sum: {
                $cond: [
                  { $eq: ["$_id.transactionType", "debit"] },
                  "$total",
                  0
                ]
              }
            },
            credit: {
              $sum: {
                $cond: [
                  { $eq: ["$_id.transactionType", "credit"] },
                  "$total",
                  0
                ]
              }
            },
            debitCount: {
              $sum: {
                $cond: [
                  { $eq: ["$_id.transactionType", "debit"] },
                  "$count",
                  0
                ]
              }
            },
            creditCount: {
              $sum: {
                $cond: [
                  { $eq: ["$_id.transactionType", "credit"] },
                  "$count",
                  0
                ]
              }
            }
          }
        }
      ])
      .toArray();

    // Calculate totals
    const debitSummary = summary.find(s => s._id === "debit") || { total: 0, count: 0 };
    const creditSummary = summary.find(s => s._id === "credit") || { total: 0, count: 0 };
    
    const result = {
      personId,
      summary: {
        debitTotal: debitSummary.total,
        creditTotal: creditSummary.total,
        balance: creditSummary.total - debitSummary.total,
        debitCount: debitSummary.count,
        creditCount: creditSummary.count,
        totalTransactions: debitSummary.count + creditSummary.count
      },
      categoryBreakdown: categoryBreakdown.map(cat => ({
        category: cat._id || "دسته‌بندی نشده",
        debit: cat.debit,
        credit: cat.credit,
        balance: cat.credit - cat.debit,
        debitCount: cat.debitCount,
        creditCount: cat.creditCount
      })),
      recentTransactions
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching person summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch person summary" },
      { status: 500 }
    );
  }
} 