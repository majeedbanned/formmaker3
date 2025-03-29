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
import { Loader2, Eye, Trash2 } from "lucide-react";
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
