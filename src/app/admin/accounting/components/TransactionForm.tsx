"use client";

import { useState, useEffect } from "react";
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

interface UploadedFile {
  originalName: string;
  filename: string;
  filepath: string;
  size: number;
  type: string;
  uploadedAt: Date;
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
    documents?: UploadedFile[];
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
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedFile[]>(
    []
  );
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Load existing documents when editing
  useEffect(() => {
    if (transaction?.documents) {
      setUploadedDocuments(transaction.documents);
    }
  }, [transaction]);

  const handleInputChange = (field: string, value: string | DateObject) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    setError("");

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/accounting/documents", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedDocuments((prev) => [...prev, ...result.files]);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "خطا در آپلود فایل");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("خطا در آپلود فایل");
    } finally {
      setUploadingFiles(false);
      // Reset the input
      event.target.value = "";
    }
  };

  // Remove uploaded document
  const removeDocument = async (filename: string) => {
    try {
      const response = await fetch(
        `/api/accounting/documents?filename=${filename}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setUploadedDocuments((prev) =>
          prev.filter((doc) => doc.filename !== filename)
        );
      } else {
        console.error("Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return (
        <svg
          className="w-5 h-5 text-blue-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (type === "application/pdf") {
      return (
        <svg
          className="w-5 h-5 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className="w-5 h-5 text-gray-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
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
        documents: uploadedDocuments, // Include uploaded documents
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir="rtl"
    >
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
              مبلغ (ریال) *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="مبلغ را وارد کنید..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              پیوست اسناد
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploadingFiles}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center text-center"
              >
                <svg
                  className="w-8 h-8 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  {uploadingFiles
                    ? "در حال آپلود..."
                    : "کلیک کنید یا فایل را بکشید"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  پشتیبانی از تصاویر، PDF، Word، Excel - حداکثر 10MB
                </p>
              </label>
            </div>

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">
                  فایل‌های آپلود شده:
                </h4>
                {uploadedDocuments.map((doc) => (
                  <div
                    key={doc.filename}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getFileIcon(doc.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.filepath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="مشاهده فایل"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </a>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.filename)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="حذف فایل"
                      >
                        <svg
                          className="w-4 h-4"
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
                  </div>
                ))}
              </div>
            )}
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
              disabled={loading || uploadingFiles}
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
