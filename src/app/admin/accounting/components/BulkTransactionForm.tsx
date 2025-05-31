"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";

interface Class {
  _id: string;
  classCode: string;
  className: string;
  grade: string;
  major: string;
  studentCount: number;
}

interface BulkTransactionFormProps {
  onClose: () => void;
  onSuccess: () => void;
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

export default function BulkTransactionForm({
  onClose,
  onSuccess,
}: BulkTransactionFormProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    transactionType: "debit" as "debit" | "credit",
    amount: "",
    description: "",
    paymentMethod: "",
    category: "",
    receiptNumber: "",
    referenceNumber: "",
    transactionDate: new DateObject(),
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Class selection, 2: Transaction details, 3: Confirmation

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("/api/accounting/bulk-transactions");
        if (response.ok) {
          const data = await response.json();
          setClasses(data.classes);
        } else {
          setError("خطا در بارگذاری کلاس‌ها");
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        setError("خطا در ارتباط با سرور");
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  const handleInputChange = (field: string, value: string | DateObject) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleClassSelect = (cls: Class) => {
    setSelectedClass(cls);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClass) {
      setError("لطفاً ابتدا کلاس را انتخاب کنید.");
      return;
    }

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
        classCode: selectedClass.classCode,
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

      const response = await fetch("/api/accounting/bulk-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "خطا در ثبت تراکنش‌ها");
      }
    } catch (error) {
      console.error("Error submitting bulk transactions:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    if (!selectedClass || !formData.amount) return 0;
    return selectedClass.studentCount * parseFloat(formData.amount || "0");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            ثبت تراکنش دسته‌جمعی کلاس
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

        {/* Step Indicator */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-4 space-x-reverse">
            <div
              className={`flex items-center ${
                step >= 1 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? "bg-blue-600 text-white" : "bg-gray-300"
                }`}
              >
                1
              </div>
              <span className="mr-2">انتخاب کلاس</span>
            </div>
            <div
              className={`w-8 h-0.5 ${
                step >= 2 ? "bg-blue-600" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex items-center ${
                step >= 2 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? "bg-blue-600 text-white" : "bg-gray-300"
                }`}
              >
                2
              </div>
              <span className="mr-2">جزئیات تراکنش</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Class Selection */}
        {step === 1 && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              انتخاب کلاس
            </h3>

            {loadingClasses ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">در حال بارگذاری کلاس‌ها...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                هیچ کلاسی یافت نشد
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <button
                    key={cls._id}
                    onClick={() => handleClassSelect(cls)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 text-right"
                  >
                    <div className="font-bold text-gray-900 mb-2">
                      {cls.className}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>کد کلاس: {cls.classCode}</div>
                      <div>پایه: {cls.grade}</div>
                      <div>تعداد دانش‌آموزان: {cls.studentCount} نفر</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Transaction Details */}
        {step === 2 && selectedClass && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Selected Class Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">
                کلاس انتخاب شده:
              </h3>
              <div className="text-blue-800">
                <div className="font-bold">{selectedClass.className}</div>
                <div className="text-sm">
                  کد: {selectedClass.classCode} | پایه: {selectedClass.grade} |
                  تعداد دانش‌آموزان: {selectedClass.studentCount} نفر
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                تغییر کلاس
              </button>
            </div>

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
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 ml-2"
                  />
                  <span className="text-red-600 font-medium">
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
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 ml-2"
                  />
                  <span className="text-green-600 font-medium">
                    بستانکار (واریز)
                  </span>
                </label>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مبلغ برای هر دانش‌آموز (ریال) *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="مبلغ را وارد کنید..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                required
              />
              {formData.amount && (
                <div className="mt-2 text-sm text-gray-600">
                  مجموع کل:{" "}
                  {new Intl.NumberFormat("fa-IR").format(getTotalAmount())} ریال
                  ({selectedClass.studentCount} دانش‌آموز ×{" "}
                  {new Intl.NumberFormat("fa-IR").format(
                    parseFloat(formData.amount || "0")
                  )}{" "}
                  ریال)
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شرح تراکنش *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="شرح تراکنش را وارد کنید..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
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
                calendarPosition="bottom-left"
                className="w-full"
                render={(value, openCalendar) => (
                  <input
                    value={value}
                    onClick={openCalendar}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-right"
                    placeholder="انتخاب تاریخ..."
                  />
                )}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-right"
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
                ثبت تراکنش برای {selectedClass.studentCount} دانش‌آموز
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                بازگشت
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
        )}
      </div>
    </div>
  );
}
