import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    students: Array<{
      studentCode: string;
      studentName: string;
      studentFamily: string;
      phone: string;
    }>
  ) => Promise<void>;
  containerClassName?: string;
  placeholder?: string;
  classCode: string;
  className: string;
}

export default function ImportStudentsModal({
  isOpen,
  onClose,
  onImport,
  placeholder = "اطلاعات دانش آموزان را از اکسل کپی و اینجا پیست کنید...",
  classCode,
  className: classNameValue,
}: ImportStudentsModalProps) {
  const [importText, setImportText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!importText.trim()) {
      toast.error("متن وارد شده خالی است", {
        description:
          "لطفا اطلاعات دانش آموزان را از اکسل کپی و در کادر وارد کنید.",
      });
      return;
    }

    try {
      setLoading(true);

      // Parse the pasted text (assuming tab-separated or space-separated values)
      const lines = importText.trim().split("\n");
      const students = lines.map((line) => {
        // Split by tab or multiple spaces
        const parts = line.split(/\t|\s{2,}/);

        if (parts.length < 3) {
          throw new Error(`داده نامعتبر: ${line}`);
        }

        return {
          studentCode: parts[0].trim(),
          studentName: parts[1]?.trim() || "",
          studentFamily: parts[2]?.trim() || "",
          phone: parts[3]?.trim() || "",
        };
      });

      if (students.length === 0) {
        throw new Error("هیچ دانش آموزی پیدا نشد");
      }

      console.log("Parsed students:", students);

      // Call the onImport function with the parsed students
      await onImport(students);

      // Clear the text area and close the modal
      setImportText("");
      onClose();

      toast.success(`${students.length} دانش آموز با موفقیت وارد شد`, {
        description: `دانش آموزان قبلی این کلاس حذف شدند و ${students.length} دانش آموز جدید به کلاس ${classNameValue} (${classCode}) اضافه شدند.`,
      });
    } catch (error) {
      console.error("Error importing students:", error);
      toast.error("خطا در وارد کردن اطلاعات", {
        description:
          error instanceof Error
            ? error.message
            : "لطفا فرمت داده ورودی را بررسی کنید.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rtl" dir="rtl">
        <DialogHeader>
          <DialogTitle>وارد کردن دانش آموزان از اکسل</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">
            اطلاعات دانش آموزان را از اکسل کپی کرده و در کادر زیر پیست کنید. هر
            سطر باید شامل: کد دانش آموز، نام، نام خانوادگی و شماره موبایل باشد.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3 text-xs text-yellow-800">
            <strong>توجه: </strong> با وارد کردن دانش آموزان جدید، تمام دانش
            آموزان قبلی که به این کلاس اختصاص داده شده بودند حذف خواهند شد و این
            کلاس فقط شامل دانش آموزان جدید خواهد بود.
            {/* <div className="mt-1">
              دانش آموزان وارد شده با شناسه‌های آنها در مجموعه کلاس‌ها ذخیره
              می‌شوند.
            </div> */}
          </div>

          <div className="bg-gray-100 p-2 rounded mb-3 text-xs">
            <div className="grid grid-cols-4 gap-2 font-bold">
              <div>کد دانش آموز</div>
              <div>نام</div>
              <div>نام خانوادگی</div>
              <div>موبایل</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>12345</div>
              <div>علی</div>
              <div>محمدی</div>
              <div>09121234567</div>
            </div>
          </div>

          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={placeholder}
            className="h-48 font-mono text-sm"
            dir="ltr"
          />
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              انصراف
            </Button>
          </DialogClose>
          <Button
            onClick={handleImport}
            disabled={loading || !importText.trim()}
          >
            {loading ? "در حال پردازش..." : "وارد کردن دانش آموزان"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
