"use client";

import { useState, useEffect } from "react";

interface AccountingSummaryProps {
  refreshTrigger: number;
}

interface SummaryData {
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export default function AccountingSummary({
  refreshTrigger,
}: AccountingSummaryProps) {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    debitTotal: 0,
    creditTotal: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(false);

  // Fetch overall summary
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/accounting/transactions?limit=1");
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data.summary);
      }
    } catch (error) {
      console.error("Error fetching accounting summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [refreshTrigger]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        خلاصه کل حسابداری
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Debits */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">کل بدهی‌ها</p>
              <p className="text-red-800 text-2xl font-bold">
                {formatCurrency(summaryData.debitTotal)}
              </p>
            </div>
            <div className="p-3 bg-red-200 rounded-full">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Credits */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">کل اعتبارات</p>
              <p className="text-green-800 text-2xl font-bold">
                {formatCurrency(summaryData.creditTotal)}
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Net Balance */}
        <div
          className={`bg-gradient-to-br p-6 rounded-lg border ${
            summaryData.balance >= 0
              ? "from-blue-50 to-blue-100 border-blue-200"
              : "from-yellow-50 to-yellow-100 border-yellow-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  summaryData.balance >= 0 ? "text-blue-600" : "text-yellow-600"
                }`}
              >
                موجودی کل
              </p>
              <p
                className={`text-2xl font-bold ${
                  summaryData.balance >= 0 ? "text-blue-800" : "text-yellow-800"
                }`}
              >
                {formatCurrency(Math.abs(summaryData.balance))}
              </p>
              {summaryData.balance < 0 && (
                <p className="text-yellow-600 text-sm">(بدهکار کل)</p>
              )}
            </div>
            <div
              className={`p-3 rounded-full ${
                summaryData.balance >= 0 ? "bg-blue-200" : "bg-yellow-200"
              }`}
            >
              <svg
                className={`w-8 h-8 ${
                  summaryData.balance >= 0 ? "text-blue-600" : "text-yellow-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Status Indicator */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              summaryData.balance > 0
                ? "bg-blue-500"
                : summaryData.balance < 0
                ? "bg-yellow-500"
                : "bg-gray-500"
            }`}
          ></div>
          <span className="text-gray-700 font-medium">
            وضعیت مالی:
            {summaryData.balance > 0 && (
              <span className="text-blue-600 mr-2">مثبت (اعتبار)</span>
            )}
            {summaryData.balance < 0 && (
              <span className="text-yellow-600 mr-2">منفی (بدهی)</span>
            )}
            {summaryData.balance === 0 && (
              <span className="text-gray-600 mr-2">متعادل</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
