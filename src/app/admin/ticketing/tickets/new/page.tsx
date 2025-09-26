"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { 
  ArrowRight,
  Upload,
  X,
  AlertCircle,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";

interface Department {
  _id: string;
  data: {
    name: string;
    description: string;
  };
}

interface AttachmentFile {
  name: string;
  size: number;
  type: string;
  data: string; // base64
}

export default function NewTicketPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    departmentId: "",
    priority: "Medium" as "Low" | "Medium" | "High"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated && user?.userType === "teacher") {
      fetchDepartments();
    }
  }, [isAuthenticated, user]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ticketing/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      } else {
        toast.error("خطا در دریافت لیست بخش‌ها");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("خطا در دریافت لیست بخش‌ها");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "عنوان تیکت الزامی است";
    }

    if (!formData.description.trim()) {
      newErrors.description = "توضیحات تیکت الزامی است";
    }

    if (!formData.departmentId) {
      newErrors.departmentId = "انتخاب بخش الزامی است";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf', 'text/plain',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        toast.error(`فایل ${file.name} بیش از 5 مگابایت است`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`نوع فایل ${file.name} مجاز نیست`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: AttachmentFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          data: e.target?.result as string
        };
        setAttachments(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/ticketing/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          attachments: attachments
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("تیکت با موفقیت ایجاد شد");
        router.push(`/admin/ticketing/tickets/${data.ticket._id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در ایجاد تیکت");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("خطا در ایجاد تیکت");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.userType !== "teacher") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">دسترسی غیر مجاز</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
      <PageHeader
        title="ایجاد تیکت جدید"
        subtitle="درخواست پشتیبانی یا گزارش مشکل"
        icon={<MessageSquare className="w-6 h-6" />}
        gradient={true}
      />

      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات تیکت</CardTitle>
          <CardDescription>
            لطفاً اطلاعات کامل مربوط به درخواست یا مشکل خود را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">عنوان تیکت *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="عنوان کوتاه و واضح برای تیکت"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <Label htmlFor="department">بخش مربوطه *</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
              >
                <SelectTrigger className={errors.departmentId ? "border-red-500" : ""}>
                  <SelectValue placeholder="بخش مربوط به درخواست خود را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      <div>
                        <div className="font-medium">{dept.data.name}</div>
                        {dept.data.description && (
                          <div className="text-sm text-gray-500">{dept.data.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && (
                <p className="text-red-500 text-sm mt-1">{errors.departmentId}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">اولویت</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "Low" | "Medium" | "High") => 
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">پایین - غیر فوری</SelectItem>
                  <SelectItem value="Medium">متوسط - عادی</SelectItem>
                  <SelectItem value="High">بالا - فوری</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">توضیحات کامل *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیح کامل مشکل یا درخواست خود را بنویسید..."
                rows={6}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* File Attachments */}
            <div>
              <Label>فایل‌های پیوست (اختیاری)</Label>
              <div className="mt-2">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    فایل‌های خود را بکشید و رها کنید یا کلیک کنید
                  </p>
                  <p className="text-xs text-gray-500">
                    حداکثر 5 مگابایت - فرمت‌های مجاز: JPG, PNG, GIF, PDF, DOC, DOCX, TXT
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    انتخاب فایل
                  </Button>
                </div>

                {/* Attachment List */}
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>فایل‌های انتخاب شده:</Label>
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="text-sm">
                            <div className="font-medium">{attachment.name}</div>
                            <div className="text-gray-500">{formatFileSize(attachment.size)}</div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                پس از ایجاد تیکت، شما و معلمان تخصیص یافته به بخش انتخابی می‌توانید پاسخ‌های مربوطه را مشاهده و به آن پاسخ دهید.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "در حال ایجاد..." : "ایجاد تیکت"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
