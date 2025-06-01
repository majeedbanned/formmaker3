import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";

export const runtime = 'nodejs';

// Category and payment method labels for translation
const categoryLabels: Record<string, string> = {
  tuition: "شهریه",
  salary: "حقوق",
  bonus: "پاداش",
  fine: "جریمه",
  purchase: "خرید",
  maintenance: "تعمیر و نگهداری",
  transportation: "حمل و نقل",
  food: "غذا",
  book: "کتاب و لوازم",
  exam: "امتحان",
  activity: "فعالیت فوق برنامه",
  other: "سایر",
};

const paymentMethodLabels: Record<string, string> = {
  cash: "نقدی",
  bank: "بانکی",
  transfer: "حواله",
  check: "چک",
  card: "کارتی",
  scholarship: "بورسیه",
  other: "سایر",
};

// GET - Comprehensive accounting statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only school admins can access comprehensive statistics
    if (user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized. Only school admins can access statistics." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate || endDate) {
      dateFilter.transactionDate = {};
      if (startDate) (dateFilter.transactionDate as Record<string, Date>).$gte = new Date(startDate);
      if (endDate) (dateFilter.transactionDate as Record<string, Date>).$lte = new Date(endDate);
    }

    // Base query for all transactions
    const baseQuery = { 
      schoolCode: user.schoolCode,
      ...dateFilter
    };

    // 1. Financial Overview Stats
    const financialOverview = await connection
      .collection("financial_transactions")
      .aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: "$transactionType",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" }
          }
        }
      ])
      .toArray();

    const incomeData = financialOverview.find(f => f._id === "credit") || { total: 0, count: 0, avgAmount: 0 };
    const expenseData = financialOverview.find(f => f._id === "debit") || { total: 0, count: 0, avgAmount: 0 };

    // 2. Count students and teachers
    const [studentCount, teacherCount] = await Promise.all([
      connection.collection("students").countDocuments({ schoolCode: user.schoolCode }),
      connection.collection("teachers").countDocuments({ schoolCode: user.schoolCode })
    ]);

    // 3. Collection efficiency calculation
    const totalExpected = incomeData.total + expenseData.total;
    const collectionEfficiency = totalExpected > 0 ? (incomeData.total / totalExpected) * 100 : 0;

    const financialStats = {
      totalIncome: incomeData.total,
      totalExpenses: expenseData.total,
      netProfit: incomeData.total - expenseData.total,
      totalTransactions: incomeData.count + expenseData.count,
      totalStudents: studentCount,
      totalTeachers: teacherCount,
      averageTransactionAmount: (incomeData.avgAmount + expenseData.avgAmount) / 2 || 0,
      collectionEfficiency
    };

    // 4. Category Analysis
    const categoryStats = await connection
      .collection("financial_transactions")
      .aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: "$category",
            income: {
              $sum: {
                $cond: [{ $eq: ["$transactionType", "credit"] }, "$amount", 0]
              }
            },
            expenses: {
              $sum: {
                $cond: [{ $eq: ["$transactionType", "debit"] }, "$amount", 0]
              }
            },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { income: -1 } }
      ])
      .toArray();

    const translatedCategoryStats = categoryStats.map(cat => ({
      category: categoryLabels[cat._id] || cat._id || "دسته‌بندی نشده",
      income: cat.income,
      expenses: cat.expenses,
      transactionCount: cat.transactionCount
    }));

    // 5. Monthly Trends
    const monthlyTrends = await connection
      .collection("financial_transactions")
      .aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: {
              year: { $year: "$transactionDate" },
              month: { $month: "$transactionDate" }
            },
            income: {
              $sum: {
                $cond: [{ $eq: ["$transactionType", "credit"] }, "$amount", 0]
              }
            },
            expenses: {
              $sum: {
                $cond: [{ $eq: ["$transactionType", "debit"] }, "$amount", 0]
              }
            },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ])
      .toArray();

    const persianMonths = [
      "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
      "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];

    const formattedMonthlyTrends = monthlyTrends.map(trend => ({
      month: `${persianMonths[trend._id.month - 1]} ${trend._id.year}`,
      income: trend.income,
      expenses: trend.expenses,
      netFlow: trend.income - trend.expenses,
      transactionCount: trend.transactionCount
    }));

    // 6. Payment Method Analysis
    const paymentMethodStats = await connection
      .collection("financial_transactions")
      .aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: "$paymentMethod",
            amount: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        },
        { $sort: { amount: -1 } }
      ])
      .toArray();

    const totalPaymentAmount = paymentMethodStats.reduce((sum, p) => sum + p.amount, 0);
    const translatedPaymentMethodStats = paymentMethodStats.map(method => ({
      method: paymentMethodLabels[method._id] || method._id || "نامشخص",
      amount: method.amount,
      count: method.count,
      percentage: totalPaymentAmount > 0 ? (method.amount / totalPaymentAmount) * 100 : 0
    }));

    // 7. Outstanding Balances (negative balances)
    const outstandingBalances = await connection
      .collection("financial_transactions")
      .aggregate([
        { $match: { schoolCode: user.schoolCode } },
        {
          $group: {
            _id: {
              personId: "$personId",
              personName: "$personName",
              personType: "$personType"
            },
            balance: {
              $sum: {
                $cond: [
                  { $eq: ["$transactionType", "credit"] },
                  "$amount",
                  { $multiply: ["$amount", -1] }
                ]
              }
            },
            lastTransaction: { $max: "$transactionDate" }
          }
        },
        { $match: { balance: { $lt: 0 } } },
        { $sort: { balance: 1 } },
        { $limit: 50 }
      ])
      .toArray();

    const formattedOutstandingBalances = outstandingBalances.map(balance => {
      const daysPastDue = Math.floor((Date.now() - new Date(balance.lastTransaction).getTime()) / (1000 * 60 * 60 * 24));
      return {
        personId: balance._id.personId,
        personName: balance._id.personName,
        personType: balance._id.personType,
        balance: balance.balance,
        lastPayment: balance.lastTransaction,
        daysPastDue
      };
    });

    // 8. Class Financial Analysis
    const classFinancials = await connection
      .collection("classes")
      .aggregate([
        { $match: { schoolCode: user.schoolCode } },
        {
          $lookup: {
            from: "financial_transactions",
            let: { students: "$students" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$schoolCode", user.schoolCode] },
                      { $eq: ["$personType", "student"] },
                      { $in: ["$personId", { $map: { input: "$$students", as: "s", in: { $toString: "$$s._id" } } }] }
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  totalCollected: {
                    $sum: {
                      $cond: [{ $eq: ["$transactionType", "credit"] }, "$amount", 0]
                    }
                  },
                  totalOwed: {
                    $sum: {
                      $cond: [{ $eq: ["$transactionType", "debit"] }, "$amount", 0]
                    }
                  }
                }
              }
            ],
            as: "financials"
          }
        },
        {
          $project: {
            classCode: "$classCode",
            className: "$className",
            studentCount: { $size: "$students" },
            totalCollected: { $ifNull: [{ $arrayElemAt: ["$financials.totalCollected", 0] }, 0] },
            totalOwed: { $ifNull: [{ $arrayElemAt: ["$financials.totalOwed", 0] }, 0] }
          }
        },
        {
          $addFields: {
            totalOutstanding: { $subtract: ["$totalOwed", "$totalCollected"] },
            collectionRate: {
              $cond: [
                { $gt: ["$totalOwed", 0] },
                { $multiply: [{ $divide: ["$totalCollected", "$totalOwed"] }, 100] },
                100
              ]
            }
          }
        }
      ])
      .toArray();

    return NextResponse.json({
      financialStats,
      categoryStats: translatedCategoryStats,
      monthlyTrends: formattedMonthlyTrends,
      paymentMethodStats: translatedPaymentMethodStats,
      outstandingBalances: formattedOutstandingBalances,
      classFinancials
    });

  } catch (error) {
    console.error("Error fetching accounting statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounting statistics" },
      { status: 500 }
    );
  }
} 