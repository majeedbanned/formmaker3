"use client";

import { useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";

interface Person {
  _id: string;
  name: string;
  code: string;
  type: "student" | "teacher";
  classCode?: unknown[];
}

interface TransactionFormProps {
  person: Person;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: {
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
  };
}

const paymentMethods = [
  { value: "cash", label: "نقدی" },
  { value: "bank", label: "بانکی" },
  { value: "transfer", label: "حواله" },
  { value: "check", label: "چک" },
  { value: "card", label: "کارتی" },
  { value: "scholarship", label: "بورسیه" },
  { value: "other", label: "سایر" },
];

const categories = [
  { value: "tuition", label: "شهریه" },
  { value: "salary", label: "حقوق" },
  { value: "bonus", label: "پاداش" },
  { value: "fine", label: "جریمه" },
  { value: "purchase", label: "خرید" },
  { value: "maintenance", label: "تعمیر و نگهداری" },
  { value: "transportation", label: "حمل و نقل" },
  { value: "food", label: "غذا" },
  { value: "book", label: "کتاب و لوازم" },
  { value: "exam", label: "امتحان" },
  { value: "activity", label: "فعالیت فوق برنامه" },
  { value: "other", label: "سایر" },
];

export default function TransactionForm({
  person,
  onClose,
  onSuccess,
  transaction,
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    transactionType:
      transaction?.transactionType || ("debit" as "debit" | "credit"),
    amount: transaction?.amount?.toString() || "",
    description: transaction?.description || "",
    paymentMethod: transaction?.paymentMethod || "",
    category: transaction?.category || "",
    receiptNumber: transaction?.receiptNumber || "",
    referenceNumber: transaction?.referenceNumber || "",
    transactionDate: transaction?.transactionDate
      ? new DateObject(new Date(transaction.transactionDate))
      : new DateObject(),
    notes: transaction?.notes || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (field: string, value: string | DateObject) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      setError("لطفاً تمام فیلدهای اجباری را پر کنید.");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError("مبلغ باید بیشتر از صفر باشد.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const requestData = {
        personType: person.type,
        personId: person._id,
        transactionType: formData.transactionType,
        amount: parseFloat(formData.amount),
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        category: formData.category,
        receiptNumber: formData.receiptNumber,
        referenceNumber: formData.referenceNumber,
        transactionDate: formData.transactionDate.toDate(),
        notes: formData.notes,
      };

      const url = transaction
        ? "/api/accounting/transactions"
        : "/api/accounting/transactions";

      const method = transaction ? "PUT" : "POST";
      const body = transaction
        ? { ...requestData, transactionId: transaction._id }
        : requestData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "خطا در ثبت تراکنش");
      }
    } catch (error) {
      console.error("Error submitting transaction:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {transaction ? "ویرایش تراکنش" : "ثبت تراکنش جدید"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Person Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                person.type === "student" ? "bg-green-500" : "bg-purple-500"
              }`}
            ></div>
            <div>
              <div className="font-medium text-gray-900">{person.name}</div>
              <div className="text-sm text-gray-600">
                {person.type === "student" ? "دانش‌آموز" : "معلم"} - کد:{" "}
                {person.code}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع تراکنش *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="transactionType"
                  value="debit"
                  checked={formData.transactionType === "debit"}
                  onChange={(e) =>
                    handleInputChange("transactionType", e.target.value)
                  }
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <span className="mr-2 text-red-600 font-medium">
                  بدهکار (برداشت)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="transactionType"
                  value="credit"
                  checked={formData.transactionType === "credit"}
                  onChange={(e) =>
                    handleInputChange("transactionType", e.target.value)
                  }
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="mr-2 text-green-600 font-medium">
                  بستانکار (واریز)
                </span>
              </label>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مبلغ (ریال) *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="مبلغ را وارد کنید..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              شرح تراکنش *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="شرح تراکنش را وارد کنید..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              دسته‌بندی
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">انتخاب دسته‌بندی...</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              روش پرداخت
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                handleInputChange("paymentMethod", e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">انتخاب روش پرداخت...</option>
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاریخ تراکنش
            </label>
            <DatePicker
              value={formData.transactionDate}
              onChange={(date) =>
                handleInputChange("transactionDate", date as DateObject)
              }
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              className="w-full"
              render={(value, openCalendar) => (
                <input
                  value={value}
                  onClick={openCalendar}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  placeholder="انتخاب تاریخ..."
                />
              )}
            />
          </div>

          {/* Receipt Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              شماره رسید
            </label>
            <input
              type="text"
              value={formData.receiptNumber}
              onChange={(e) =>
                handleInputChange("receiptNumber", e.target.value)
              }
              placeholder="شماره رسید..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              شماره مرجع
            </label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) =>
                handleInputChange("referenceNumber", e.target.value)
              }
              placeholder="شماره مرجع..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              یادداشت
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="یادداشت اضافی..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              )}
              {transaction ? "بروزرسانی" : "ثبت تراکنش"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
