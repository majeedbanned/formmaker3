import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LayoutSettings } from "@/types/crud";
import { toast } from "sonner";

export interface ImportFunctionConfig {
  active: boolean;
  title?: string;
  nameBinding: Array<{
    name: string;
    type?: "text" | "number" | "date" | "boolean";
    isUnique?: boolean;
    defaultValue?: string | number;
  }>;
}

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, unknown>[]) => Promise<void>;
  config: ImportFunctionConfig;
  loading: boolean;
  layout?: LayoutSettings;
}

export default function ImportModal({
  isOpen,
  onClose,
  onImport,
  config,
  loading,
  layout = {
    direction: "ltr",
    texts: {
      cancelButton: "Cancel",
      processingMessage: "Processing...",
    },
  },
}: ImportModalProps) {
  const [importText, setImportText] = useState<string>("");

  // Convert Persian/Arabic digits to English
  const convertToEnglishDigits = (str: string): string => {
    return str.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  };

  // Parse import text to structured data
  const parseImportText = (text: string): Record<string, unknown>[] => {
    if (!text.trim()) return [];

    const rows = text.trim().split("\n");
    const nameBinding = config.nameBinding || [];

    // Process rows into objects according to binding schema
    const processedObjects = rows.map((row) => {
      const columns = row.split("\t");
      const obj: Record<string, string | number> = {};

      // First apply all default values from the binding configuration
      nameBinding.forEach((binding) => {
        if (binding.defaultValue !== undefined) {
          if (binding.type === "number") {
            // Ensure numeric default value
            obj[binding.name] =
              typeof binding.defaultValue === "number"
                ? binding.defaultValue
                : Number(binding.defaultValue) || 0;
          } else {
            obj[binding.name] = String(binding.defaultValue);
          }
        }
      });

      // Then process column values (which will override defaults if provided)
      nameBinding.forEach((binding, index) => {
        if (index >= columns.length) return;

        // Get the column value and trim it
        let value = columns[index]?.trim() || "";

        // Skip empty values if we already have a default
        if (!value && binding.defaultValue !== undefined) {
          return; // Keep the default value
        }

        // Handle field type
        if (binding.type === "number") {
          // Convert any non-English digits
          value = convertToEnglishDigits(value);
          // Convert to actual number
          obj[binding.name] = value ? Number(value) : 0;
        } else {
          // Default to text
          obj[binding.name] = value;
        }
      });

      return obj;
    });

    // Handle uniqueness constraints
    const uniqueFields = nameBinding
      .filter((binding) => binding.isUnique)
      .map((binding) => binding.name);

    if (uniqueFields.length > 0) {
      const uniqueMap: Record<string, Record<string, number>> = {};

      // Initialize maps for each unique field
      uniqueFields.forEach((field) => {
        uniqueMap[field] = {};
      });

      // Mark latest index for each unique value
      processedObjects.forEach((obj, index) => {
        uniqueFields.forEach((field) => {
          const value = String(obj[field]); // Convert to string for use as key
          if (value) {
            uniqueMap[field][value] = index;
          }
        });
      });

      // Keep only the latest entries for each unique field
      return processedObjects.filter((obj, index) => {
        return !uniqueFields.some((field) => {
          const value = String(obj[field]); // Convert to string for use as key
          return value && uniqueMap[field][value] !== index;
        });
      });
    }

    return processedObjects;
  };

  // Compute parsed data for display info
  const parsedData = useMemo(() => {
    return parseImportText(importText);
  }, [importText]);

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("Error", {
        description: "No valid data to import",
        duration: 3000,
      });
      return;
    }

    try {
      await onImport(parsedData);
      setImportText(""); // Clear after successful import
      toast.success("Success", {
        description: `Imported ${parsedData.length} records successfully`,
        duration: 3000,
      });
    } catch (error) {
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : String(error),
        duration: 5000,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        dir={layout.direction}
        className="max-w-3xl w-[90vw] max-h-[80vh] flex flex-col gap-4 p-6"
      >
        <DialogHeader>
          <DialogTitle
            className={layout.direction === "rtl" ? "text-right" : "text-left"}
          >
            {config.title || layout.texts?.importTitle || "Import Data"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="bg-muted/50 p-3 rounded-md text-sm">
            <p className="mb-2">
              پاست کردن داده ها از اکسل با فرمت ستون‌های تب شده.
            </p>
            <p className="mb-2">ترتیب ستون‌ها:</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {config.nameBinding.map((binding) => (
                <span
                  key={binding.name}
                  className="bg-muted px-2 py-1 rounded-sm"
                >
                  {binding.name}
                  {binding.isUnique && (
                    <small className="text-blue-500 ml-1">(منحصر به فرد)</small>
                  )}
                  {binding.type === "number" && (
                    <small className="text-green-500 ml-1">(عدد)</small>
                  )}
                  {binding.defaultValue !== undefined && (
                    <small className="text-amber-600 ml-1">
                      (پیش‌فرض: {binding.defaultValue})
                    </small>
                  )}
                </span>
              ))}
            </div>
            {config.nameBinding.some(
              (binding) => binding.defaultValue !== undefined
            ) && (
              <p className="text-xs text-amber-600 border-t border-amber-200 pt-2 mt-2">
                مقادیر پیش‌فرض به صورت خودکار به هر سطر از داده‌های وارد شده
                اضافه می‌شوند.
              </p>
            )}
          </div>

          <Textarea
            rows={10}
            placeholder="داده‌ها را از اکسل کپی کرده و اینجا پیست کنید..."
            className="w-full font-mono"
            onChange={(e) => setImportText(e.target.value)}
            value={importText}
          />

          {parsedData.length > 0 && (
            <div className="text-sm">
              <p>{parsedData.length} مورد برای وارد کردن آماده است.</p>
            </div>
          )}
        </div>

        <DialogFooter
          className={
            layout.direction === "rtl"
              ? "sm:justify-start mt-4"
              : "sm:justify-end mt-4"
          }
        >
          <div
            className={`flex gap-2 ${
              layout.direction === "rtl" ? "flex-row-reverse" : ""
            }`}
          >
            <Button type="button" variant="outline" onClick={onClose}>
              {layout.texts?.cancelButton || "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={loading || parsedData.length === 0}
            >
              {loading
                ? layout.texts?.processingMessage || "Processing..."
                : layout.texts?.importButton || "Import"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
