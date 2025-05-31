"use client";

import { useState, useEffect } from "react";

interface Person {
  _id: string;
  name: string;
  code: string;
  type: "student" | "teacher";
  classCode?: unknown[];
}

interface PersonSummaryProps {
  person: Person;
  refreshTrigger: number;
}

interface SummaryData {
  summary: {
    debitTotal: number;
    creditTotal: number;
    balance: number;
    debitCount: number;
    creditCount: number;
    totalTransactions: number;
  };
  categoryBreakdown: {
    category: string;
    debit: number;
    credit: number;
    balance: number;
    debitCount: number;
    creditCount: number;
  }[];
}

export default function PersonSummary({
  person,
  refreshTrigger,
}: PersonSummaryProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  // Category labels
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

  // Fetch person summary
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/accounting/person-summary/${person._id}`
      );
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
      }
    } catch (error) {
      console.error("Error fetching person summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [person, refreshTrigger]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">خلاصه مالی</h3>
        <p className="text-gray-500">خطا در بارگذاری اطلاعات</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">خلاصه مالی</h3>

      {/* Overall Summary */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
          <span className="text-red-700 font-medium">کل بدهی:</span>
          <span className="text-red-800 font-bold">
            {formatCurrency(summaryData.summary.debitTotal)}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <span className="text-green-700 font-medium">کل اعتبار:</span>
          <span className="text-green-800 font-bold">
            {formatCurrency(summaryData.summary.creditTotal)}
          </span>
        </div>

        <div
          className={`flex justify-between items-center p-3 rounded-lg ${
            summaryData.summary.balance >= 0 ? "bg-blue-50" : "bg-yellow-50"
          }`}
        >
          <span
            className={`font-medium ${
              summaryData.summary.balance >= 0
                ? "text-blue-700"
                : "text-yellow-700"
            }`}
          >
            موجودی:
          </span>
          <span
            className={`font-bold ${
              summaryData.summary.balance >= 0
                ? "text-blue-800"
                : "text-yellow-800"
            }`}
          >
            {formatCurrency(Math.abs(summaryData.summary.balance))}
            {summaryData.summary.balance < 0 && " (بدهکار)"}
          </span>
        </div>
      </div>

      {/* Transaction Counts */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">آمار تراکنش‌ها:</div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-gray-900">
              {summaryData.summary.totalTransactions}
            </div>
            <div className="text-gray-600">کل تراکنش</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-red-600">
              {summaryData.summary.debitCount}
            </div>
            <div className="text-gray-600">بدهکار</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-600">
              {summaryData.summary.creditCount}
            </div>
            <div className="text-gray-600">بستانکار</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {summaryData.categoryBreakdown.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            تفکیک بر اساس دسته‌بندی:
          </h4>
          <div className="space-y-2">
            {summaryData.categoryBreakdown.map((category) => (
              <div
                key={category.category}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-800">
                    {categoryLabels[category.category] || category.category}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      category.balance >= 0
                        ? "text-blue-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(category.balance))}
                    {category.balance < 0 && " (بدهکار)"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <span className="text-red-600">بدهی:</span>{" "}
                    {formatCurrency(category.debit)}
                  </div>
                  <div>
                    <span className="text-green-600">اعتبار:</span>{" "}
                    {formatCurrency(category.credit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
