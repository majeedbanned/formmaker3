"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Loader2,
  FilePlus2,
  Save,
  X,
  Pencil,
  Trash2,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";

interface TicketTemplate {
  _id: string;
  data: {
    title: string;
    description: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export default function TicketTemplatesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    title: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.userType !== "school") {
        toast.error("دسترسی غیر مجاز");
        setLoading(false);
        router.push("/admin/ticketing");
        return;
      }
      fetchTemplates();
    }
  }, [isAuthenticated, user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ticketing/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        toast.error("خطا در دریافت الگوها");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("خطا در دریافت الگوها");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormState({
      title: "",
      description: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.title.trim() || !formState.description.trim()) {
      toast.error("لطفاً عنوان و توضیحات الگو را وارد کنید");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim(),
      };

      let response: Response;
      if (editingId) {
        response = await fetch(`/api/ticketing/templates/${editingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/ticketing/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast.success(editingId ? "الگو بروزرسانی شد" : "الگو ایجاد شد");
        resetForm();
        fetchTemplates();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در ذخیره الگو");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("خطا در ذخیره الگو");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template: TicketTemplate) => {
    setEditingId(template._id);
    setFormState({
      title: template.data.title,
      description: template.data.description,
    });
  };

  const handleDelete = async (templateId: string) => {
    try {
      setDeletingId(templateId);
      const response = await fetch(`/api/ticketing/templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("الگو حذف شد");
        setTemplates((prev) => prev.filter((template) => template._id !== templateId));
        if (editingId === templateId) {
          resetForm();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در حذف الگو");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("خطا در حذف الگو");
    } finally {
      setDeletingId(null);
    }
  };

  const sortedTemplates = useMemo(
    () =>
      [...templates].sort(
        (a, b) =>
          new Date(b.data.updatedAt || b.data.createdAt || "").getTime() -
          new Date(a.data.updatedAt || a.data.createdAt || "").getTime()
      ),
    [templates]
  );

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

  if (!isAuthenticated || !user || user.userType !== "school") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">دسترسی غیر مجاز</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl" dir="rtl">
      <PageHeader
        title="الگوهای تیکت"
        subtitle="مدیریت سوالات و عناوین آماده برای استفاده معلمان"
        icon={<FilePlus2 className="w-6 h-6" />}
        gradient={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilePlus2 className="w-5 h-5" />
              {editingId ? "ویرایش الگو" : "ایجاد الگوی جدید"}
            </CardTitle>
            <CardDescription>
              {editingId
                ? "عنوان و توضیحات الگو را بروزرسانی کنید"
                : "عنوان و توضیحات سوال متداول یا درخواست رایج را وارد کنید"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="template-title" className="block text-sm font-medium text-gray-700 mb-1">
                  عنوان الگو *
                </label>
                <Input
                  id="template-title"
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="عنوان تیکت (مثلاً درخواست تعمیر تجهیزات)"
                  required
                />
              </div>

              <div>
                <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 mb-1">
                  توضیحات الگو *
                </label>
                <Textarea
                  id="template-description"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={6}
                  placeholder="جزئیات کامل درخواست یا سوال متداول را وارد کنید..."
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? "ذخیره تغییرات" : "ایجاد الگو"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm} className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    انصراف
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>الگوهای ثبت شده</CardTitle>
            <CardDescription>
              {sortedTemplates.length > 0
                ? "این الگوها برای معلمان هنگام ایجاد تیکت قابل انتخاب است"
                : "هنوز الگویی ثبت نشده است"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedTemplates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                هیچ الگویی ثبت نشده است. از فرم کنار برای ایجاد اولین الگو استفاده کنید.
              </div>
            ) : (
              <div className="space-y-4">
                {sortedTemplates.map((template) => (
                  <div
                    key={template._id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{template.data.title}</h3>
                        <p className="text-gray-600 whitespace-pre-line">
                          {template.data.description}
                        </p>
                        {(template.data.updatedAt || template.data.createdAt) && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                            <History className="w-3 h-3" />
                            <span>
                              آخرین بروزرسانی:{" "}
                              {new Date(template.data.updatedAt || template.data.createdAt || "").toLocaleString(
                                "fa-IR"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="w-4 h-4" />
                          ویرایش
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleDelete(template._id)}
                          disabled={deletingId === template._id}
                        >
                          {deletingId === template._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


