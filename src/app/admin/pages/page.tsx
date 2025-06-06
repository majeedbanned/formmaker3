"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit2, Trash2, FileText, ExternalLink, Eye } from "lucide-react";

interface PageItem {
  _id: string;
  title: string;
  content: string;
  slug: string;
  isActive: boolean;
  metaDescription: string;
  createdAt: string;
  updatedAt: string;
}

export default function PagesManagement() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    slug: "",
    isActive: true,
    metaDescription: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        fetchPages();
        resetForm();
      } else {
        alert(data.error || "خطا در ذخیره صفحه");
      }
    } catch (error) {
      console.error("Error saving page:", error);
      alert("خطا در ذخیره صفحه");
    }
  };

  const handleEdit = (page: PageItem) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      content: page.content,
      slug: page.slug,
      isActive: page.isActive,
      metaDescription: page.metaDescription,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
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

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      slug: "",
      isActive: true,
      metaDescription: "",
    });
    setEditingPage(null);
    setShowForm(false);
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

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      dir="rtl"
    >
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                مدیریت صفحات محتوا
              </h1>
              <p className="text-gray-600 mt-2">
                ایجاد و مدیریت صفحات داینامیک وب‌سایت
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2"
            >
              <Plus size={20} />
              ایجاد صفحه جدید
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingPage ? "ویرایش صفحه" : "ایجاد صفحه جدید"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان صفحه *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نامک (Slug)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="به صورت خودکار از عنوان تولید می‌شود"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  توضیحات متا (برای SEO)
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metaDescription: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="توضیح کوتاه درباره صفحه برای موتورهای جستجو"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  محتوای صفحه *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="محتوای صفحه را وارد کنید. می‌توانید از HTML استفاده کنید."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  نکته: می‌توانید از تگ‌های HTML برای قالب‌بندی استفاده کنید
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    صفحه فعال باشد
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  {editingPage ? "به‌روزرسانی" : "ایجاد"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  لغو
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Pages List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">صفحات موجود</h2>

          {pages.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                هیچ صفحه‌ای ایجاد نشده است
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                ایجاد اولین صفحه
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => (
                <div
                  key={page._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {page.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        page.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {page.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </div>

                  {page.metaDescription && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {page.metaDescription}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    آخرین به‌روزرسانی:{" "}
                    {new Date(page.updatedAt).toLocaleDateString("fa-IR")}
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={generatePageUrl(page._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-indigo-500 text-white px-3 py-2 rounded text-sm hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye size={14} />
                      مشاهده
                    </a>
                    <button
                      onClick={() => handleEdit(page)}
                      className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 size={14} />
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(page._id)}
                      className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 size={14} />
                      حذف
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ExternalLink size={12} />
                      <span className="font-mono">/content?id={page._id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
