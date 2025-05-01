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
} from "@heroicons/react/24/outline";

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
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

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
    setResults([]);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("examId", examId);

      selectedFiles.forEach((file, index) => {
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
      setResults(data.results);
    } catch (err) {
      console.error("Error scanning answer sheets:", err);
      setError(err instanceof Error ? err.message : "خطا در اسکن پاسخ‌برگ‌ها");
    } finally {
      setIsUploading(false);
      setProgress(100);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <DocumentArrowUpIcon className="w-6 h-6 ml-2 text-blue-600" />
            اسکن پاسخ‌برگ‌های آزمون
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* File upload area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
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
                <p className="text-gray-600 mb-2">
                  فایل‌های تصویر پاسخ‌برگ را اینجا بکشید و رها کنید
                </p>
                <p className="text-gray-500 text-sm mb-4">یا</p>
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => document.getElementById("fileUpload")?.click()}
                >
                  انتخاب فایل‌ها
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

          {results.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <CheckCircleIcon className="w-5 h-5 ml-2 text-green-600" />
                <h3 className="font-bold text-green-800">
                  اسکن با موفقیت انجام شد
                </h3>
              </div>
              <p className="mb-2 text-green-700">
                {results.length} پاسخ‌برگ با موفقیت اسکن و ثبت شد.
              </p>
              <div className="max-h-40 overflow-y-auto bg-white rounded border p-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="py-1 px-2 text-sm border-b last:border-0 flex justify-between"
                  >
                    <span className="font-medium">
                      {result.qRCodeData || `پاسخ‌برگ ${index + 1}`}
                    </span>
                    <span className="text-green-600">
                      {result.rightAnswers?.length || 0} پاسخ صحیح
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300"
            >
              بستن
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={selectedFiles.length === 0 || isUploading}
              onClick={uploadFiles}
            >
              {isUploading ? (
                <>
                  <Spinner className="w-4 h-4 ml-2" />
                  در حال پردازش...
                </>
              ) : (
                "اسکن پاسخ‌برگ‌ها"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
