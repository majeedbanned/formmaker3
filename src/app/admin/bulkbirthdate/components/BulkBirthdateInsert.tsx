"use client";

import { useState, useRef, useCallback } from "react";
import {
  ClipboardDocumentIcon,
  CalendarDaysIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  userType: string;
  schoolCode: string;
  username: string;
  name: string;
}

interface BulkBirthdateInsertProps {
  user: User;
}

interface BirthdateEntry {
  studentCode: string;
  studentName?: string;
  studentFamily?: string;
  originalBirthdate: string;
  formattedBirthdate: string;
  isValid: boolean;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

interface UpdateResult {
  studentCode: string;
  success: boolean;
  message: string;
}

const STEP_TITLES = [
  "ورود داده‌ها",
  "بررسی و تطبیق",
  "تأیید نهایی",
  "پردازش و ثبت",
];

export default function BulkBirthdateInsert({
  user,
}: BulkBirthdateInsertProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [birthdateEntries, setBirthdateEntries] = useState<BirthdateEntry[]>(
    []
  );
  const [pastedData, setPastedData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convert Persian digits to English
  const persianToEnglish = useCallback((str: string): string => {
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    const englishDigits = "0123456789";

    return str.replace(/[۰-۹]/g, (char) => {
      return englishDigits[persianDigits.indexOf(char)];
    });
  }, []);

  // Convert English digits to Persian
  const englishToPersian = useCallback((str: string): string => {
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    const englishDigits = "0123456789";

    return str.replace(/[0-9]/g, (char) => {
      return persianDigits[englishDigits.indexOf(char)];
    });
  }, []);

  // Parse and validate date formats
  const parseBirthdate = useCallback(
    (dateStr: string): { formatted: string; isValid: boolean } => {
      if (!dateStr.trim()) {
        return { formatted: "", isValid: false };
      }

      // Clean and convert to English digits
      const cleanDate = persianToEnglish(dateStr.trim().replace(/\s+/g, ""));

      let year = "";
      let month = "";
      let day = "";

      // Try different formats
      if (cleanDate.includes("/")) {
        // Format: 1388/02/04 or 1388/2/4
        const parts = cleanDate.split("/");
        if (parts.length === 3) {
          year = parts[0].padStart(4, "0");
          month = parts[1].padStart(2, "0");
          day = parts[2].padStart(2, "0");
        }
      } else if (cleanDate.length === 8) {
        // Format: 13880204
        year = cleanDate.substring(0, 4);
        month = cleanDate.substring(4, 6);
        day = cleanDate.substring(6, 8);
      } else if (cleanDate.length === 6) {
        // Format: 880204 (short year format)
        const shortYear = cleanDate.substring(0, 2);
        // Convert 2-digit year to 4-digit (assuming 1300-1499 range)
        year = "13" + shortYear;
        month = cleanDate.substring(2, 4);
        day = cleanDate.substring(4, 6);
      } else {
        return { formatted: dateStr, isValid: false };
      }

      // Validate ranges
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);

      if (yearNum < 1300 || yearNum > 1450) {
        return { formatted: dateStr, isValid: false };
      }
      if (monthNum < 1 || monthNum > 12) {
        return { formatted: dateStr, isValid: false };
      }
      if (dayNum < 1 || dayNum > 31) {
        return { formatted: dateStr, isValid: false };
      }

      // Additional validation for months with fewer days
      if (monthNum >= 7 && monthNum <= 12 && dayNum > 30) {
        return { formatted: dateStr, isValid: false };
      }
      if (monthNum === 12 && dayNum > 29) {
        // Esfand in non-leap years has 29 days
        return { formatted: dateStr, isValid: false };
      }

      // Format as Persian YYYY/MM/DD
      const formatted = englishToPersian(`${year}/${month}/${day}`);
      return { formatted, isValid: true };
    },
    [persianToEnglish, englishToPersian]
  );

  // Parse Excel-like data from clipboard or text input
  const parseInputData = useCallback(
    (text: string): BirthdateEntry[] => {
      if (!text.trim()) return [];

      const lines = text.trim().split("\n");
      const entries: BirthdateEntry[] = [];

      lines.forEach((line) => {
        // Skip empty lines
        if (!line.trim()) return;

        // Split by tab (Excel copy) or comma or semicolon
        const parts = line
          .split(/[\t,;]/)
          .map((part) => part.trim())
          .filter(Boolean);

        if (parts.length < 2) return; // Need at least student code and birthdate

        const studentCode = parts[0];
        const birthdateStr = parts[1];

        const { formatted, isValid } = parseBirthdate(birthdateStr);

        entries.push({
          studentCode,
          originalBirthdate: birthdateStr,
          formattedBirthdate: formatted,
          isValid,
          status: "pending",
        });
      });

      return entries;
    },
    [parseBirthdate]
  );

  // Handle text area input
  const handleTextInput = useCallback(
    (value: string) => {
      setPastedData(value);
      const parsed = parseInputData(value);
      setBirthdateEntries(parsed);
    },
    [parseInputData]
  );

  // Handle clipboard paste
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleTextInput(text);
      if (textareaRef.current) {
        textareaRef.current.value = text;
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      alert(
        "نمی‌توان از کلیپ‌بورد خواند. لطفاً متن را به صورت دستی وارد کنید."
      );
    }
  }, [handleTextInput]);

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

  // Load student details for all entries
  const loadStudentDetails = useCallback(async () => {
    const updatedEntries = await Promise.all(
      birthdateEntries.map(async (entry) => {
        if (!entry.studentName) {
          const details = await fetchStudentDetails(entry.studentCode);
          return {
            ...entry,
            studentName: details?.studentName,
            studentFamily: details?.studentFamily,
          };
        }
        return entry;
      })
    );
    setBirthdateEntries(updatedEntries);
  }, [birthdateEntries, fetchStudentDetails]);

  // Update birthdate for a single student
  const updateStudentBirthdate = useCallback(
    async (entry: BirthdateEntry): Promise<UpdateResult> => {
      try {
        const response = await fetch("/api/students/update-birthdate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            studentCode: entry.studentCode,
            birthDate: entry.formattedBirthdate,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          return {
            studentCode: entry.studentCode,
            success: true,
            message: "تاریخ تولد با موفقیت ثبت شد",
          };
        } else {
          return {
            studentCode: entry.studentCode,
            success: false,
            message: result.error || "خطا در ثبت تاریخ تولد",
          };
        }
      } catch (error) {
        return {
          studentCode: entry.studentCode,
          success: false,
          message: "خطا در اتصال به سرور",
        };
      }
    },
    []
  );

  // Start bulk update process
  const startUpdate = useCallback(async () => {
    setIsProcessing(true);
    setCurrentStep(3);
    const results: UpdateResult[] = [];

    // Update entries status to processing
    setBirthdateEntries((prev) =>
      prev.map((entry) => ({ ...entry, status: "processing" as const }))
    );

    // Process entries one by one
    for (let i = 0; i < birthdateEntries.length; i++) {
      const entry = birthdateEntries[i];

      if (!entry.isValid) {
        // Skip invalid entries
        const result = {
          studentCode: entry.studentCode,
          success: false,
          message: "فرمت تاریخ تولد نامعتبر است",
        };
        results.push(result);

        setBirthdateEntries((prev) =>
          prev.map((e, index) =>
            index === i
              ? {
                  ...e,
                  status: "error" as const,
                  error: result.message,
                }
              : e
          )
        );
        continue;
      }

      const result = await updateStudentBirthdate(entry);
      results.push(result);

      // Update individual entry status
      setBirthdateEntries((prev) =>
        prev.map((e, index) =>
          index === i
            ? {
                ...e,
                status: result.success ? "success" : "error",
                error: result.success ? undefined : result.message,
              }
            : e
        )
      );

      // Small delay between updates
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setUpdateResults(results);
    setIsProcessing(false);
  }, [birthdateEntries, updateStudentBirthdate]);

  // Remove entry from list
  const removeEntry = useCallback((index: number) => {
    setBirthdateEntries((prev) => {
      const newEntries = [...prev];
      newEntries.splice(index, 1);
      return newEntries;
    });
  }, []);

  // Update student code manually
  const updateStudentCode = useCallback((index: number, newCode: string) => {
    setBirthdateEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, studentCode: newCode } : entry
      )
    );
  }, []);

  // Update birthdate manually
  const updateBirthdate = useCallback(
    (index: number, newBirthdate: string) => {
      setBirthdateEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const { formatted, isValid } = parseBirthdate(newBirthdate);
            return {
              ...entry,
              originalBirthdate: newBirthdate,
              formattedBirthdate: formatted,
              isValid,
            };
          }
          return entry;
        })
      );
    },
    [parseBirthdate]
  );

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
    setBirthdateEntries([]);
    setUpdateResults([]);
    setIsProcessing(false);
    setPastedData("");
    if (textareaRef.current) {
      textareaRef.current.value = "";
    }
  }, []);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ورود داده‌های تاریخ تولد
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                شما می‌توانید داده‌ها را از اکسل کپی کنید یا به صورت دستی وارد
                کنید
              </p>

              {/* Format examples */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-purple-900 mb-2">
                  نمونه فرمت‌های قابل قبول:
                </h4>
                <div className="text-sm text-purple-800 space-y-1">
                  <p>
                    <code dir="ltr">123456 1388/02/04</code> (فرمت کامل)
                  </p>
                  <p>
                    <code dir="ltr">123457 13880204</code> (بدون جداکننده)
                  </p>
                  <p>
                    <code dir="ltr">123458 880204</code> (سال کوتاه)
                  </p>
                  <p>
                    <code dir="ltr">123459 ۱۳۸۸/۰۲/۰۴</code> (اعداد فارسی)
                  </p>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  هر خط یک دانش‌آموز، جداکننده: فاصله، کاما، یا سمی‌کولن
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={handlePaste}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <ClipboardDocumentIcon className="h-4 w-4 ml-2" />
                  چسباندن از کلیپ‌بورد
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  متن داده‌ها (هر خط یک دانش‌آموز)
                </label>
                <textarea
                  ref={textareaRef}
                  value={pastedData}
                  onChange={(e) => handleTextInput(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                  placeholder={`نمونه:
123456 1388/02/04
123457 13880204
123458 880204
123459 ۱۳۸۸/۰۲/۰۴`}
                  dir="ltr"
                />
              </div>

              {birthdateEntries.length > 0 && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">
                      ✅ {birthdateEntries.length} دانش‌آموز شناسایی شد
                    </p>
                  </div>

                  {birthdateEntries.some((entry) => !entry.isValid) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">
                        ⚠️{" "}
                        {
                          birthdateEntries.filter((entry) => !entry.isValid)
                            .length
                        }{" "}
                        تاریخ تولد نامعتبر شناسایی شد
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              بررسی و ویرایش داده‌ها ({birthdateEntries.length} دانش‌آموز)
            </h3>

            <div className="space-y-4">
              {birthdateEntries.map((entry, entryIndex) => (
                <div
                  key={entryIndex}
                  className={`border rounded-lg p-4 shadow-sm ${
                    entry.isValid
                      ? "bg-white border-gray-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <label className="text-xs font-medium text-gray-700">
                          کد دانش‌آموز:
                        </label>
                        <input
                          type="text"
                          value={entry.studentCode}
                          onChange={(e) =>
                            updateStudentCode(entryIndex, e.target.value)
                          }
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>

                      {entry.studentName && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">نام:</span>{" "}
                          {entry.studentName} {entry.studentFamily}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeEntry(entryIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        تاریخ تولد:
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={entry.originalBirthdate}
                          onChange={(e) =>
                            updateBirthdate(entryIndex, e.target.value)
                          }
                          className={`flex-1 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                            entry.isValid
                              ? "border-gray-300"
                              : "border-red-300 bg-red-50"
                          }`}
                          placeholder="1388/02/04"
                          dir="ltr"
                        />
                        {entry.isValid ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500" />
                        )}
                      </div>

                      {entry.isValid && (
                        <p className="text-xs text-green-600 mt-1">
                          فرمت نهایی: {entry.formattedBirthdate}
                        </p>
                      )}

                      {!entry.isValid && (
                        <p className="text-xs text-red-600 mt-1">
                          فرمت نامعتبر - لطفاً تصحیح کنید
                        </p>
                      )}
                    </div>
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
              تأیید نهایی قبل از ثبت
            </h3>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 ml-2" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    نکته مهم
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    تاریخ تولد دانش‌آموزان بروزرسانی خواهد شد. در صورت وجود
                    تاریخ قبلی، جایگزین می‌شود.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {birthdateEntries.map((entry, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 shadow-sm ${
                    entry.isValid
                      ? "bg-white border-gray-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {entry.studentName
                          ? `${entry.studentName} ${entry.studentFamily}`
                          : entry.studentCode}
                      </p>
                      <p className="text-sm text-gray-600">
                        کد: {entry.studentCode}
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-xs text-gray-500 mb-1">تاریخ تولد:</p>
                      <p
                        className={`text-sm font-medium ${
                          entry.isValid ? "text-gray-700" : "text-red-600"
                        }`}
                      >
                        {entry.isValid ? entry.formattedBirthdate : "نامعتبر"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <span className="font-medium">آماده ثبت:</span>{" "}
                {birthdateEntries.filter((entry) => entry.isValid).length} از{" "}
                {birthdateEntries.length} دانش‌آموز
              </p>
              {birthdateEntries.some((entry) => !entry.isValid) && (
                <p className="text-sm text-red-600 mt-1">
                  <span className="font-medium">نامعتبر:</span>{" "}
                  {birthdateEntries.filter((entry) => !entry.isValid).length}{" "}
                  دانش‌آموز (نادیده گرفته می‌شوند)
                </p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isProcessing ? "در حال ثبت..." : "نتایج ثبت"}
            </h3>

            {isProcessing && (
              <div className="mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 ml-3"></div>
                    <p className="text-purple-800">
                      در حال ثبت تاریخ تولدها، لطفاً صبر کنید...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {birthdateEntries.map((entry, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 flex items-center justify-between ${
                    entry.status === "success"
                      ? "border-green-200 bg-green-50"
                      : entry.status === "error"
                      ? "border-red-200 bg-red-50"
                      : entry.status === "processing"
                      ? "border-purple-200 bg-purple-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">
                      {entry.studentName
                        ? `${entry.studentName} ${entry.studentFamily}`
                        : entry.studentCode}
                    </p>
                    <p className="text-xs text-gray-600">
                      تاریخ تولد: {entry.formattedBirthdate}
                    </p>
                    {entry.error && (
                      <p className="text-xs text-red-600 mt-1">{entry.error}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {entry.status === "processing" && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    )}
                    {entry.status === "success" && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    )}
                    {entry.status === "error" && (
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isProcessing && updateResults.length > 0 && (
              <div className="mt-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    خلاصه نتایج
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-600 font-medium">
                        موفق: {updateResults.filter((r) => r.success).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-red-600 font-medium">
                        ناموفق: {updateResults.filter((r) => !r.success).length}
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
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
              <div className="mr-3">
                <p
                  className={`text-sm font-medium ${
                    index <= currentStep ? "text-purple-600" : "text-gray-500"
                  }`}
                >
                  {title}
                </p>
              </div>
              {index < STEP_TITLES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? "bg-purple-600" : "bg-gray-200"
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
          {currentStep === 0 && (
            <button
              onClick={nextStep}
              disabled={birthdateEntries.length === 0}
              className={`inline-flex items-center px-6 py-2 text-sm font-medium border border-transparent rounded-lg transition-colors ${
                birthdateEntries.length > 0
                  ? "text-white bg-purple-600 hover:bg-purple-700"
                  : "text-gray-400 bg-gray-200 cursor-not-allowed"
              }`}
            >
              مرحله بعد
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
            </button>
          )}

          {currentStep === 1 && birthdateEntries.length > 0 && (
            <button
              onClick={nextStep}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 transition-colors"
            >
              تأیید نهایی
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
            </button>
          )}

          {currentStep === 2 && !isProcessing && (
            <button
              onClick={startUpdate}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CalendarDaysIcon className="h-4 w-4 ml-2" />
              شروع ثبت
            </button>
          )}

          {currentStep === 3 && !isProcessing && (
            <button
              onClick={resetWizard}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 transition-colors"
            >
              ثبت جدید
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
