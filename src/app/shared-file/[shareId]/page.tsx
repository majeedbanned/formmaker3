"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LockClosedIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface SharedFile {
  shareId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  expiresAt: string | null;
  isPasswordProtected: boolean;
  accessCount: number;
}

export default function SharedFilePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [file, setFile] = useState<SharedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    // Different icons based on file type
    switch (fileType?.toLowerCase()) {
      case "application/pdf":
        return <DocumentIcon className="h-16 w-16 text-red-500" />;
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return <DocumentIcon className="h-16 w-16 text-blue-600" />;
      case "application/vnd.ms-excel":
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return <DocumentIcon className="h-16 w-16 text-green-600" />;
      case "application/vnd.ms-powerpoint":
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        return <DocumentIcon className="h-16 w-16 text-orange-500" />;
      case "image/jpeg":
      case "image/png":
      case "image/gif":
        return <DocumentIcon className="h-16 w-16 text-purple-500" />;
      default:
        return <DocumentIcon className="h-16 w-16 text-blue-500" />;
    }
  };

  // Format expiry date
  const formatExpiryDate = (dateString: string | null): string => {
    if (!dateString) return "بدون محدودیت زمانی";

    const expiryDate = new Date(dateString);
    const now = new Date();

    // If expired
    if (expiryDate < now) {
      return "منقضی شده";
    }

    // Calculate time difference
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (diffDays > 0) {
      return `${diffDays} روز و ${diffHours} ساعت دیگر`;
    } else {
      return `${diffHours} ساعت دیگر`;
    }
  };

  // Fetch file metadata
  const fetchFileInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/fileexplorer/share/${shareId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("لینک مورد نظر یافت نشد یا منقضی شده است.");
        } else if (response.status === 403) {
          // File is password protected, just get metadata
          const data = await response.json();
          setFile(data.file);
        } else {
          setError("خطا در دریافت اطلاعات فایل. لطفاً بعداً تلاش کنید.");
        }
        return;
      }

      const data = await response.json();
      setFile(data.file);
      setAccessGranted(true);
    } catch (error) {
      console.error("Error fetching share info:", error);
      setError("خطا در ارتباط با سرور. لطفاً بعداً تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  // Submit password
  const submitPassword = async () => {
    if (!password.trim() || !file) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `/api/fileexplorer/share/${shareId}/access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("رمز عبور نادرست است.");
          if (passwordRef.current) {
            passwordRef.current.focus();
          }
        } else {
          toast.error("خطا در تأیید رمز عبور. لطفاً بعداً تلاش کنید.");
        }
        return;
      }

      setAccessGranted(true);
      toast.success("دسترسی به فایل با موفقیت انجام شد.");
    } catch (error) {
      console.error("Error accessing shared file:", error);
      toast.error("خطا در ارتباط با سرور. لطفاً بعداً تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download the file
  const downloadFile = async () => {
    if (!file || !accessGranted) return;

    try {
      window.location.href = `/api/fileexplorer/share/${shareId}/download${
        file.isPasswordProtected
          ? `?password=${encodeURIComponent(password)}`
          : ""
      }`;
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("خطا در دانلود فایل. لطفاً بعداً تلاش کنید.");
    }
  };

  // Initial load
  useEffect(() => {
    if (shareId) {
      fetchFileInfo();
    }
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <XMarkIcon className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">خطا</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <XMarkIcon className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            فایل یافت نشد
          </h2>
          <p className="mt-2 text-gray-600">
            لینک مورد نظر معتبر نیست یا منقضی شده است.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          {getFileIcon(file.fileType)}
          <h1 className="text-xl font-bold mt-4">{file.fileName}</h1>
          <p className="text-gray-500 mt-1">{formatFileSize(file.fileSize)}</p>

          {file.expiresAt && (
            <div className="flex items-center justify-center mt-2 text-gray-600 text-sm">
              <ClockIcon className="h-4 w-4 ml-1" />
              <span>انقضا: {formatExpiryDate(file.expiresAt)}</span>
            </div>
          )}
        </div>

        {file.isPasswordProtected && !accessGranted ? (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="flex">
                <LockClosedIcon className="h-5 w-5 text-yellow-500 ml-2" />
                <p className="text-sm text-yellow-700">
                  این فایل با رمز عبور محافظت شده است. لطفاً رمز عبور را وارد
                  کنید.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                رمز عبور
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="رمز عبور را وارد کنید"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 px-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={submitPassword}
              disabled={!password.trim() || isSubmitting}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "در حال بررسی..." : "دسترسی به فایل"}
            </button>
          </div>
        ) : (
          <button
            onClick={downloadFile}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 ml-1.5" />
            دانلود فایل
          </button>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-blue-600">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}
