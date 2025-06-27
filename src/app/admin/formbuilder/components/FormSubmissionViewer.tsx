"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Eye, Download, FileDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface FormSubmissionViewerProps {
  formId: string;
  formTitle?: string;
  trigger?: React.ReactNode;
}

// Simple interface for file uploads
interface FileUpload {
  path: string;
  originalName?: string;
  filename?: string;
}

// Use unknown type to satisfy the linter without circular references
interface Submission {
  _id: string;
  formId: string;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
  username?: string;
  userName?: string;
  userFamily?: string;
  userType?: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function FormSubmissionViewer({
  formId,
  formTitle = "پاسخ‌های فرم",
  trigger,
}: FormSubmissionViewerProps) {
  const [open, setOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(
    null
  );
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);

  // Fetch submissions when dialog opens or page changes
  useEffect(() => {
    if (open) {
      fetchSubmissions(pagination.page);
    }
  }, [open, pagination.page, formId]);

  const fetchSubmissions = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/formbuilder/submissions?formId=${formId}&page=${page}&limit=${pagination.limit}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError(err instanceof Error ? err.message : "خطا در دریافت  اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = (submission: Submission) => {
    setViewingSubmission(submission);
    setSubmissionDialogOpen(true);
  };

  const handleExportToExcel = async () => {
    try {
      setLoading(true);

      // Create a URL for the Excel export endpoint
      const exportUrl = `/api/formbuilder/export-excel?formId=${formId}`;

      // Create a hidden link element to trigger the download
      const link = document.createElement("a");
      link.href = exportUrl;
      link.target = "_blank";
      link.download = `${formTitle || "form-submissions"}.xlsx`;

      // Add any required headers using fetch
      const response = await fetch(exportUrl, {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export Excel file");
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create an object URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Update the link href
      link.href = url;

      // Append to the document, click, and remove
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("خطا در ایجاد فایل اکسل");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString("fa-IR") +
        " " +
        date.toLocaleTimeString("fa-IR")
      );
    } catch {
      return dateString;
    }
  };

  // Render submission details dialog
  const renderSubmissionDetails = () => {
    if (!viewingSubmission) return null;

    return (
      <Dialog
        open={submissionDialogOpen}
        onOpenChange={setSubmissionDialogOpen}
      >
        <DialogContent
          className="max-w-4xl bg-gradient-to-br from-gray-50 to-white"
          dir="rtl"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          <DialogHeader className="border-b border-gray-100 pb-6">
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center">
              <Eye className="h-6 w-6 ml-3 text-indigo-500" />
              جزئیات پاسخ ارسالی
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-4 mt-4">
                {/* Date and Time Card */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg ml-3">
                      <Eye className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">زمان ارسال</h4>
                      <p className="text-blue-600 text-sm">
                        {formatDate(viewingSubmission.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                    <h4 className="font-medium text-green-800 mb-2">
                      اطلاعات کاربری
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-600 text-sm">
                          کد کاربری:
                        </span>
                        <strong className="text-green-800">
                          {viewingSubmission.username ||
                            viewingSubmission.submittedBy}
                        </strong>
                      </div>
                      {viewingSubmission.userType && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-600 text-sm">
                            نوع کاربر:
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-green-100 border-green-300 text-green-700 text-xs"
                          >
                            {viewingSubmission.userType === "student"
                              ? "دانش آموز"
                              : viewingSubmission.userType === "teacher"
                              ? "معلم"
                              : viewingSubmission.userType === "school"
                              ? "مدرسه"
                              : viewingSubmission.userType}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                    <h4 className="font-medium text-purple-800 mb-2">
                      اطلاعات شخصی
                    </h4>
                    <div className="space-y-2">
                      {viewingSubmission.userName && (
                        <div className="flex justify-between">
                          <span className="text-purple-600 text-sm">نام:</span>
                          <strong className="text-purple-800">
                            {viewingSubmission.userName}
                          </strong>
                        </div>
                      )}
                      {viewingSubmission.userFamily && (
                        <div className="flex justify-between">
                          <span className="text-purple-600 text-sm">
                            نام خانوادگی:
                          </span>
                          <strong className="text-purple-800">
                            {viewingSubmission.userFamily}
                          </strong>
                        </div>
                      )}
                      {!viewingSubmission.userName &&
                        !viewingSubmission.userFamily && (
                          <p className="text-purple-500 text-sm italic">
                            اطلاعات شخصی ثبت نشده
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] mt-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b border-gray-100 pb-3">
                <FileDown className="h-5 w-5 ml-2 text-indigo-500" />
                پاسخ‌های ارسالی
              </h3>
              <div className="space-y-6">
                {Object.entries(viewingSubmission.answers).map(
                  ([key, value], index) => (
                    <div
                      key={key}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-700 text-right flex items-center">
                          <span className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ml-2">
                            {index + 1}
                          </span>
                          {key}
                        </h4>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100 text-right">
                        {renderSubmissionValue(value)}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-100 pt-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setSubmissionDialogOpen(false)}
              className="bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-6"
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Helper function to render different value types
  const renderSubmissionValue = (value: unknown) => {
    if (value === null || value === undefined) {
      return (
        <span className="text-gray-400 italic bg-gray-50 px-2 py-1 rounded">
          پاسخ داده نشده
        </span>
      );
    }

    // Handle file uploads
    if (
      typeof value === "object" &&
      value !== null &&
      "path" in value &&
      typeof (value as FileUpload).path === "string"
    ) {
      const fileValue = value as FileUpload;
      return (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FileDown className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <a
              href={fileValue.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
            >
              {fileValue.originalName || fileValue.filename || "فایل ضمیمه"}
            </a>
            <p className="text-xs text-blue-500 mt-1">کلیک برای دانلود</p>
          </div>
        </div>
      );
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 p-2 rounded-lg"
            >
              <span className="bg-indigo-100 text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                {index + 1}
              </span>
              <div className="flex-1">{renderSubmissionValue(item)}</div>
            </div>
          ))}
        </div>
      );
    }

    // Handle objects (nested data)
    if (typeof value === "object" && value !== null) {
      return (
        <div className="space-y-3 bg-gray-50 border border-gray-200 p-4 rounded-lg">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div
              key={k}
              className="bg-white p-3 rounded-lg border border-gray-100"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-gray-700 text-sm">
                  {k}:
                </span>
              </div>
              <div className="text-right">{renderSubmissionValue(v)}</div>
            </div>
          ))}
        </div>
      );
    }

    // Handle boolean values
    if (typeof value === "boolean") {
      return value ? (
        <Badge
          variant="outline"
          className="bg-green-50 border-green-200 text-green-700 px-3 py-1 rounded-lg font-medium"
        >
          ✓ بله
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="bg-red-50 border-red-200 text-red-700 px-3 py-1 rounded-lg font-medium"
        >
          ✗ خیر
        </Badge>
      );
    }

    // Default: return as string with better styling
    return (
      <span className="text-gray-800 leading-relaxed">{String(value)}</span>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 ml-2" />
              مشاهده پاسخ‌ها
            </Button>
          )}
        </DialogTrigger>
        <DialogContent
          className="max-w-6xl max-h-[90vh] bg-gradient-to-br from-gray-50 to-white"
          dir="rtl"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center">
              <Eye className="h-6 w-6 ml-3 text-blue-500" />
              {formTitle} - پاسخ‌های دریافتی
            </DialogTitle>
            <DialogDescription className="text-gray-600 bg-blue-50 px-4 py-2 rounded-lg mt-2">
              <span className="font-semibold text-blue-700">
                {pagination.total}
              </span>{" "}
              پاسخ ثبت شده است
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileDown className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">مدیریت پاسخ‌ها</h3>
                <p className="text-sm text-gray-500">
                  دریافت و مشاهده پاسخ‌های ارسالی
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 rounded-lg transition-all duration-200"
            >
              <Download className="h-4 w-4 ml-2" />
              خروجی اکسل
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 flex items-center">
              <div className="bg-red-100 p-2 rounded-lg ml-3">
                <Eye className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium">خطا در دریافت اطلاعات</h4>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="overflow-auto max-h-[60vh] bg-white rounded-xl border border-gray-200 shadow-sm">
            <Table className="text-right">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>کد کاربری</TableHead>
                  <TableHead>نام</TableHead>
                  <TableHead>نام خانوادگی</TableHead>
                  <TableHead>نوع کاربر</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell>
                        <Skeleton className="h-5 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-9 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-gray-500"
                    >
                      هیچ پاسخی ثبت نشده است
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission, index) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell>
                        {submission.username || submission.submittedBy}
                      </TableCell>
                      <TableCell>{submission.userName || "-"}</TableCell>
                      <TableCell>{submission.userFamily || "-"}</TableCell>
                      <TableCell>
                        {submission.userType ? (
                          <Badge variant="outline" className="text-xs">
                            {submission.userType === "student"
                              ? "دانش آموز"
                              : submission.userType === "teacher"
                              ? "معلم"
                              : submission.userType === "school"
                              ? "مدرسه"
                              : submission.userType}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{formatDate(submission.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSubmission(submission)}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          مشاهده
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.pages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.page > 1) {
                        setPagination({
                          ...pagination,
                          page: pagination.page - 1,
                        });
                      }
                    }}
                  />
                </PaginationItem>

                {Array.from({ length: pagination.pages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPagination({ ...pagination, page: index + 1 });
                      }}
                      isActive={pagination.page === index + 1}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.page < pagination.pages) {
                        setPagination({
                          ...pagination,
                          page: pagination.page + 1,
                        });
                      }
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </DialogContent>
      </Dialog>

      {renderSubmissionDetails()}
    </>
  );
}
