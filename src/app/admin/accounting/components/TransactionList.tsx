"use client";

import { useState, useEffect } from "react";

interface Person {
  _id: string;
  name: string;
  code: string;
  type: "student" | "teacher";
  classCode?: unknown[];
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

interface TransactionListProps {
  selectedPerson: Person;
  refreshTrigger: number;
  onRefresh: () => void;
}

export default function TransactionList({
  selectedPerson,
  refreshTrigger,
  onRefresh,
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({
    debitTotal: 0,
    creditTotal: 0,
    balance: 0,
  });

  // Category and payment method labels
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

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!selectedPerson) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        personId: selectedPerson._id,
        page: page.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/accounting/transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setTotalPages(data.pagination.pages);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchTransactions();
  }, [selectedPerson, page, refreshTrigger]);

  // Delete transaction
  const deleteTransaction = async (transactionId: string) => {
    if (!confirm("آیا از حذف این تراکنش اطمینان دارید؟")) return;

    try {
      const response = await fetch(
        `/api/accounting/transactions?id=${transactionId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        onRefresh();
      } else {
        alert("خطا در حذف تراکنش");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("خطا در ارتباط با سرور");
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR");
  };

  if (loading && page === 1) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Summary Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          تراکنش‌های {selectedPerson.name}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-600 text-sm font-medium">مجموع بدهی</div>
            <div className="text-red-800 text-lg font-bold">
              {formatCurrency(summary.debitTotal)}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 text-sm font-medium">
              مجموع اعتبار
            </div>
            <div className="text-green-800 text-lg font-bold">
              {formatCurrency(summary.creditTotal)}
            </div>
          </div>
          <div
            className={`p-4 rounded-lg ${
              summary.balance >= 0 ? "bg-blue-50" : "bg-yellow-50"
            }`}
          >
            <div
              className={`text-sm font-medium ${
                summary.balance >= 0 ? "text-blue-600" : "text-yellow-600"
              }`}
            >
              موجودی
            </div>
            <div
              className={`text-lg font-bold ${
                summary.balance >= 0 ? "text-blue-800" : "text-yellow-800"
              }`}
            >
              {formatCurrency(Math.abs(summary.balance))}
              {summary.balance < 0 && " (بدهکار)"}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="p-6">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              هیچ تراکنشی یافت نشد
            </h3>
            <p className="text-gray-500">
              تاکنون هیچ تراکنش مالی برای این شخص ثبت نشده است.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className={`p-4 rounded-lg border-2 ${
                  transaction.transactionType === "debit"
                    ? "border-red-200 bg-red-50"
                    : "border-green-200 bg-green-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          transaction.transactionType === "debit"
                            ? "bg-red-500"
                            : "bg-green-500"
                        }`}
                      ></div>
                      <span
                        className={`font-medium ${
                          transaction.transactionType === "debit"
                            ? "text-red-800"
                            : "text-green-800"
                        }`}
                      >
                        {transaction.transactionType === "debit"
                          ? "بدهکار"
                          : "بستانکار"}
                      </span>
                      <span
                        className={`text-xl font-bold ${
                          transaction.transactionType === "debit"
                            ? "text-red-900"
                            : "text-green-900"
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>

                    <div className="text-gray-800 font-medium mb-2 text-right">
                      {transaction.description}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="text-right">
                        <span className="font-medium">تاریخ:</span>
                        <div>{formatDate(transaction.transactionDate)}</div>
                      </div>
                      {transaction.category && (
                        <div className="text-right">
                          <span className="font-medium">دسته‌بندی:</span>
                          <div>
                            {categoryLabels[transaction.category] ||
                              transaction.category}
                          </div>
                        </div>
                      )}
                      {transaction.paymentMethod && (
                        <div className="text-right">
                          <span className="font-medium">روش پرداخت:</span>
                          <div>
                            {paymentMethodLabels[transaction.paymentMethod] ||
                              transaction.paymentMethod}
                          </div>
                        </div>
                      )}
                      {transaction.receiptNumber && (
                        <div className="text-right">
                          <span className="font-medium">شماره رسید:</span>
                          <div>{transaction.receiptNumber}</div>
                        </div>
                      )}
                    </div>

                    {transaction.notes && (
                      <div className="mt-2 text-sm text-gray-600 text-right">
                        <span className="font-medium">یادداشت:</span>{" "}
                        {transaction.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mr-4">
                    <button
                      onClick={() => deleteTransaction(transaction._id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      title="حذف تراکنش"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              قبلی
            </button>

            <span className="px-4 py-2 text-gray-600">
              صفحه {page} از {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              بعدی
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
