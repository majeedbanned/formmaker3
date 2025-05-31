"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import PersonSelector from "./components/PersonSelector";
import TransactionList from "./components/TransactionList";
import TransactionForm from "./components/TransactionForm";
import PersonSummary from "./components/PersonSummary";
import AccountingSummary from "./components/AccountingSummary";

export default function AccountingPage() {
  const { user } = useAuth();
  const [selectedPerson, setSelectedPerson] = useState<{
    _id: string;
    name: string;
    code: string;
    type: "student" | "teacher";
    classCode?: unknown[];
  } | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refresh data
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!user || user.userType !== "school") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">دسترسی محدود</h1>
          <p className="text-gray-600">
            تنها مدیران مدرسه می‌توانند به سیستم حسابداری دسترسی داشته باشند.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            سیستم حسابداری مدرسه
          </h1>
          <p className="text-gray-600">
            مدیریت تراکنش‌های مالی دانش‌آموزان و معلمان
          </p>
        </div>

        {/* Overall Summary */}
        <AccountingSummary refreshTrigger={refreshTrigger} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Person Selection */}
          <div className="lg:col-span-1">
            <PersonSelector
              selectedPerson={selectedPerson}
              onPersonSelect={setSelectedPerson}
              refreshTrigger={refreshTrigger}
            />

            {selectedPerson && (
              <PersonSummary
                person={selectedPerson}
                refreshTrigger={refreshTrigger}
              />
            )}
          </div>

          {/* Right Column - Transactions */}
          <div className="lg:col-span-2">
            {selectedPerson ? (
              <>
                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowTransactionForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      ثبت تراکنش جدید
                    </button>

                    <button
                      onClick={refreshData}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      بروزرسانی
                    </button>
                  </div>

                  {selectedPerson && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">
                        انتخاب شده:
                      </h3>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            selectedPerson.type === "student"
                              ? "bg-green-500"
                              : "bg-purple-500"
                          }`}
                        ></div>
                        <span className="font-medium text-blue-800">
                          {selectedPerson.name}
                        </span>
                        <span className="text-sm text-blue-600">
                          (
                          {selectedPerson.type === "student"
                            ? "دانش‌آموز"
                            : "معلم"}
                          )
                        </span>
                        <span className="text-sm text-blue-600">
                          کد: {selectedPerson.code}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transaction List */}
                <TransactionList
                  selectedPerson={selectedPerson}
                  refreshTrigger={refreshTrigger}
                  onRefresh={refreshData}
                />
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  انتخاب شخص
                </h3>
                <p className="text-gray-500">
                  برای مشاهده تراکنش‌ها و ثبت تراکنش جدید، ابتدا یک دانش‌آموز یا
                  معلم را انتخاب کنید.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Form Modal */}
        {showTransactionForm && selectedPerson && (
          <TransactionForm
            person={selectedPerson}
            onClose={() => setShowTransactionForm(false)}
            onSuccess={() => {
              setShowTransactionForm(false);
              refreshData();
            }}
          />
        )}
      </div>
    </div>
  );
}
