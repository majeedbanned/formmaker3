"use client";

import { useState, useRef, useCallback } from "react";
import {
  CloudArrowUpIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  userType: string;
  schoolCode: string;
  username: string;
  name: string;
}

interface BulkAvatarUploadProps {
  user: User;
}

interface FileWithStudent {
  file: File;
  studentCode: string;
  studentName?: string;
  studentFamily?: string;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface UploadResult {
  studentCode: string;
  success: boolean;
  message: string;
}

const STEP_TITLES = [
  "انتخاب فایل‌ها",
  "تطبیق با دانش‌آموزان",
  "بررسی و تأیید",
  "پردازش و آپلود",
];

export default function BulkAvatarUpload({ user }: BulkAvatarUploadProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<FileWithStudent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract student code from filename
  const extractStudentCode = useCallback((filename: string): string => {
    // Try different patterns for student code extraction
    const patterns = [
      /^(\d+)/, // Starts with numbers
      /(\d{6,})/, // 6+ digits anywhere
      /_(\d+)/, // Underscore followed by numbers
      /-(\d+)/, // Dash followed by numbers
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // If no pattern matches, use filename without extension as student code
    return filename.split(".")[0];
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const newFiles: FileWithStudent[] = [];

      Array.from(selectedFiles).forEach((file) => {
        // Check if file is an image
        if (!file.type.startsWith("image/")) {
          return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          return;
        }

        const studentCode = extractStudentCode(file.name);
        const preview = URL.createObjectURL(file);

        newFiles.push({
          file,
          studentCode,
          preview,
          status: "pending",
        });
      });

      setFiles((prev) => [...prev, ...newFiles]);
      if (newFiles.length > 0 && currentStep === 0) {
        setCurrentStep(1);
      }
    },
    [extractStudentCode, currentStep]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Fetch student details
  const fetchStudentDetails = useCallback(async (studentCode: string) => {
    try {
      const response = await fetch(
        `/api/formbuilder/student-details?studentCode=${studentCode}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          studentName: data.student?.data?.studentName,
          studentFamily: data.student?.data?.studentFamily,
        };
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
    return null;
  }, []);

  // Load student details for all files
  const loadStudentDetails = useCallback(async () => {
    const updatedFiles = await Promise.all(
      files.map(async (file) => {
        if (!file.studentName) {
          const details = await fetchStudentDetails(file.studentCode);
          return {
            ...file,
            studentName: details?.studentName,
            studentFamily: details?.studentFamily,
          };
        }
        return file;
      })
    );
    setFiles(updatedFiles);
  }, [files, fetchStudentDetails]);

  // Upload avatar for a single student
  const uploadSingleAvatar = useCallback(
    async (fileWithStudent: FileWithStudent): Promise<UploadResult> => {
      try {
        const formData = new FormData();
        formData.append("file", fileWithStudent.file);
        formData.append("studentCode", fileWithStudent.studentCode);
        formData.append("directory", "avatars");

        const response = await fetch("/api/students/upload-avatar", {
          method: "POST",
          headers: {
            "x-domain": window.location.host,
          },
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          return {
            studentCode: fileWithStudent.studentCode,
            success: true,
            message: "تصویر با موفقیت آپلود شد",
          };
        } else {
          return {
            studentCode: fileWithStudent.studentCode,
            success: false,
            message: result.error || "خطا در آپلود تصویر",
          };
        }
      } catch (error) {
        return {
          studentCode: fileWithStudent.studentCode,
          success: false,
          message: "خطا در اتصال به سرور",
        };
      }
    },
    []
  );

  // Start bulk upload process
  const startUpload = useCallback(async () => {
    setIsUploading(true);
    setCurrentStep(3);
    const results: UploadResult[] = [];

    // Update files status to uploading
    setFiles((prev) =>
      prev.map((file) => ({ ...file, status: "uploading" as const }))
    );

    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadSingleAvatar(file);
      results.push(result);

      // Update individual file status
      setFiles((prev) =>
        prev.map((f, index) =>
          index === i
            ? {
                ...f,
                status: result.success ? "success" : "error",
                error: result.success ? undefined : result.message,
              }
            : f
        )
      );

      // Small delay between uploads to prevent overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setUploadResults(results);
    setIsUploading(false);
  }, [files, uploadSingleAvatar]);

  // Remove file from list
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  // Update student code manually
  const updateStudentCode = useCallback((index: number, newCode: string) => {
    setFiles((prev) =>
      prev.map((file, i) =>
        i === index ? { ...file, studentCode: newCode } : file
      )
    );
  }, []);

  // Navigation functions
  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      loadStudentDetails();
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEP_TITLES.length - 1));
  }, [currentStep, loadStudentDetails]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const resetWizard = useCallback(() => {
    setCurrentStep(0);
    setFiles([]);
    setUploadResults([]);
    setIsUploading(false);
  }, []);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center py-12">
            <div
              className={`border-2 border-dashed rounded-lg p-12 transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                تصاویر دانش‌آموزان را انتخاب کنید
              </h3>
              <p className="text-gray-500 mb-4">
                فایل‌ها را بکشید و رها کنید یا کلیک کنید تا انتخاب کنید
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                انتخاب فایل‌ها
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <div className="mt-4 text-sm text-gray-500">
                <p>• تنها فایل‌های تصویری قابل قبول هستند</p>
                <p>• حداکثر حجم هر فایل: 5 مگابایت</p>
                <p>• نام فایل باید شامل کد دانش‌آموز باشد</p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              تطبیق تصاویر با دانش‌آموزان ({files.length} فایل انتخاب شده)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-sm truncate flex-1">
                      {file.file.name}
                    </h4>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 mr-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={file.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        کد دانش‌آموز
                      </label>
                      <input
                        type="text"
                        value={file.studentCode}
                        onChange={(e) =>
                          updateStudentCode(index, e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="کد دانش‌آموز"
                      />
                    </div>

                    {file.studentName && (
                      <div className="text-xs text-gray-600">
                        <p>
                          <span className="font-medium">نام:</span>{" "}
                          {file.studentName} {file.studentFamily}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              بررسی نهایی قبل از آپلود
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 ml-2" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    هشدار مهم
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    تصاویر فعلی دانش‌آموزان با تصاویر جدید جایگزین خواهند شد.
                    این عمل قابل بازگشت نیست.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 bg-white shadow-sm"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                    <img
                      src={file.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {file.studentCode}
                    </p>
                    {file.studentName && (
                      <p className="text-xs text-gray-600">
                        {file.studentName} {file.studentFamily}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">آماده آپلود:</span> {files.length}{" "}
                تصویر برای {files.length} دانش‌آموز
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isUploading ? "در حال آپلود..." : "نتایج آپلود"}
            </h3>

            {isUploading && (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 ml-3"></div>
                    <p className="text-blue-800">
                      در حال آپلود تصاویر، لطفاً صبر کنید...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 flex items-center ${
                    file.status === "success"
                      ? "border-green-200 bg-green-50"
                      : file.status === "error"
                      ? "border-red-200 bg-red-50"
                      : file.status === "uploading"
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden ml-4">
                    <img
                      src={file.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">
                      {file.studentName
                        ? `${file.studentName} ${file.studentFamily}`
                        : file.studentCode}
                    </p>
                    <p className="text-xs text-gray-600">{file.file.name}</p>
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {file.status === "uploading" && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                    {file.status === "success" && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    )}
                    {file.status === "error" && (
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isUploading && uploadResults.length > 0 && (
              <div className="mt-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    خلاصه نتایج
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-600 font-medium">
                        موفق: {uploadResults.filter((r) => r.success).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-red-600 font-medium">
                        ناموفق: {uploadResults.filter((r) => !r.success).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEP_TITLES.map((title, index) => (
            <div
              key={index}
              className={`flex items-center ${
                index < STEP_TITLES.length - 1 ? "flex-1" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
              <div className="mr-3">
                <p
                  className={`text-sm font-medium ${
                    index <= currentStep ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {title}
                </p>
              </div>
              {index < STEP_TITLES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 0 && currentStep < 3 && (
            <button
              onClick={prevStep}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowRightIcon className="h-4 w-4 ml-2" />
              مرحله قبل
            </button>
          )}
        </div>

        <div className="flex space-x-3 space-x-reverse">
          {currentStep === 0 && files.length > 0 && (
            <button
              onClick={nextStep}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
            >
              مرحله بعد
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
            </button>
          )}

          {currentStep === 1 && files.length > 0 && (
            <button
              onClick={nextStep}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
            >
              بررسی نهایی
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
            </button>
          )}

          {currentStep === 2 && !isUploading && (
            <button
              onClick={startUpload}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
            >
              <DocumentArrowUpIcon className="h-4 w-4 ml-2" />
              شروع آپلود
            </button>
          )}

          {currentStep === 3 && !isUploading && (
            <button
              onClick={resetWizard}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
            >
              آپلود جدید
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
