"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Entity } from "@/types/crud";
import { toast } from "sonner";
import { Loader2, Eye, Trash2, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import FormPreview from "./FormPreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FormInput {
  _id: string;
  formId: string;
  formName: string;
  schoolCode: string;
  username: string;
  answers: Record<string, unknown>;
  persianDate?: string;
  persianTime?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormInputsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Entity | null;
  layoutDirection?: "rtl" | "ltr";
}

export default function FormInputsModal({
  isOpen,
  onClose,
  formData,
  layoutDirection = "rtl",
}: FormInputsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formInputs, setFormInputs] = useState<FormInput[]>([]);
  const [selectedInput, setSelectedInput] = useState<FormInput | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch form inputs when modal opens
  useEffect(() => {
    if (isOpen && formData && formData._id) {
      fetchFormInputs();
    }
  }, [isOpen, formData]);

  // Fetch form inputs from the API
  const fetchFormInputs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/formsInput/list?formId=${formData?._id}&schoolCode=${
          user?.schoolCode || formData?.data.schoolCode || ""
        }`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch form inputs");
      }

      const data = await response.json();
      setFormInputs(data.inputs || []);
    } catch (error) {
      console.error("Error fetching form inputs:", error);
      toast.error("خطا در بازیابی داده‌ها", {
        description: "امکان بازیابی داده‌های فرم وجود ندارد.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle preview of a form input
  const handlePreviewInput = (input: FormInput) => {
    setSelectedInput(input);
    setIsPreviewOpen(true);
  };

  // Handle deletion of a form input
  const handleDeleteInput = (id: string) => {
    setDeletingId(id);
    setIsDeleteConfirmOpen(true);
  };

  // Confirm deletion of a form input
  const confirmDeleteInput = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/formsInput/${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete form input");
      }

      // Remove the deleted input from the state
      setFormInputs(formInputs.filter((input) => input._id !== deletingId));

      toast.success("فرم با موفقیت حذف شد", {
        description: "پاسخ‌های ثبت شده برای این فرم حذف شدند.",
      });
    } catch (error) {
      console.error("Error deleting form input:", error);
      toast.error("خطا در حذف فرم", {
        description: "امکان حذف این فرم وجود ندارد.",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("fa-IR");
    } catch {
      return dateString;
    }
  };

  // Function to export form inputs to Excel
  const exportToExcel = async () => {
    if (formInputs.length === 0) {
      toast.error("خطا در صدور فایل", {
        description: "هیچ پاسخی برای صدور به اکسل وجود ندارد.",
      });
      return;
    }

    try {
      // Dynamically import ExcelJS (only when needed)
      const ExcelJS = (await import("exceljs")).default;

      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Form Inputs");

      // Track file links to add hyperlinks after worksheet creation
      interface FileLink {
        row: number;
        col: number;
        url: string;
        text: string;
      }

      const fileLinks: FileLink[] = [];

      // Generate column headers based on the first form input's answers
      const sampleInput = formInputs[0];
      const answerKeys = sampleInput.answers
        ? Object.keys(sampleInput.answers)
        : [];

      // Setup headers with form field titles
      const headers = [
        { header: "ردیف", key: "rowNumber", width: 10 },
        { header: "کاربر", key: "username", width: 20 },
        { header: "تاریخ ثبت", key: "createdAt", width: 20 },
        { header: "تاریخ شمسی", key: "persianDate", width: 20 },
      ];

      // Add headers for answer fields
      if (formData && formData.data.formFields) {
        const formFields = formData.data.formFields as Array<{
          fieldType: string;
          fieldTitle: string;
          fieldOrder: string;
        }>;

        // Sort fields by fieldOrder
        const sortedFields = [...formFields].sort((a, b) => {
          const orderA = Number(a.fieldOrder) || 0;
          const orderB = Number(b.fieldOrder) || 0;
          return orderA - orderB;
        });

        // Add each field as a column
        sortedFields.forEach((field, index) => {
          headers.push({
            header: field.fieldTitle,
            key: `field_${index}`,
            width: 20,
          });
        });
      } else {
        // If form fields are not available, use answer keys
        answerKeys.forEach((key) => {
          headers.push({
            header: key,
            key,
            width: 20,
          });
        });
      }

      // Set worksheet columns
      worksheet.columns = headers;

      // Add rows to worksheet
      formInputs.forEach((input, index) => {
        // Use any type for simplicity in this specific context
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row: Record<string, any> = {
          rowNumber: index + 1,
          username: input.username,
          createdAt: formatDate(input.createdAt),
          persianDate:
            input.persianDate && input.persianTime
              ? `${input.persianDate} - ${input.persianTime}`
              : formatDate(input.createdAt),
        };

        // Add answers to the row
        if (formData && formData.data.formFields) {
          const formFields = formData.data.formFields as Array<{
            fieldType: string;
            fieldTitle: string;
            fieldOrder: string;
          }>;

          // Sort fields by fieldOrder
          const sortedFields = [...formFields].sort((a, b) => {
            const orderA = Number(a.fieldOrder) || 0;
            const orderB = Number(b.fieldOrder) || 0;
            return orderA - orderB;
          });

          // Add each field value
          sortedFields.forEach((field, fieldIndex) => {
            // Find the appropriate answer key for this field
            const key = `field_${fieldIndex}`;

            // Try to find the matching answer by field title or index
            let answerValue = null;

            // First try to match by field title (preferred)
            if (input.answers) {
              // Look for direct match with field title
              Object.entries(input.answers).forEach(([answerKey, value]) => {
                if (
                  answerKey === field.fieldTitle ||
                  answerKey.toLowerCase() === field.fieldTitle.toLowerCase()
                ) {
                  answerValue = value;
                }
              });

              // If no match by title, try to match by index or key pattern
              if (answerValue === null) {
                const answerKey = Object.keys(input.answers).find(
                  (k) =>
                    k === `field_${fieldIndex}` ||
                    k.includes(fieldIndex.toString()) ||
                    k.includes(field.fieldOrder.toString())
                );

                if (answerKey) {
                  answerValue = input.answers[answerKey];
                }
              }
            }

            // Format the answer value based on field type
            if (answerValue !== null) {
              // Format based on field type
              if (field.fieldType === "checkbox") {
                // For checkbox, convert boolean or string to readable text
                row[key] =
                  answerValue === true || answerValue === "true"
                    ? "بله"
                    : "خیر";
              } else if (field.fieldType === "date") {
                // Keep date as is, it should already be in the right format
                row[key] = answerValue;
              } else if (
                field.fieldType === "file" &&
                typeof answerValue === "object" &&
                answerValue !== null
              ) {
                // For file uploads, extract file info and add as hyperlink
                if (
                  "originalName" in answerValue &&
                  typeof (answerValue as { originalName: string; path: string })
                    .originalName === "string"
                ) {
                  const fileInfo = answerValue as {
                    originalName: string;
                    path: string;
                    type: string;
                    size: number;
                  };

                  // Store the value as text
                  row[key] = fileInfo.originalName;

                  // Calculate the full file URL - adjust based on your app's structure
                  let fileUrl = "";
                  if (fileInfo.path) {
                    // If path is relative, convert to absolute
                    if (fileInfo.path.startsWith("/")) {
                      fileUrl = `${window.location.origin}${fileInfo.path}`;
                    } else {
                      fileUrl = `${window.location.origin}/${fileInfo.path}`;
                    }
                  }

                  // Keep track of cells with hyperlinks
                  if (fileUrl) {
                    // Save for later to add hyperlinks after worksheet is built
                    fileLinks.push({
                      row: worksheet.rowCount + 1, // Current row being added (+1 for header)
                      col: headers.findIndex((h) => h.key === key) + 1, // Column index (1-based)
                      url: fileUrl,
                      text: fileInfo.originalName,
                    });
                  }
                } else {
                  row[key] = "فایل نامشخص";
                }
              } else if (
                typeof answerValue === "object" &&
                answerValue !== null
              ) {
                // For other objects, extract useful info instead of JSON
                if (
                  "originalName" in answerValue &&
                  typeof (answerValue as { originalName: string; path: string })
                    .originalName === "string"
                ) {
                  // This is likely a file upload
                  const fileInfo = answerValue as {
                    originalName: string;
                    path: string;
                    type?: string;
                    size?: number;
                  };

                  // Store the value as text
                  row[key] = fileInfo.originalName;

                  // Calculate the full file URL
                  let fileUrl = "";
                  if (fileInfo.path) {
                    // If path is relative, convert to absolute
                    if (fileInfo.path.startsWith("/")) {
                      fileUrl = `${window.location.origin}${fileInfo.path}`;
                    } else {
                      fileUrl = `${window.location.origin}/${fileInfo.path}`;
                    }
                  }

                  // Keep track of cells with hyperlinks
                  if (fileUrl) {
                    fileLinks.push({
                      row: worksheet.rowCount + 1, // Current row being added (+1 for header)
                      col: headers.findIndex((h) => h.key === key) + 1, // Column index (1-based)
                      url: fileUrl,
                      text: fileInfo.originalName,
                    });
                  }
                } else {
                  // For other objects, convert to readable string when possible
                  try {
                    const objString = JSON.stringify(answerValue);
                    // If it looks like simple JSON, make it readable
                    row[key] = objString
                      .replace(/[{}"]/g, "")
                      .replace(/,/g, ", ");
                  } catch {
                    row[key] = String(answerValue);
                  }
                }
              } else {
                // For simple values (text, numbers)
                row[key] = answerValue;
              }
            } else {
              row[key] = "";
            }
          });
        } else {
          // Fallback if form fields are not available
          Object.entries(input.answers || {}).forEach(([key, value]) => {
            if (typeof value === "object" && value !== null) {
              // For objects (like file uploads), extract useful info instead of JSON
              if (
                "originalName" in value &&
                typeof (value as { originalName: string; path: string })
                  .originalName === "string"
              ) {
                // This is a file upload
                const fileInfo = value as {
                  originalName: string;
                  path: string;
                  type?: string;
                  size?: number;
                };

                // Store the value as text
                row[key] = fileInfo.originalName;

                // Calculate the full file URL
                let fileUrl = "";
                if (fileInfo.path) {
                  // If path is relative, convert to absolute
                  if (fileInfo.path.startsWith("/")) {
                    fileUrl = `${window.location.origin}${fileInfo.path}`;
                  } else {
                    fileUrl = `${window.location.origin}/${fileInfo.path}`;
                  }

                  // Keep track of cells with hyperlinks
                  if (fileUrl) {
                    fileLinks.push({
                      row: worksheet.rowCount + 1, // Current row being added
                      col: headers.findIndex((h) => h.key === key) + 1, // Column index (1-based)
                      url: fileUrl,
                      text: fileInfo.originalName,
                    });
                  }
                }
              } else {
                // For other objects, convert to readable string when possible
                try {
                  const objString = JSON.stringify(value);
                  // If it looks like simple JSON, make it readable
                  row[key] = objString
                    .replace(/[{}"]/g, "")
                    .replace(/,/g, ", ");
                } catch {
                  row[key] = String(value);
                }
              }
            } else if (value === null) {
              row[key] = "";
            } else if (typeof value === "boolean") {
              // For boolean values, convert to readable text
              row[key] = value ? "بله" : "خیر";
            } else {
              // For simple values (text, numbers)
              row[key] = value;
            }
          });
        }

        worksheet.addRow(row);
      });

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Apply hyperlinks to file cells
      fileLinks.forEach((link) => {
        const cell = worksheet.getCell(link.row, link.col);
        cell.value = {
          text: link.text,
          hyperlink: link.url,
          tooltip: `Click to open: ${link.url}`,
        };

        // Style hyperlinks with blue color and underline
        cell.font = {
          color: { argb: "0563C1" },
          underline: true,
        };
      });

      // Generate the Excel file
      const buffer = await workbook.xlsx.writeBuffer();

      // Create a Blob from the buffer
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create a download link and trigger the download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${formData?.data.formName || "form"}_responses_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("صدور فایل موفقیت‌آمیز بود", {
        description: "فایل اکسل با موفقیت ایجاد شد.",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("خطا در صدور فایل", {
        description: "امکان صدور فایل اکسل وجود ندارد.",
      });
    }
  };

  // If loading, show a spinner
  if (loading && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          dir={layoutDirection}
        >
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="mt-4 text-gray-600">
              در حال بارگذاری پاسخ‌های فرم...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          dir={layoutDirection}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              پاسخ‌های فرم {formData?.data.formName as string}
            </DialogTitle>
          </DialogHeader>

          {/* Form inputs list */}
          {formInputs.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              هیچ پاسخی برای این فرم یافت نشد
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ردیف</TableHead>
                  <TableHead>کاربر</TableHead>
                  <TableHead>تاریخ ثبت</TableHead>
                  <TableHead>تاریخ شمسی</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formInputs.map((input, index) => (
                  <TableRow key={input._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{input.username}</TableCell>
                    <TableCell>{formatDate(input.createdAt)}</TableCell>
                    <TableCell>
                      {input.persianDate && input.persianTime
                        ? `${input.persianDate} - ${input.persianTime}`
                        : formatDate(input.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 hover:bg-green-100"
                      >
                        ثبت شده
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewInput(input)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">مشاهده</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInput(input._id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">حذف</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <DialogFooter className="mt-6 flex items-center gap-2 rtl:flex-row-reverse ltr:flex-row">
            <Button variant="outline" onClick={onClose}>
              بستن
            </Button>
            {formInputs.length > 0 && (
              <Button
                onClick={exportToExcel}
                variant="outline"
                className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                <Download className="h-4 w-4 mr-2" />
                صدور به اکسل
              </Button>
            )}
            <Button onClick={fetchFormInputs} className="bg-primary text-white">
              بازخوانی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal for selected input */}
      {selectedInput && formData && (
        <FormPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          formData={{
            ...formData,
            // Add property to pass existing answers
            data: {
              ...formData.data,
              _existingAnswers: selectedInput.answers,
            },
          }}
          layoutDirection={layoutDirection}
          viewOnly={true}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <AlertDialogContent dir={layoutDirection}>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف این پاسخ اطمینان دارید؟ این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={confirmDeleteInput}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
