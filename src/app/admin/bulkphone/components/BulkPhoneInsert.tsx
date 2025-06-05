"use client";

import { useState, useRef, useCallback } from "react";
import {
  ClipboardDocumentIcon,
  PhoneIcon,
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

interface BulkPhoneInsertProps {
  user: User;
}

interface PhoneEntry {
  studentCode: string;
  studentName?: string;
  studentFamily?: string;
  phones: Array<{
    owner: string;
    number: string;
  }>;
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

const PHONE_OWNERS = ["پدر", "مادر", "دانش‌آموز", "سایر"];

export default function BulkPhoneInsert({ user }: BulkPhoneInsertProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [phoneEntries, setPhoneEntries] = useState<PhoneEntry[]>([]);
  const [pastedData, setPastedData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse Excel-like data from clipboard or text input
  const parseInputData = useCallback((text: string): PhoneEntry[] => {
    if (!text.trim()) return [];

    const lines = text.trim().split("\n");
    const entries: PhoneEntry[] = [];

    lines.forEach((line) => {
      // Skip empty lines
      if (!line.trim()) return;

      // Split by tab (Excel copy) or comma or semicolon
      const parts = line
        .split(/[\t,;]/)
        .map((part) => part.trim())
        .filter(Boolean);

      if (parts.length < 2) return; // Need at least student code and one phone

      const studentCode = parts[0];
      const phones: Array<{ owner: string; number: string }> = [];

      // Process phone numbers - can be in various formats:
      // Format 1: studentCode, phone1, phone2, ...
      // Format 2: studentCode, owner1:phone1, owner2:phone2, ...
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];

        if (part.includes(":")) {
          // Format with owner specified: "مادر:09123456789"
          const [owner, number] = part.split(":").map((p) => p.trim());
          if (owner && number) {
            phones.push({ owner, number });
          }
        } else {
          // Simple phone number, assign default owner based on position
          const defaultOwners = ["پدر", "مادر", "سرپرست"];
          const owner = defaultOwners[(i - 1) % defaultOwners.length];
          phones.push({ owner, number: part });
        }
      }

      if (phones.length > 0) {
        entries.push({
          studentCode,
          phones,
          status: "pending",
        });
      }
    });

    return entries;
  }, []);

  // Handle text area input
  const handleTextInput = useCallback(
    (value: string) => {
      setPastedData(value);
      const parsed = parseInputData(value);
      setPhoneEntries(parsed);
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
      phoneEntries.map(async (entry) => {
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
    setPhoneEntries(updatedEntries);
  }, [phoneEntries, fetchStudentDetails]);

  // Update phone numbers for a single student
  const updateStudentPhones = useCallback(
    async (entry: PhoneEntry): Promise<UpdateResult> => {
      try {
        const response = await fetch("/api/students/update-phones", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            studentCode: entry.studentCode,
            phones: entry.phones,
            action: "add", // Add new phones without removing existing ones
          }),
        });

        const result = await response.json();

        if (response.ok) {
          return {
            studentCode: entry.studentCode,
            success: true,
            message: "شماره تلفن‌ها با موفقیت ثبت شدند",
          };
        } else {
          return {
            studentCode: entry.studentCode,
            success: false,
            message: result.error || "خطا در ثبت شماره تلفن‌ها",
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
    setPhoneEntries((prev) =>
      prev.map((entry) => ({ ...entry, status: "processing" as const }))
    );

    // Process entries one by one
    for (let i = 0; i < phoneEntries.length; i++) {
      const entry = phoneEntries[i];
      const result = await updateStudentPhones(entry);
      results.push(result);

      // Update individual entry status
      setPhoneEntries((prev) =>
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
  }, [phoneEntries, updateStudentPhones]);

  // Remove entry from list
  const removeEntry = useCallback((index: number) => {
    setPhoneEntries((prev) => {
      const newEntries = [...prev];
      newEntries.splice(index, 1);
      return newEntries;
    });
  }, []);

  // Update student code manually
  const updateStudentCode = useCallback((index: number, newCode: string) => {
    setPhoneEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, studentCode: newCode } : entry
      )
    );
  }, []);

  // Update phone entry
  const updatePhoneEntry = useCallback(
    (
      entryIndex: number,
      phoneIndex: number,
      field: "owner" | "number",
      value: string
    ) => {
      setPhoneEntries((prev) =>
        prev.map((entry, i) =>
          i === entryIndex
            ? {
                ...entry,
                phones: entry.phones.map((phone, j) =>
                  j === phoneIndex ? { ...phone, [field]: value } : phone
                ),
              }
            : entry
        )
      );
    },
    []
  );

  // Add new phone to entry
  const addPhoneToEntry = useCallback((entryIndex: number) => {
    setPhoneEntries((prev) =>
      prev.map((entry, i) =>
        i === entryIndex
          ? {
              ...entry,
              phones: [...entry.phones, { owner: "پدر", number: "" }],
            }
          : entry
      )
    );
  }, []);

  // Remove phone from entry
  const removePhoneFromEntry = useCallback(
    (entryIndex: number, phoneIndex: number) => {
      setPhoneEntries((prev) =>
        prev.map((entry, i) =>
          i === entryIndex
            ? {
                ...entry,
                phones: entry.phones.filter((_, j) => j !== phoneIndex),
              }
            : entry
        )
      );
    },
    []
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
    setPhoneEntries([]);
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
                ورود داده‌های شماره تلفن
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                شما می‌توانید داده‌ها را از اکسل کپی کنید یا به صورت دستی وارد
                کنید
              </p>

              {/* Format examples */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  نمونه فرمت‌های قابل قبول:
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <code dir="ltr">123456 09123456789 09987654321</code>
                  </p>
                  <p>
                    <code dir="ltr">
                      123457 پدر:09123456789 مادر:09987654321
                    </code>
                  </p>
                  <p>
                    <code dir="ltr">123458,09123456789,سرپرست:09111111111</code>
                  </p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  هر خط یک دانش‌آموز، جداکننده: فاصله، کاما، یا سمی‌کولن
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={handlePaste}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
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
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder={`نمونه:
123456 09123456789 09987654321
123457 پدر:09123456789 مادر:09987654321
123458,09123456789,سرپرست:09111111111`}
                  dir="ltr"
                />
              </div>

              {phoneEntries.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    ✅ {phoneEntries.length} دانش‌آموز با{" "}
                    {phoneEntries.reduce(
                      (total, entry) => total + entry.phones.length,
                      0
                    )}{" "}
                    شماره تلفن شناسایی شد
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              بررسی و ویرایش داده‌ها ({phoneEntries.length} دانش‌آموز)
            </h3>

            <div className="space-y-4">
              {phoneEntries.map((entry, entryIndex) => (
                <div
                  key={entryIndex}
                  className="border rounded-lg p-4 bg-white shadow-sm"
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
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-700">
                        شماره تلفن‌ها:
                      </h4>
                      <button
                        onClick={() => addPhoneToEntry(entryIndex)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100"
                      >
                        <PlusIcon className="h-3 w-3 ml-1" />
                        افزودن
                      </button>
                    </div>

                    {entry.phones.map((phone, phoneIndex) => (
                      <div key={phoneIndex} className="flex gap-2 items-center">
                        <select
                          value={phone.owner}
                          onChange={(e) =>
                            updatePhoneEntry(
                              entryIndex,
                              phoneIndex,
                              "owner",
                              e.target.value
                            )
                          }
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {PHONE_OWNERS.map((owner) => (
                            <option key={owner} value={owner}>
                              {owner}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={phone.number}
                          onChange={(e) =>
                            updatePhoneEntry(
                              entryIndex,
                              phoneIndex,
                              "number",
                              e.target.value
                            )
                          }
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="شماره تلفن"
                          dir="ltr"
                        />

                        {entry.phones.length > 1 && (
                          <button
                            onClick={() =>
                              removePhoneFromEntry(entryIndex, phoneIndex)
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
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
                    شماره تلفن‌های جدید به لیست موجود اضافه خواهند شد. شماره‌های
                    تکراری بروزرسانی می‌شوند.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {phoneEntries.map((entry, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-white shadow-sm"
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
                      <p className="text-xs text-gray-500 mb-1">
                        شماره تلفن‌ها:
                      </p>
                      {entry.phones.map((phone, phoneIndex) => (
                        <p key={phoneIndex} className="text-sm text-gray-700">
                          {phone.owner}: {phone.number}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">آماده ثبت:</span>{" "}
                {phoneEntries.length} دانش‌آموز با{" "}
                {phoneEntries.reduce(
                  (total, entry) => total + entry.phones.length,
                  0
                )}{" "}
                شماره تلفن
              </p>
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 ml-3"></div>
                    <p className="text-blue-800">
                      در حال ثبت شماره تلفن‌ها، لطفاً صبر کنید...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {phoneEntries.map((entry, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 flex items-center justify-between ${
                    entry.status === "success"
                      ? "border-green-200 bg-green-50"
                      : entry.status === "error"
                      ? "border-red-200 bg-red-50"
                      : entry.status === "processing"
                      ? "border-blue-200 bg-blue-50"
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
                      {entry.phones.length} شماره تلفن
                    </p>
                    {entry.error && (
                      <p className="text-xs text-red-600 mt-1">{entry.error}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {entry.status === "processing" && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
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
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
              <div className="mr-3">
                <p
                  className={`text-sm font-medium ${
                    index <= currentStep ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {title}
                </p>
              </div>
              {index < STEP_TITLES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? "bg-green-600" : "bg-gray-200"
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
              disabled={phoneEntries.length === 0}
              className={`inline-flex items-center px-6 py-2 text-sm font-medium border border-transparent rounded-lg transition-colors ${
                phoneEntries.length > 0
                  ? "text-white bg-green-600 hover:bg-green-700"
                  : "text-gray-400 bg-gray-200 cursor-not-allowed"
              }`}
            >
              مرحله بعد
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
            </button>
          )}

          {currentStep === 1 && phoneEntries.length > 0 && (
            <button
              onClick={nextStep}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
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
              <PhoneIcon className="h-4 w-4 ml-2" />
              شروع ثبت
            </button>
          )}

          {currentStep === 3 && !isProcessing && (
            <button
              onClick={resetWizard}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
            >
              ثبت جدید
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
