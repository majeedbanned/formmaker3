"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit2, Trash2, FileText, Eye, Layout } from "lucide-react";
import { ModuleConfig } from "@/types/modules";
import PageBuilder from "@/components/admin/PageBuilder";
import { Button } from "@/components/ui/button";

interface DynamicPage {
  _id?: string;
  title: string;
  slug: string;
  metaDescription: string;
  metaKeywords: string;
  isPublished: boolean;
  modules: ModuleConfig[];
  schoolId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PageItem extends DynamicPage {
  content?: string; // For backward compatibility
  isActive?: boolean; // For backward compatibility
}

export default function PagesManagement() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPageBuilder, setShowPageBuilder] = useState(false);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPages();
    }
  }, [isAuthenticated]);

  const fetchPages = async () => {
    try {
      const response = await fetch("/api/admin/pages");
      const data = await response.json();
      setPages(data.pages || []);
    } catch (error) {
      console.error("Error fetching pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePage = async (pageData: DynamicPage) => {
    try {
      const method = editingPage ? "PUT" : "POST";
      const url = editingPage
        ? `/api/admin/pages/${editingPage._id}`
        : "/api/admin/pages";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pageData),
      });

      const data = await response.json();
      if (response.ok) {
        fetchPages();
        setShowPageBuilder(false);
        setEditingPage(null);
      } else {
        throw new Error(data.error || "خطا در ذخیره صفحه");
      }
    } catch (error) {
      console.error("Error saving page:", error);
      throw error;
    }
  };

  const handleEditPage = (page: PageItem) => {
    setEditingPage(page);
    setShowPageBuilder(true);
  };

  const handleNewPage = () => {
    setEditingPage(null);
    setShowPageBuilder(true);
  };

  const handleDeletePage = async (id: string) => {
    if (confirm("آیا از حذف این صفحه اطمینان دارید؟")) {
      try {
        const response = await fetch(`/api/admin/pages/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchPages();
        }
      } catch (error) {
        console.error("Error deleting page:", error);
      }
    }
  };

  const handleCancelPageBuilder = () => {
    setShowPageBuilder(false);
    setEditingPage(null);
  };

  const generatePageUrl = (id: string) => {
    return `/content?id=${id}`;
  };

  if (isLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">لطفاً وارد شوید</p>
        </div>
      </div>
    );
  }

  // Only school admins can access this interface
  if (user.userType !== "school") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">
            شما اجازه دسترسی به این بخش را ندارید
          </p>
          <p className="text-gray-500 text-sm mt-2">
            این بخش فقط برای مدیران مدرسه است
          </p>
        </div>
      </div>
    );
  }

  // Show page builder if editing or creating a page
  if (showPageBuilder) {
    return (
      <PageBuilder
        page={editingPage || undefined}
        onSave={handleSavePage}
        onCancel={handleCancelPageBuilder}
        isNewPage={!editingPage}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">مدیریت صفحات</h1>
        <p className="mt-2 text-gray-600">
          ایجاد و مدیریت صفحات وب‌سایت با سیستم ماژولار
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Button
          onClick={handleNewPage}
          className="flex items-center space-x-2 rtl:space-x-reverse"
        >
          <Plus className="w-4 h-4" />
          <span>ایجاد صفحه جدید</span>
        </Button>
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عنوان
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نشانی
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ماژول ها
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاریخ ایجاد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {page.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {page.metaDescription}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">/{page.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                      <Layout className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {page.modules?.length || 0} ماژول
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        page.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {page.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {page.createdAt
                      ? new Date(page.createdAt).toLocaleDateString("fa-IR")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => handleEditPage(page)}
                        className="text-blue-600 hover:text-blue-900"
                        title="ویرایش"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => page._id && handleDeletePage(page._id)}
                        className="text-red-600 hover:text-red-900"
                        title="حذف"
                        disabled={!page._id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <a
                        href={page._id ? generatePageUrl(page._id) : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900"
                        title="مشاهده"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg">هنوز صفحه‌ای ایجاد نشده است</p>
            <p className="text-sm mt-2">برای شروع، صفحه جدیدی ایجاد کنید</p>
          </div>
        </div>
      )}
    </div>
  );
}
