import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ScanResult {
  qRCodeData?: string;
  rightAnswers: number[];
  wrongAnswers: number[];
  multipleAnswers: number[];
  unAnswered: number[];
  Useranswers: number[];
  correctedImageUrl: string;
  originalFilename?: string;
  processedFilePath?: string;
}

interface ScanAnswerSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
}

export default function ScanAnswerSheetModal({
  isOpen,
  onClose,
  examId,
}: ScanAnswerSheetModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedScanner, setSelectedScanner] = useState<string>("scanner");

  // Fetch previous scan results on mount
  React.useEffect(() => {
    if (isOpen && examId) {
      fetchScanHistory();
    }
  }, [isOpen, examId]);

  const fetchScanHistory = async () => {
    setIsLoadingHistory(true);
    try {
      console.log(`📋 [ScanModal] Fetching scan history for examId: ${examId}`);
      const response = await fetch(`/api/scan/history?examId=${examId}`);
      console.log(`📋 [ScanModal] Response status:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📋 [ScanModal] Response data:`, data);
        
        if (data.success && data.results) {
          console.log(`📋 [ScanModal] Setting ${data.results.length} results to state`);
          setResults(data.results);
          console.log(`📋 [ScanModal] Results state updated, length:`, data.results.length);
        } else {
          console.log(`📋 [ScanModal] No results in response or success=false`);
        }
      } else {
        const errorData = await response.json();
        console.error(`📋 [ScanModal] API error:`, errorData);
      }
    } catch (error) {
      console.error("📋 [ScanModal] Error fetching scan history:", error);
    } finally {
      setIsLoadingHistory(false);
      console.log(`📋 [ScanModal] Loading finished, current results count:`, results.length);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
      setError(null);
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setError("لطفا حداقل یک فایل انتخاب کنید");
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("examId", examId);
      formData.append("scanner", selectedScanner);

      selectedFiles.forEach((file) => {
        formData.append(`files`, file);
      });

      const response = await fetch("/api/scan/batch", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در اسکن پاسخ‌برگ‌ها");
      }

      const data = await response.json();
      // Append new results to existing results instead of replacing
      setResults((prevResults) => [...prevResults, ...data.results]);
      setViewMode("list");
      setSelectedResult(null);
      // Clear selected files after successful upload
      setSelectedFiles([]);
    } catch (err) {
      console.error("Error scanning answer sheets:", err);
      setError(err instanceof Error ? err.message : "خطا در اسکن پاسخ‌برگ‌ها");
    } finally {
      setIsUploading(false);
      setProgress(100);
    }
  };

  const showResultDetail = (result: ScanResult) => {
    setSelectedResult(result);
    setViewMode("detail");
  };

  const backToList = () => {
    setViewMode("list");
    setSelectedResult(null);
  };

  const clearAllResults = () => {
    // Only clear from view, doesn't delete from database
    // Results will reload when modal reopens
    setResults([]);
    setSelectedFiles([]);
    setError(null);
    setViewMode("list");
  };

  const renderResultsList = () => {
    console.log(`📋 [ScanModal] renderResultsList called, results.length:`, results.length);
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-bold text-green-800">نتایج اسکن پاسخ‌برگ‌ها</h3>
              <p className="text-xs text-green-600">
                {results.length} پاسخ‌برگ در مجموع
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllResults}
            className="text-red-600 border-red-200 hover:bg-red-50"
            title="این فقط از نمایش پاک می‌کند، نتایج در دیتابیس باقی می‌مانند"
          >
            <XMarkIcon className="w-4 h-4 ml-1" />
            پنهان کردن لیست
          </Button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-3 text-xs text-blue-700 flex items-center gap-2">
          <span>ℹ️</span>
          <span>تمام نتایج در پایگاه داده ذخیره شده و با بازگشایی مجدد نمایش داده می‌شوند</span>
        </div>
        <div className="max-h-60 overflow-y-auto bg-white rounded border p-2">
          {results.map((result: any, index) => (
            <div
              key={index}
              className="py-2 px-3 text-sm border-b last:border-0 hover:bg-blue-50 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="font-medium">
                    {result.qRCodeData || result.studentCode || `پاسخ‌برگ ${index + 1}`}
                  </span>
                  {result.scannedAt && (
                    <span className="text-xs text-gray-500 mr-2">
                      ({new Date(result.scannedAt).toLocaleDateString('fa-IR', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    {result.rightAnswers?.length || 0} صحیح
                  </span>
                  {result.score !== undefined && result.maxScore && (
                    <span className="text-blue-600 text-xs">
                      ({result.score}/{result.maxScore})
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => showResultDetail(result)}
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                    جزئیات
                  </Button>
                </div>
              </div>
              {result.originalFilename && (
                <div className="mt-1 text-xs text-gray-500">
                  📄 {result.originalFilename}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderResultDetail = () => {
    if (!selectedResult) return null;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 border-gray-200"
            onClick={backToList}
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4 rotate-180 ml-1" />
            بازگشت به لیست
          </Button>
          <h3 className="font-bold text-lg">
            {selectedResult.qRCodeData || "پاسخ‌برگ"}
          </h3>
        </div>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="mb-2 w-full grid grid-cols-3">
            <TabsTrigger value="scan">تصویر اسکن شده</TabsTrigger>
            <TabsTrigger value="correct">پاسخ‌های صحیح</TabsTrigger>
            <TabsTrigger value="results">نتایج</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-4">
            <div className="bg-white p-4 border rounded-lg">
              <div className="font-medium text-center mb-2">
                تصویر اسکن شده و تصحیح شده
              </div>
              <div className="relative overflow-hidden rounded-lg border bg-gray-100 flex justify-center">
                {selectedResult.correctedImageUrl ? (
                  <img
                    src={selectedResult.correctedImageUrl.replace(
                      "/../public",
                      ""
                    )+"?v="+new Date().getTime()}
                    alt="Corrected Answer Sheet"
                    className="max-w-full object-contain max-h-[500px]"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    تصویر تصحیح شده موجود نیست
                  </div>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500 text-center">
                تصویر پاسخنامه پس از تصحیح
              </div>
            </div>
          </TabsContent>

          <TabsContent value="correct">
            <div className="bg-white p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-600 mb-2 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 ml-1" />
                    پاسخ‌های صحیح ({selectedResult.rightAnswers.length})
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {selectedResult.rightAnswers.length > 0 ? (
                      <ul className="grid grid-cols-4 gap-2">
                        {selectedResult.rightAnswers.map((qNum) => (
                          <li
                            key={`right-${qNum}`}
                            className="bg-white border border-green-300 rounded px-2 py-1 text-center text-green-700"
                          >
                            {qNum}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-sm text-gray-500">
                        پاسخ صحیحی یافت نشد
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-red-600 mb-2 flex items-center">
                    <XMarkIcon className="h-5 w-5 ml-1" />
                    پاسخ‌های نادرست ({selectedResult.wrongAnswers.length})
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {selectedResult.wrongAnswers.length > 0 ? (
                      <ul className="grid grid-cols-4 gap-2">
                        {selectedResult.wrongAnswers.map((qNum) => (
                          <li
                            key={`wrong-${qNum}`}
                            className="bg-white border border-red-300 rounded px-2 py-1 text-center text-red-700"
                          >
                            {qNum}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-sm text-gray-500">
                        پاسخ نادرستی یافت نشد
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-medium text-gray-600 mb-2 flex items-center">
                    بدون پاسخ ({selectedResult.unAnswered.length})
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {selectedResult.unAnswered.length > 0 ? (
                      <ul className="grid grid-cols-4 gap-2">
                        {selectedResult.unAnswered.map((qNum) => (
                          <li
                            key={`empty-${qNum}`}
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-center text-gray-500"
                          >
                            {qNum}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-sm text-gray-500">
                        همه سوالات پاسخ داده شده‌اند
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-orange-600 mb-2 flex items-center">
                    چند گزینه‌ای ({selectedResult.multipleAnswers.length})
                  </h4>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {selectedResult.multipleAnswers.length > 0 ? (
                      <ul className="grid grid-cols-4 gap-2">
                        {selectedResult.multipleAnswers.map((qNum) => (
                          <li
                            key={`multi-${qNum}`}
                            className="bg-white border border-orange-300 rounded px-2 py-1 text-center text-orange-700"
                          >
                            {qNum}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-sm text-gray-500">
                        سوالی با چند پاسخ یافت نشد
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results">
            <div className="bg-white p-4 border rounded-lg">
              <h4 className="font-medium mb-3">نتیجه نهایی</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3 bg-blue-50 text-center">
                  <div className="text-sm text-gray-500 mb-1">
                    تعداد کل سوالات
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {selectedResult.rightAnswers.length +
                      selectedResult.wrongAnswers.length +
                      selectedResult.unAnswered.length +
                      selectedResult.multipleAnswers.length}
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-green-50 text-center">
                  <div className="text-sm text-gray-500 mb-1">نمره کسب شده</div>
                  <div className="text-2xl font-bold text-green-700">
                    {selectedResult.rightAnswers.length}
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-gray-50 text-center">
                  <div className="text-sm text-gray-500 mb-1">
                    شناسه دانش‌آموز
                  </div>
                  <div className="font-medium">
                    {selectedResult.qRCodeData || "نامشخص"}
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-gray-50 text-center">
                  <div className="text-sm text-gray-500 mb-1">فایل اصلی</div>
                  <div className="font-medium truncate">
                    {selectedResult.originalFilename || "نامشخص"}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Debug log in render
  console.log(`📋 [ScanModal] Rendering - results.length: ${results.length}, viewMode: ${viewMode}, isLoadingHistory: ${isLoadingHistory}`);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <DocumentArrowUpIcon className="w-6 h-6 ml-2 text-blue-600" />
            اسکن پاسخ‌برگ‌های آزمون
            {results.length > 0 && (
              <span className="mr-2 text-sm font-normal text-green-600">
                ({results.length} نتیجه)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Loading History Indicator */}
          {isLoadingHistory && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center">
              <Spinner className="w-5 h-5 ml-2" />
              <p>در حال بارگذاری نتایج قبلی...</p>
            </div>
          )}

          {/* Show Upload UI when in list view */}
          {viewMode === "list" && (
            <>
              {/* Scanner Selection */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
                <label className="block text-sm font-bold text-purple-800 mb-2">
                  🔧 انتخاب الگوریتم تصحیح
                </label>
                <select
                  value={selectedScanner}
                  onChange={(e) => setSelectedScanner(e.target.value)}
                  className="w-full p-2 border-2 border-purple-300 rounded-lg bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-right"
                >
                  <option value="scanner">الگوریتم پیش‌فرض (scanner.py)</option>
                  <option value="scanner2">الگوریتم نسخه 2 - پردازش فضایی (scanner2.py)</option>
                  <option value="scanner3">الگوریتم نسخه 3 - تشخیص پیشرفته (scanner3.py)</option>
                  <option value="scanner4">الگوریتم نسخه 4 - دقت بالا (scanner4.py)</option>
                </select>
                <p className="text-xs text-purple-600 mt-2">
                  💡 هر الگوریتم روش متفاوتی برای تشخیص و تصحیح پاسخ‌ها دارد. الگوریتم‌های جدیدتر معمولاً دقت بیشتری دارند.
                </p>
              </div>

              {/* File upload area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  selectedFiles.length > 0
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-300"
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="fileUpload"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {selectedFiles.length === 0 ? (
                  <div>
                    <DocumentArrowUpIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    {results.length > 0 ? (
                      <>
                        <p className="text-gray-700 mb-2 font-medium">
                          ✅ {results.length} پاسخ‌برگ قبلی بارگذاری شد
                        </p>
                        <p className="text-gray-600 mb-2">
                          برای اسکن پاسخ‌برگ‌های جدید، فایل‌ها را اینجا بکشید
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-600 mb-2">
                        فایل‌های تصویر پاسخ‌برگ را اینجا بکشید و رها کنید
                      </p>
                    )}
                    <p className="text-gray-500 text-sm mb-4">یا</p>
                    <Button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() =>
                        document.getElementById("fileUpload")?.click()
                      }
                    >
                      {results.length > 0 ? "اسکن پاسخ‌برگ‌های جدید" : "انتخاب فایل‌ها"}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-bold text-blue-700">
                        {selectedFiles.length} فایل انتخاب شده
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFiles}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XMarkIcon className="w-4 h-4 ml-1" /> حذف همه
                      </Button>
                    </div>

                    <div className="max-h-40 overflow-y-auto bg-white p-2 rounded-lg border text-right">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="py-1 px-2 text-sm border-b last:border-0 flex justify-between items-center"
                        >
                          <span className="truncate">{file.name}</span>
                          <span className="text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                  <ExclamationCircleIcon className="w-5 h-5 ml-2 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {isUploading && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Spinner className="w-5 h-5 ml-2" />
                    <p>در حال اسکن پاسخ‌برگ‌ها...</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Always show results list when there are results */}
              {results.length > 0 && renderResultsList()}
            </>
          )}

          {/* Show Result Detail */}
          {viewMode === "detail" && renderResultDetail()}

          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300"
            >
              بستن
            </Button>

            {viewMode === "list" && selectedFiles.length > 0 && (
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={selectedFiles.length === 0 || isUploading}
                onClick={uploadFiles}
              >
                {isUploading ? (
                  <>
                    <Spinner className="w-4 h-4 ml-2" />
                    در حال پردازش با {selectedScanner}.py...
                  </>
                ) : (
                  <>
                    <DocumentArrowUpIcon className="w-4 h-4 ml-2" />
                    اسکن {selectedFiles.length} پاسخ‌برگ با {selectedScanner}.py
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
