"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Calendar,
} from "lucide-react";

interface StudentAccountingTabProps {
  studentId: string;
}

interface Transaction {
  _id: string;
  transactionType: "debit" | "credit";
  amount: number;
  description: string;
  paymentMethod: string;
  category: string;
  receiptNumber: string;
  referenceNumber: string;
  transactionDate: string;
  notes: string;
  createdAt: string;
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

export default function StudentAccountingTab({
  studentId,
}: StudentAccountingTabProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const paymentMethodLabels: Record<string, string> = {
    cash: "نقدی",
    bank: "بانکی",
    transfer: "حواله",
    check: "چک",
    card: "کارتی",
    scholarship: "بورسیه",
    other: "سایر",
  };

  // Fetch student accounting summary
  const fetchSummary = async () => {
    try {
      const response = await fetch(
        `/api/accounting/person-summary/${studentId}`
      );
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
      }
    } catch (error) {
      console.error("Error fetching student summary:", error);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        personId: studentId,
        page: page.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/accounting/transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, [studentId, page]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR");
  };

  if (loading && !summaryData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingDown className="h-4 w-4 ml-2 text-red-500" />
              کل بدهی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryData
                ? formatCurrency(summaryData.summary.debitTotal)
                : "0 ریال"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summaryData ? summaryData.summary.debitCount : 0} تراکنش
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 ml-2 text-green-500" />
              کل اعتبار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryData
                ? formatCurrency(summaryData.summary.creditTotal)
                : "0 ریال"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summaryData ? summaryData.summary.creditCount : 0} تراکنش
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 ml-2 text-blue-500" />
              موجودی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summaryData && summaryData.summary.balance >= 0
                  ? "text-blue-600"
                  : "text-yellow-600"
              }`}
            >
              {summaryData
                ? formatCurrency(Math.abs(summaryData.summary.balance))
                : "0 ریال"}
              {summaryData && summaryData.summary.balance < 0 && (
                <span className="text-sm text-yellow-600 mr-1">(بدهکار)</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summaryData ? summaryData.summary.totalTransactions : 0} کل
              تراکنش
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {summaryData && summaryData.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 ml-2 text-purple-600" />
              تفکیک بر اساس دسته‌بندی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summaryData.categoryBreakdown.map((category) => (
                <div
                  key={category.category}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium text-gray-800">
                    {categoryLabels[category.category] || category.category}
                  </span>
                  <div className="text-left">
                    <div
                      className={`text-sm font-medium ${
                        category.balance >= 0
                          ? "text-blue-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(category.balance))}
                      {category.balance < 0 && " (بدهکار)"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.debitCount + category.creditCount} تراکنش
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="h-5 w-5 ml-2 text-green-600" />
            تراکنش‌های اخیر
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-500 border-t-transparent"></div>
              <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">هیچ تراکنش مالی ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.transactionType === "debit"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {transaction.transactionType === "debit"
                            ? "بدهکار"
                            : "بستانکار"}
                        </span>
                        <span className="text-sm text-gray-500">
                          {categoryLabels[transaction.category] ||
                            transaction.category}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900">
                        {transaction.description}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {transaction.notes}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          transaction.transactionType === "debit"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        <Calendar className="h-3 w-3 inline ml-1" />
                        {formatDate(transaction.transactionDate)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-3 pt-3 border-t">
                    <div>
                      <span className="font-medium">روش پرداخت:</span>{" "}
                      {paymentMethodLabels[transaction.paymentMethod] ||
                        transaction.paymentMethod}
                    </div>
                    {transaction.receiptNumber && (
                      <div>
                        <span className="font-medium">شماره رسید:</span>{" "}
                        {transaction.receiptNumber}
                      </div>
                    )}
                    {transaction.referenceNumber && (
                      <div>
                        <span className="font-medium">شماره مرجع:</span>{" "}
                        {transaction.referenceNumber}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 space-x-reverse mt-6">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 text-sm bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    قبلی
                  </button>
                  <span className="text-sm text-gray-600">
                    صفحه {page} از {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-2 text-sm bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    بعدی
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
