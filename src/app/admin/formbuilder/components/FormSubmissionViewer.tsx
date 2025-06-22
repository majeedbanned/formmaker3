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
      setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات");
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>جزئیات پاسخ</DialogTitle>
            <DialogDescription>
              <div className="space-y-2">
                <div>
                  ارسال شده در {formatDate(viewingSubmission.createdAt)}
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span>
                    کد کاربری:{" "}
                    <strong>
                      {viewingSubmission.username ||
                        viewingSubmission.submittedBy}
                    </strong>
                  </span>
                  {viewingSubmission.userName && (
                    <span>
                      نام: <strong>{viewingSubmission.userName}</strong>
                    </span>
                  )}
                  {viewingSubmission.userFamily && (
                    <span>
                      نام خانوادگی:{" "}
                      <strong>{viewingSubmission.userFamily}</strong>
                    </span>
                  )}
                  {viewingSubmission.userType && (
                    <Badge variant="outline" className="text-xs">
                      {viewingSubmission.userType === "student"
                        ? "دانش آموز"
                        : viewingSubmission.userType === "teacher"
                        ? "معلم"
                        : viewingSubmission.userType === "school"
                        ? "مدرسه"
                        : viewingSubmission.userType}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh]">
            <div className="space-y-4">
              {Object.entries(viewingSubmission.answers).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <h4 className="font-medium">{key}</h4>
                  <div className="mt-1">{renderSubmissionValue(value)}</div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmissionDialogOpen(false)}
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
      return <span className="text-gray-400">-</span>;
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
        <div className="flex items-center gap-2">
          <FileDown className="h-4 w-4 text-blue-500" />
          <a
            href={fileValue.path}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {fileValue.originalName || fileValue.filename}
          </a>
        </div>
      );
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside">
          {value.map((item, index) => (
            <li key={index}>{renderSubmissionValue(item)}</li>
          ))}
        </ul>
      );
    }

    // Handle objects (nested data)
    if (typeof value === "object" && value !== null) {
      return (
        <div className="pl-4 border-l border-gray-200">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="mt-1">
              <span className="font-medium">{k}: </span>
              {renderSubmissionValue(v)}
            </div>
          ))}
        </div>
      );
    }

    // Handle boolean values
    if (typeof value === "boolean") {
      return value ? (
        <Badge variant="outline" className="bg-green-50 text-green-600">
          بله
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-red-50 text-red-600">
          خیر
        </Badge>
      );
    }

    // Default: return as string
    return <span>{String(value)}</span>;
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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{formTitle} - پاسخ‌های دریافتی</DialogTitle>
            <DialogDescription>
              {pagination.total} پاسخ ثبت شده است
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={handleExportToExcel}>
              <Download className="h-4 w-4 ml-2" />
              خروجی اکسل
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="overflow-auto max-h-[60vh]">
            <Table>
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
