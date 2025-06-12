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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    students: Array<{
      studentCode: string;
      studentName: string;
      studentFamily: string;
      phone: string;
      schoolCode: string;
    }>
  ) => Promise<void>;
  containerClassName?: string;
  placeholder?: string;
  classCode: string;
  className: string;
  schoolCode: string;
}

export default function ImportStudentsModal({
  isOpen,
  onClose,
  onImport,
  placeholder = "اطلاعات دانش آموزان را از اکسل کپی و اینجا پیست کنید...",
  classCode,
  className: classNameValue,
  schoolCode,
}: ImportStudentsModalProps) {
  const [importText, setImportText] = useState("");
  const [sidaText, setSidaText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("excel");

  const parseSidaText = (text: string) => {
    try {
      const lines = text.split("\n");
      const students = [];

      // A more comprehensive approach for the SIDA format
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines or lines without numbers
        if (!line || !/\d/.test(line)) continue;

        // First try to match the standard format: 10-digit code + name + family
        const standardMatch = line.match(/(\d{10})\s+(\S+)\s+(\S+)/);
        if (standardMatch) {
          students.push({
            studentCode: standardMatch[1],
            studentName: standardMatch[2],
            studentFamily: standardMatch[3],
            phone: "",
            schoolCode,
          });
          continue;
        }

        // If that fails, look for just the 10-digit code
        const codeMatch = line.match(/(\d{10})/);
        if (codeMatch) {
          const studentCode = codeMatch[1];

          // Try to find the name and family in subsequent lines
          let firstName = "";
          let lastName = "";

          // Check if the next line has the first name
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine && !/\d{10}/.test(nextLine)) {
              firstName = nextLine;
              i++; // Move to the next line
            }
          }

          // Check if the next line has the family name
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine && !/\d{10}/.test(nextLine)) {
              lastName = nextLine;
              i++; // Move to the next line
            }
          }

          // If we have at least a student code and either a first or last name
          if (studentCode && (firstName || lastName)) {
            students.push({
              studentCode,
              studentName: firstName,
              studentFamily: lastName,
              phone: "",
              schoolCode,
            });
          }
        }
      }

      // If still no students found, try the multiline table format approach
      if (students.length === 0) {
        // This approach handles the case where students are listed in a table-like format
        // Student code, name, and family name might be separated by tabs or multiple spaces
        let currentStudentCode = "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          // Skip empty lines
          if (!line) continue;

          // Look for a line that has only a 10-digit number (student code)
          if (/^\d{10}$/.test(line)) {
            currentStudentCode = line;

            // The next line might contain the name
            if (
              i + 1 < lines.length &&
              lines[i + 1].trim() &&
              !/\d{10}/.test(lines[i + 1])
            ) {
              const name = lines[i + 1].trim();
              i++; // Skip the name line

              // The next line might contain the family name
              if (
                i + 1 < lines.length &&
                lines[i + 1].trim() &&
                !/\d{10}/.test(lines[i + 1])
              ) {
                const family = lines[i + 1].trim();
                i++; // Skip the family line

                students.push({
                  studentCode: currentStudentCode,
                  studentName: name,
                  studentFamily: family,
                  phone: "",
                  schoolCode,
                });
              }
            }
          }

          // Also try to match from the multi-column sample format:
          // e.g. "2421441714 پرهام اسماعيلي هفتم"
          const complexMatch = line.match(/(\d{10})\s+(\S+)\s+(\S+)\s+\S+/);
          if (complexMatch) {
            students.push({
              studentCode: complexMatch[1],
              studentName: complexMatch[2],
              studentFamily: complexMatch[3],
              phone: "",
              schoolCode,
            });
          }
        }
      }

      return students;
    } catch (error) {
      console.error("Error parsing SIDA text:", error);
      throw new Error("خطا در پردازش متن سیدا");
    }
  };

  const handleExcelImport = async () => {
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
          schoolCode,
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

  const handleSidaImport = async () => {
    if (!sidaText.trim()) {
      toast.error("متن وارد شده خالی است", {
        description: "لطفا متن خروجی سیدا را در کادر وارد کنید.",
      });
      return;
    }

    try {
      setLoading(true);

      // Parse the SIDA text
      const students = parseSidaText(sidaText);

      if (students.length === 0) {
        throw new Error("هیچ دانش آموزی در متن سیدا پیدا نشد");
      }

      console.log("Parsed SIDA students:", students);

      // Call the onImport function with the parsed students
      await onImport(students);

      // Clear the text area and close the modal
      setSidaText("");
      onClose();

      toast.success(`${students.length} دانش آموز با موفقیت وارد شد`, {
        description: `دانش آموزان قبلی این کلاس حذف شدند و ${students.length} دانش آموز جدید به کلاس ${classNameValue} (${classCode}) اضافه شدند.`,
      });
    } catch (error) {
      console.error("Error importing students from SIDA:", error);
      toast.error("خطا در وارد کردن اطلاعات از سیدا", {
        description:
          error instanceof Error
            ? error.message
            : "لطفا متن وارد شده را بررسی کنید. متن باید شامل اطلاعات دانش آموزان از سیستم سیدا باشد.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (activeTab === "excel") {
      handleExcelImport();
    } else {
      handleSidaImport();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rtl" dir="rtl">
        <DialogHeader>
          <DialogTitle>وارد کردن دانش آموزان</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="excel"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="excel">از اکسل</TabsTrigger>
            <TabsTrigger value="sida">از سیدا</TabsTrigger>
          </TabsList>

          <TabsContent value="excel">
            <div className="mt-4">
              <p className="text-sm text-right text-gray-500 mb-2">
                اطلاعات دانش آموزان را از اکسل کپی کرده و در کادر زیر پیست کنید.
                هر سطر باید شامل: کد دانش آموز، نام، نام خانوادگی و شماره موبایل
                باشد.
              </p>

              <div className="bg-yellow-50 text-right border border-yellow-200 rounded p-2 mb-3 text-xs text-yellow-800">
                <strong>توجه: </strong> با وارد کردن دانش آموزان جدید، تمام دانش
                آموزان قبلی که به این کلاس اختصاص داده شده بودند حذف خواهند شد و
                این کلاس فقط شامل دانش آموزان جدید خواهد بود.
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
          </TabsContent>

          <TabsContent value="sida">
            <div className="mt-4">
              <p className="text-sm text-right text-gray-500 mb-2">
                متن خروجی سیستم سیدا را در کادر زیر کپی و پیست کنید. سیستم به
                صورت خودکار کد دانش آموزی، نام و نام خانوادگی دانش آموزان را
                استخراج می‌کند.
              </p>

              <div className="bg-yellow-50 text-right border border-yellow-200 rounded p-2 mb-3 text-xs text-yellow-800">
                <strong>توجه: </strong> با وارد کردن دانش آموزان جدید، تمام دانش
                آموزان قبلی که به این کلاس اختصاص داده شده بودند حذف خواهند شد و
                این کلاس فقط شامل دانش آموزان جدید خواهد بود.
              </div>

              <div className="bg-gray-100 p-2 rounded mb-3 text-xs">
                <div className="font-bold mb-1">نمونه فرمت سیدا:</div>
                <div className="text-xs text-right whitespace-pre-line">
                  تخصیص دانش آموز نام کلاس هفتم 1 select ردیف کد دانش آموزی نام
                  نام خانوادگی پایه 1 2421441714 پرهام اسماعيلي هفتم 2
                  2421420016 محمدطاها اكبرپور هفتم
                </div>
                <div className="mt-2 text-right font-bold text-xs text-indigo-600">
                  سیستم به‌طور خودکار کد دانش‌آموزی، نام و نام خانوادگی را از
                  متن استخراج می‌کند.
                </div>
              </div>

              <Textarea
                value={sidaText}
                onChange={(e) => setSidaText(e.target.value)}
                placeholder="متن خروجی سیدا را اینجا کپی کنید..."
                className="h-48 font-mono text-sm"
                dir="rtl"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              انصراف
            </Button>
          </DialogClose>
          <Button
            onClick={handleImport}
            disabled={
              loading ||
              (activeTab === "excel" && !importText.trim()) ||
              (activeTab === "sida" && !sidaText.trim())
            }
          >
            {loading ? "در حال پردازش..." : "وارد کردن دانش آموزان"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
