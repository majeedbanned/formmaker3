"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";

interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalTransactions: number;
  totalStudents: number;
  totalTeachers: number;
  averageTransactionAmount: number;
  collectionEfficiency: number;
}

interface CategoryStats {
  category: string;
  income: number;
  expenses: number;
  transactionCount: number;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  netFlow: number;
  transactionCount: number;
}

interface PaymentMethodStats {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

interface OutstandingBalance {
  personId: string;
  personName: string;
  personType: "student" | "teacher";
  balance: number;
  lastPayment: string;
  daysPastDue: number;
}

interface ClassFinancial {
  classCode: string;
  className: string;
  studentCount: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
}

export default function AccountantReportPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new DateObject().subtract(30, "days"),
    end: new DateObject(),
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Data states
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(
    null
  );
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [paymentMethodStats, setPaymentMethodStats] = useState<
    PaymentMethodStats[]
  >([]);
  const [outstandingBalances, setOutstandingBalances] = useState<
    OutstandingBalance[]
  >([]);
  const [classFinancials, setClassFinancials] = useState<ClassFinancial[]>([]);

  // Fetch all statistics
  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start.toDate().toISOString(),
        endDate: dateRange.end.toDate().toISOString(),
      });

      const response = await fetch(`/api/accounting/statistics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFinancialStats(data.financialStats);
        setCategoryStats(data.categoryStats);
        setMonthlyTrends(data.monthlyTrends);
        setPaymentMethodStats(data.paymentMethodStats);
        setOutstandingBalances(data.outstandingBalances);
        setClassFinancials(data.classFinancials);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userType === "school") {
      fetchStatistics();
    }
  }, [user, dateRange, refreshTrigger]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return Math.round(value * 100) / 100 + "%";
  };

  // Export functionality
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    const csv = data.map((row) => Object.values(row).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!user || user.userType !== "school") {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50"
        dir="rtl"
      >
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">دسترسی محدود</h1>
          <p className="text-gray-600">
            تنها مدیران مدرسه می‌توانند به گزارش‌های حسابداری دسترسی داشته
            باشند.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                گزارش‌های حسابداری
              </h1>
              <p className="text-gray-600">تحلیل‌های مالی و آماری جامع مدرسه</p>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  از تاریخ:
                </label>
                <DatePicker
                  value={dateRange.start}
                  onChange={(date) =>
                    setDateRange((prev) => ({
                      ...prev,
                      start: date as DateObject,
                    }))
                  }
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  render={(value, openCalendar) => (
                    <input
                      value={value}
                      onClick={openCalendar}
                      readOnly
                      className="px-3 py-2 border border-gray-300 rounded-lg cursor-pointer text-right"
                    />
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  تا تاریخ:
                </label>
                <DatePicker
                  value={dateRange.end}
                  onChange={(date) =>
                    setDateRange((prev) => ({
                      ...prev,
                      end: date as DateObject,
                    }))
                  }
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  render={(value, openCalendar) => (
                    <input
                      value={value}
                      onClick={openCalendar}
                      readOnly
                      className="px-3 py-2 border border-gray-300 rounded-lg cursor-pointer text-right"
                    />
                  )}
                />
              </div>
              <button
                onClick={() => setRefreshTrigger((prev) => prev + 1)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                بروزرسانی
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 space-x-reverse mt-6 border-b border-gray-200">
            {[
              { id: "dashboard", label: "داشبورد کلی", icon: "📊" },
              { id: "trends", label: "روندها", icon: "📈" },
              { id: "categories", label: "دسته‌بندی‌ها", icon: "🏷️" },
              { id: "outstanding", label: "بدهی‌ها", icon: "💳" },
              { id: "classes", label: "کلاس‌ها", icon: "🎓" },
              { id: "detailed", label: "گزارش تفصیلی", icon: "📋" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="ml-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">در حال بارگذاری گزارش‌ها...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Key Metrics Cards */}
                {financialStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">
                            کل درآمد
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(financialStats.totalIncome)}
                          </p>
                        </div>
                        <div className="bg-green-400 bg-opacity-30 p-3 rounded-full">
                          <svg
                            className="w-8 h-8"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-100 text-sm font-medium">
                            کل هزینه
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(financialStats.totalExpenses)}
                          </p>
                        </div>
                        <div className="bg-red-400 bg-opacity-30 p-3 rounded-full">
                          <svg
                            className="w-8 h-8"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">
                            سود خالص
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(financialStats.netProfit)}
                          </p>
                        </div>
                        <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
                          <svg
                            className="w-8 h-8"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">
                            کل تراکنش‌ها
                          </p>
                          <p className="text-2xl font-bold">
                            {financialStats.totalTransactions.toLocaleString(
                              "fa-IR"
                            )}
                          </p>
                        </div>
                        <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
                          <svg
                            className="w-8 h-8"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Stats */}
                {financialStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        آمار کلی
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            تعداد دانش‌آموزان:
                          </span>
                          <span className="font-medium">
                            {financialStats.totalStudents}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">تعداد معلمان:</span>
                          <span className="font-medium">
                            {financialStats.totalTeachers}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">میانگین تراکنش:</span>
                          <span className="font-medium">
                            {formatCurrency(
                              financialStats.averageTransactionAmount
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">نرخ وصولی:</span>
                          <span className="font-medium text-green-600">
                            {formatPercentage(
                              financialStats.collectionEfficiency
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        روش‌های پرداخت
                      </h3>
                      <div className="space-y-3">
                        {paymentMethodStats.slice(0, 5).map((method, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-gray-600">
                              {method.method}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${method.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">
                                {formatPercentage(method.percentage)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        عملیات سریع
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={() =>
                            exportToCSV(categoryStats, "category-stats.csv")
                          }
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          خروجی آمار دسته‌بندی
                        </button>
                        <button
                          onClick={() =>
                            exportToCSV(
                              outstandingBalances,
                              "outstanding-balances.csv"
                            )
                          }
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          خروجی بدهی‌ها
                        </button>
                        <button
                          onClick={() =>
                            exportToCSV(classFinancials, "class-financials.csv")
                          }
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          خروجی آمار کلاس‌ها
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trends Tab */}
            {activeTab === "trends" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  روند مالی ماهانه
                </h3>
                {monthlyTrends.length > 0 ? (
                  <div className="space-y-6">
                    {/* Chart placeholder - in real implementation, use a chart library */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                      <p className="text-gray-600 mb-4">
                        نمودار روند مالی (برای پیاده‌سازی کامل از Chart.js
                        استفاده شود)
                      </p>
                      <div className="text-sm text-gray-500">
                        دیتای موجود: {monthlyTrends.length} ماه
                      </div>
                    </div>

                    {/* Monthly Data Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ماه
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              درآمد
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              هزینه
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              خالص
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              تعداد تراکنش
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {monthlyTrends.map((trend, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {trend.month}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                {formatCurrency(trend.income)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                {formatCurrency(trend.expenses)}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                  trend.netFlow >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(trend.netFlow)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {trend.transactionCount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    داده‌ای برای نمایش یافت نشد
                  </div>
                )}
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === "categories" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  تحلیل دسته‌بندی‌ها
                </h3>
                {categoryStats.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryStats.map((category, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <h4 className="font-bold text-gray-900 mb-4">
                          {category.category || "دسته‌بندی نشده"}
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              درآمد:
                            </span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(category.income)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              هزینه:
                            </span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(category.expenses)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">خالص:</span>
                            <span
                              className={`font-medium ${
                                category.income - category.expenses >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(
                                category.income - category.expenses
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              تعداد تراکنش:
                            </span>
                            <span className="font-medium text-gray-900">
                              {category.transactionCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    داده‌ای برای نمایش یافت نشد
                  </div>
                )}
              </div>
            )}

            {/* Outstanding Balances Tab */}
            {activeTab === "outstanding" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  بدهی‌های معوق
                </h3>
                {outstandingBalances.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            نام
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            نوع
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            مبلغ بدهی
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            آخرین پرداخت
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            روز تاخیر
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            وضعیت
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {outstandingBalances.map((balance, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {balance.personName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  balance.personType === "student"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {balance.personType === "student"
                                  ? "دانش‌آموز"
                                  : "معلم"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatCurrency(Math.abs(balance.balance))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(balance.lastPayment).toLocaleDateString(
                                "fa-IR"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {balance.daysPastDue} روز
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  balance.daysPastDue > 60
                                    ? "bg-red-100 text-red-800"
                                    : balance.daysPastDue > 30
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {balance.daysPastDue > 60
                                  ? "بحرانی"
                                  : balance.daysPastDue > 30
                                  ? "خطرناک"
                                  : "معوق"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    بدهی معوقی یافت نشد
                  </div>
                )}
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === "classes" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  آمار مالی کلاس‌ها
                </h3>
                {classFinancials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classFinancials.map((classData, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <h4 className="font-bold text-gray-900 mb-4">
                          {classData.className}
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              تعداد دانش‌آموز:
                            </span>
                            <span className="font-medium text-gray-900">
                              {classData.studentCount}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              مجموع وصولی:
                            </span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(classData.totalCollected)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              مانده بدهی:
                            </span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(classData.totalOutstanding)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              نرخ وصولی:
                            </span>
                            <span
                              className={`font-medium ${
                                classData.collectionRate > 80
                                  ? "text-green-600"
                                  : classData.collectionRate > 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatPercentage(classData.collectionRate)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full ${
                                classData.collectionRate > 80
                                  ? "bg-green-600"
                                  : classData.collectionRate > 60
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                              }`}
                              style={{ width: `${classData.collectionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    داده‌ای برای نمایش یافت نشد
                  </div>
                )}
              </div>
            )}

            {/* Detailed Reports Tab */}
            {activeTab === "detailed" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    گزارش‌های تفصیلی
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Profit & Loss Summary */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="font-bold text-gray-900 mb-4">
                        صورت سود و زیان
                      </h4>
                      {financialStats && (
                        <div className="space-y-3">
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">درآمدها:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(financialStats.totalIncome)}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">هزینه‌ها:</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(financialStats.totalExpenses)}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-lg">
                            <span>سود/زیان خالص:</span>
                            <span
                              className={
                                financialStats.netProfit >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {formatCurrency(financialStats.netProfit)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cash Flow Summary */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="font-bold text-gray-900 mb-4">
                        جریان نقدینگی
                      </h4>
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            {financialStats
                              ? formatCurrency(financialStats.netProfit)
                              : "0 ریال"}
                          </div>
                          <div className="text-sm text-gray-600">
                            جریان نقدی خالص
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {paymentMethodStats
                                .filter((p) => p.method !== "credit")
                                .reduce((sum, p) => sum + p.amount, 0)
                                .toLocaleString("fa-IR")}
                            </div>
                            <div className="text-xs text-gray-600">
                              ورودی نقد
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-red-600">
                              {paymentMethodStats
                                .filter((p) => p.method === "credit")
                                .reduce((sum, p) => sum + p.amount, 0)
                                .toLocaleString("fa-IR")}
                            </div>
                            <div className="text-xs text-gray-600">
                              خروجی نقد
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Indicators */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="font-bold text-gray-900 mb-4">
                        شاخص‌های عملکرد
                      </h4>
                      {financialStats && (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              متوسط تراکنش:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                financialStats.averageTransactionAmount
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              درآمد هر دانش‌آموز:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                financialStats.totalIncome /
                                  Math.max(financialStats.totalStudents, 1)
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              هزینه هر معلم:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                financialStats.totalExpenses /
                                  Math.max(financialStats.totalTeachers, 1)
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              بازده مالی:
                            </span>
                            <span
                              className={`font-medium ${
                                financialStats.netProfit /
                                  Math.max(financialStats.totalIncome, 1) >
                                0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatPercentage(
                                (financialStats.netProfit /
                                  Math.max(financialStats.totalIncome, 1)) *
                                  100
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
