"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  FileText,
  Calendar,
  AlertCircle,
  MessageSquare,
  FileDown,
  RefreshCw,
  Mail,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FormSubmission {
  _id: string;
  formId: string;
  formTitle: string;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
  username: string;
  userName?: string;
  userFamily?: string;
  userType?: string;
}

interface StudentFormWithSubmission {
  _id: string;
  title: string;
  description?: string;
  submission: FormSubmission;
  submissionDate: string;
  lastUpdated: string;
}

interface StudentFormsTabProps {
  studentId: string;
}

// Component to render different value types in form preview
const FormValueRenderer: React.FC<{ value: unknown }> = ({ value }) => {
  if (value === null || value === undefined) {
    return (
      <span className="text-gray-400 italic bg-gray-50 px-2 py-1 rounded">
        پاسخ داده نشده
      </span>
    );
  }

  // Handle signature data (base64 image)
  if (
    typeof value === "object" &&
    value !== null &&
    "signatureDataUrl" in value &&
    typeof (value as { signatureDataUrl: string }).signatureDataUrl === "string"
  ) {
    const signatureData = value as {
      signatureDataUrl: string;
      timestamp?: string;
    };

    return (
      <div className="space-y-2">
        <div className="border rounded-lg p-2 bg-gray-50 max-w-md">
          <img
            src={signatureData.signatureDataUrl}
            alt="امضاء دیجیتال"
            className="max-w-full h-auto rounded border bg-white"
            style={{ maxHeight: "200px" }}
          />
        </div>
        {signatureData.timestamp && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            تاریخ امضاء:{" "}
            {new Date(signatureData.timestamp).toLocaleDateString("fa-IR")}
          </div>
        )}
      </div>
    );
  }

  // Handle file uploads
  if (
    typeof value === "object" &&
    value !== null &&
    ("path" in value || "filename" in value)
  ) {
    const fileValue = value as {
      path?: string;
      originalName?: string;
      filename?: string;
      size?: number;
      type?: string;
      uploadedAt?: string;
    };

    const fileName =
      fileValue.originalName || fileValue.filename || "فایل آپلود شده";
    const fileSize = fileValue.size
      ? `${Math.round(fileValue.size / 1024)} کیلوبایت`
      : "";

    return (
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 p-3 rounded-lg">
        <div className="bg-blue-100 p-2 rounded-lg">
          <FileDown className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-blue-800">{fileName}</div>
          {fileSize && (
            <div className="text-xs text-blue-600 mt-1">حجم: {fileSize}</div>
          )}
          {fileValue.uploadedAt && (
            <div className="text-xs text-blue-600 mt-1">
              آپلود:{" "}
              {new Date(fileValue.uploadedAt).toLocaleDateString("fa-IR")}
            </div>
          )}
        </div>
        {fileValue.path && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              let fileUrl;
              if (fileValue.path!.startsWith("http")) {
                fileUrl = fileValue.path;
              } else {
                fileUrl = `${window.location.origin}/${fileValue.path!.replace(
                  /^\//,
                  ""
                )}`;
              }
              window.open(fileUrl, "_blank");
            }}
            className="h-8 px-3 text-blue-600 hover:bg-blue-100"
          >
            <Eye className="h-4 w-4 ml-1" />
            مشاهده
          </Button>
        )}
      </div>
    );
  }

  // Handle arrays (group fields or multiple values)
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
            <div className="flex-1">
              <FormValueRenderer value={item} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle rating values (display as stars)
  if (typeof value === "number" && value >= 0 && value <= 10) {
    const stars = Math.round(value);
    const maxStars = 5;

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {Array.from({ length: maxStars }, (_, i) => (
            <span
              key={i}
              className={`text-lg ${
                i < stars ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </span>
          ))}
        </div>
        <span className="text-sm text-gray-600">
          ({value} از {maxStars})
        </span>
      </div>
    );
  }

  // Handle boolean values (checkbox/switch fields)
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
              <span className="font-semibold text-gray-700 text-sm">{k}:</span>
            </div>
            <div className="text-right">
              <FormValueRenderer value={v} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle string values with special formatting
  if (typeof value === "string") {
    // Check if it's a date string (ISO format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.*)?$/;
    if (dateRegex.test(value)) {
      try {
        const date = new Date(value);
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-gray-800">
              {date.toLocaleDateString("fa-IR")}
              {value.includes("T") && (
                <span className="text-gray-500 mr-2">
                  {date.toLocaleTimeString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </span>
          </div>
        );
      } catch {
        // If date parsing fails, treat as regular string
      }
    }

    // Check if it's an email
    if (value.includes("@") && value.includes(".")) {
      return (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-500" />
          <a
            href={`mailto:${value}`}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {value}
          </a>
        </div>
      );
    }

    // Handle long text (textarea)
    if (value.length > 100) {
      return (
        <div className="bg-gray-50 p-3 rounded-lg border">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
            {value}
          </pre>
        </div>
      );
    }
  }

  // Default: return as string
  return <span className="text-gray-800 leading-relaxed">{String(value)}</span>;
};

// Component to preview form submission details
const FormPreviewDialog: React.FC<{
  form: StudentFormWithSubmission;
  trigger: React.ReactNode;
}> = ({ form, trigger }) => {
  const [open, setOpen] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center">
            <FileText className="h-6 w-6 ml-3 text-blue-500" />
            {form.title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {form.description && (
              <div className="bg-blue-50 px-4 py-2 rounded-lg mb-3">
                {form.description}
              </div>
            )}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 ml-1" />
                تاریخ ارسال: {formatDate(form.submissionDate)}
              </span>
              {form.lastUpdated !== form.submissionDate && (
                <span className="flex items-center">
                  <RefreshCw className="h-4 w-4 ml-1" />
                  آخرین ویرایش: {formatDate(form.lastUpdated)}
                </span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            پاسخ‌های ارسالی
          </h3>

          {Object.keys(form.submission.answers).length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">هیچ پاسخی ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(form.submission.answers).map(
                ([fieldName, fieldValue]) => (
                  <div
                    key={fieldName}
                    className="bg-white p-4 rounded-lg border border-gray-200"
                  >
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-700">{fieldName}</h4>
                    </div>
                    <div className="text-right">
                      <FormValueRenderer value={fieldValue} />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function StudentFormsTab({ studentId }: StudentFormsTabProps) {
  const [forms, setForms] = useState<StudentFormWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentForms = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/students/${studentId}/forms`, {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در دریافت فرم‌ها");
      }

      const data = await response.json();
      setForms(data.forms || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری فرم‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudentForms();
    }
  }, [studentId]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fa-IR");
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>فرم‌های تکمیل شده</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 space-x-reverse"
                >
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>فرم‌های تکمیل شده</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-2">خطا در بارگذاری فرم‌ها</p>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <Button onClick={fetchStudentForms} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 ml-2" />
                تلاش مجدد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>فرم‌های تکمیل شده</span>
            </div>
            <Badge variant="outline" className="text-sm">
              {forms.length} فرم
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">هیچ فرمی تکمیل نشده است</p>
              <p className="text-sm text-gray-500">
                دانش‌آموز هنوز هیچ فرمی را تکمیل نکرده است
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>عنوان فرم</TableHead>
                    <TableHead>تاریخ ارسال</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((form, index) => (
                    <TableRow key={form._id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {form.title}
                          </div>
                          {form.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {form.description.length > 50
                                ? `${form.description.substring(0, 50)}...`
                                : form.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 ml-1" />
                          {formatDate(form.submissionDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-green-50 border-green-200 text-green-700"
                        >
                          تکمیل شده
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <FormPreviewDialog
                          form={form}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 ml-2" />
                              مشاهده
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
