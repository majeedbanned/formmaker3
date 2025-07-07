"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Eye, EyeOff, Save, X } from "lucide-react";

interface HtmlContentConfig {
  html: string;
  css: string;
  javascript: string;
  title?: string;
  description?: string;
}

interface HtmlContentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: HtmlContentConfig) => void;
  initialData: HtmlContentConfig;
}

const HtmlContentEditModal: React.FC<HtmlContentEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<HtmlContentConfig>({
    html: "",
    css: "",
    javascript: "",
  });
  const [activeTab, setActiveTab] = useState("html");
  const [showPreview, setShowPreview] = useState(false);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (initialData) {
      setFormData({
        html: initialData.html || "",
        css: initialData.css || "",
        javascript: initialData.javascript || "",
      });
    }
  }, [initialData]);

  const handleInputChange = (field: keyof HtmlContentConfig, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateCode = (
    code: string,
    type: "html" | "css" | "javascript"
  ): boolean => {
    if (!code.trim()) return true; // Empty code is valid

    try {
      if (type === "javascript") {
        // Basic JavaScript syntax check
        new Function(code);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    // Validate all code
    const htmlValid = validateCode(formData.html, "html");
    const jsValid = validateCode(formData.javascript, "javascript");

    if (!htmlValid || !jsValid) {
      setIsValid(false);
      return;
    }

    onSave(formData);
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      html: "",
      css: "",
      javascript: "",
    });
    setIsValid(true);
    onClose();
  };

  const renderPreview = () => {
    if (!showPreview) return null;

    return (
      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">پیش‌نمایش</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(false)}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
        <div className="bg-white p-4 rounded border min-h-[100px]">
          <div
            dangerouslySetInnerHTML={{ __html: formData.html }}
            style={{ all: "initial" }}
          />
          {formData.css && (
            <style dangerouslySetInnerHTML={{ __html: formData.css }} />
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            ویرایش محتوای HTML
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Code Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              </TabsList>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showPreview ? "مخفی کردن" : "پیش‌نمایش"}
              </Button>
            </div>

            <TabsContent value="html" className="space-y-2">
              <Label htmlFor="html">کد HTML</Label>
              <Textarea
                id="html"
                value={formData.html}
                onChange={(e) => handleInputChange("html", e.target.value)}
                placeholder="کد HTML خود را اینجا وارد کنید..."
                className="font-mono text-sm min-h-[200px]"
                dir="ltr"
              />
              <p className="text-xs text-gray-500">
                کد HTML که می‌خواهید نمایش داده شود را وارد کنید
              </p>
            </TabsContent>

            <TabsContent value="css" className="space-y-2">
              <Label htmlFor="css">کد CSS</Label>
              <Textarea
                id="css"
                value={formData.css}
                onChange={(e) => handleInputChange("css", e.target.value)}
                placeholder="کد CSS خود را اینجا وارد کنید..."
                className="font-mono text-sm min-h-[200px]"
                dir="ltr"
              />
              <p className="text-xs text-gray-500">
                استایل‌های CSS برای تنظیم ظاهر محتوای HTML
              </p>
            </TabsContent>

            <TabsContent value="javascript" className="space-y-2">
              <Label htmlFor="javascript">کد JavaScript</Label>
              <Textarea
                id="javascript"
                value={formData.javascript}
                onChange={(e) =>
                  handleInputChange("javascript", e.target.value)
                }
                placeholder="کد JavaScript خود را اینجا وارد کنید..."
                className="font-mono text-sm min-h-[200px]"
                dir="ltr"
              />
              <p className="text-xs text-gray-500">
                کد JavaScript برای افزودن قابلیت‌های تعاملی
              </p>
            </TabsContent>
          </Tabs>

          {/* Preview */}
          {renderPreview()}

          {/* Validation Error */}
          {!isValid && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                لطفاً کد وارد شده را بررسی کنید. ممکن است خطای نحوی وجود داشته
                باشد.
              </p>
            </div>
          )}

          {/* Help Text */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              نکات مهم:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• کد HTML باید معتبر باشد</li>
              <li>• CSS فقط روی این بخش تأثیر می‌گذارد</li>
              <li>• JavaScript در یک محیط امن اجرا می‌شود</li>
              <li>• از کدهای مخرب خودداری کنید</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            لغو
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HtmlContentEditModal;
