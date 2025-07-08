"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface NavItem {
  _id?: string;
  name: string;
  href: string;
  type: "main" | "dropdown";
  isActive: boolean;
  order: number;
  parent?: string;
  children?: NavItem[];
}

export default function LandingNavbarManagement() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: "",
    href: "",
    type: "main" as "main" | "dropdown",
    isActive: true,
    parent: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchNavItems();
    }
  }, [isAuthenticated]);

  // Default navigation items - same as in LandingNavbar
  const getDefaultNavItems = () => {
    return [
      {
        name: "خانه",
        href: "#",
        type: "main" as const,
        isActive: true,
        order: 1,
      },
      {
        name: "ویژگی‌ها",
        href: "#features",
        type: "main" as const,
        isActive: true,
        order: 2,
      },
      {
        name: "درباره ما",
        href: "#about",
        type: "main" as const,
        isActive: true,
        order: 3,
      },
      {
        name: "تعرفه‌ها",
        href: "#pricing",
        type: "main" as const,
        isActive: true,
        order: 4,
      },
      {
        name: "تماس با ما",
        href: "#contact",
        type: "main" as const,
        isActive: true,
        order: 5,
      },
    ];
  };

  const getDefaultDropdownItems = () => {
    return [
      {
        name: "تیم آموزشی",
        href: "#teachers",
        type: "dropdown" as const,
        isActive: true,
        order: 1,
      },
      {
        name: "گالری",
        href: "#gallery",
        type: "dropdown" as const,
        isActive: true,
        order: 2,
      },
      {
        name: "اخبار",
        href: "#news",
        type: "dropdown" as const,
        isActive: true,
        order: 3,
      },
      {
        name: "مقالات",
        href: "#articles",
        type: "dropdown" as const,
        isActive: true,
        order: 4,
      },
      {
        name: "اپلیکیشن",
        href: "#app",
        type: "dropdown" as const,
        isActive: true,
        order: 5,
      },
      {
        name: "نظرات",
        href: "#testimonials",
        type: "dropdown" as const,
        isActive: true,
        order: 6,
      },
    ];
  };

  const saveDefaultNavItems = async () => {
    try {
      // First, create the main "بیشتر" item
      const moreMainItem = {
        name: "بیشتر",
        href: "#",
        type: "main" as const,
        isActive: true,
        order: 6,
      };

      const mainResponse = await fetch("/api/admin/navigation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(moreMainItem),
      });

      if (!mainResponse.ok) {
        throw new Error("Failed to create main item");
      }

      const mainResult = await mainResponse.json();
      const moreItemId = mainResult.item._id;

      // Create all other default main items
      const defaultMainItems = getDefaultNavItems();
      for (const item of defaultMainItems) {
        await fetch("/api/admin/navigation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item),
        });
      }

      // Create dropdown items with parent reference
      const defaultDropdownItems = getDefaultDropdownItems();
      for (const item of defaultDropdownItems) {
        await fetch("/api/admin/navigation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...item,
            parent: moreItemId,
          }),
        });
      }

      console.log("Default navigation items saved to database");
    } catch (error) {
      console.error("Error saving default navigation items:", error);
    }
  };

  const fetchNavItems = async () => {
    try {
      const response = await fetch("/api/admin/navigation");
      const data = await response.json();

      if (data.success) {
        const items = data.items || [];

        // If no items exist in the database, save default items
        if (items.length === 0) {
          console.log(
            "No navigation items found in database, saving default items"
          );
          await saveDefaultNavItems();
          // Fetch again after saving defaults
          const updatedResponse = await fetch("/api/admin/navigation");
          const updatedData = await updatedResponse.json();
          setNavItems(updatedData.items || []);
        } else {
          setNavItems(items);
        }
      } else {
        console.error("Navigation API returned error:", data.error);
        setNavItems([]);
      }
    } catch (error) {
      console.error("Error fetching navigation items:", error);
      setNavItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem
        ? `/api/admin/navigation/${editingItem._id}`
        : "/api/admin/navigation";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          order: navItems.length + 1,
        }),
      });

      if (response.ok) {
        fetchNavItems();
        resetForm();
      }
    } catch (error) {
      console.error("Error saving navigation item:", error);
    }
  };

  const handleEdit = (item: NavItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      href: item.href,
      type: item.type,
      isActive: item.isActive,
      parent: item.parent || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("آیا از حذف این آیتم اطمینان دارید؟")) {
      try {
        const response = await fetch(`/api/admin/navigation/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchNavItems();
        }
      } catch (error) {
        console.error("Error deleting navigation item:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      href: "",
      type: "main",
      isActive: true,
      parent: "",
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const organizeNavItems = (items: NavItem[]) => {
    const mainItems = items.filter((item) => !item.parent);
    const dropdownItems = items.filter((item) => item.parent);

    return mainItems.map((item) => ({
      ...item,
      children: dropdownItems.filter((child) => child.parent === item._id),
    }));
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

  const organizedItems = organizeNavItems(navItems);

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
                مدیریت منوی صفحه اصلی
              </h1>
              <p className="text-gray-600 mt-2">
                مدیریت آیتم‌های منوی ناویگیشن صفحه اصلی
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/admin/pages"
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2"
              >
                مدیریت صفحات
              </a>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2"
              >
                <Plus size={20} />
                افزودن آیتم جدید
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? "ویرایش آیتم" : "افزودن آیتم جدید"}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نام آیتم
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  لینک/مرجع
                </label>
                <input
                  type="text"
                  value={formData.href}
                  onChange={(e) =>
                    setFormData({ ...formData, href: e.target.value })
                  }
                  placeholder="مثال: /about، #about، https://example.com، /content?id=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  نکته: برای صفحات داینامیک از فرمت /content?id=شناسه_صفحه
                  استفاده کنید
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "main" | "dropdown",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="main">منوی اصلی</option>
                  <option value="dropdown">منوی کشویی</option>
                </select>
              </div>

              {formData.type === "dropdown" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    والد
                  </label>
                  <select
                    value={formData.parent}
                    onChange={(e) =>
                      setFormData({ ...formData, parent: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">انتخاب والد</option>
                    {navItems
                      .filter((item) => item.type === "main")
                      .map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

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
                    فعال
                  </span>
                </label>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  {editingItem ? "به‌روزرسانی" : "افزودن"}
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

        {/* Navigation Items List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">آیتم‌های منو</h2>

          {organizedItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">هیچ آیتمی یافت نشد</p>
          ) : (
            <div className="space-y-2">
              {organizedItems.map((item) => (
                <div
                  key={item._id}
                  className="border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      {item.children && item.children.length > 0 && (
                        <button
                          onClick={() => toggleExpanded(item._id!)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {expandedItems.has(item._id!) ? (
                            <ChevronDown size={20} />
                          ) : (
                            <ChevronRight size={20} />
                          )}
                        </button>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">{item.href}</p>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item.type === "main"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {item.type === "main" ? "اصلی" : "کشویی"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-500 hover:text-blue-700 p-2"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id!)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Children Items */}
                  {item.children &&
                    item.children.length > 0 &&
                    expandedItems.has(item._id!) && (
                      <div className="border-t border-gray-200">
                        {item.children.map((child) => (
                          <div
                            key={child._id}
                            className="flex items-center justify-between p-4 pl-12 bg-white"
                          >
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {child.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {child.href}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  child.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {child.isActive ? "فعال" : "غیرفعال"}
                              </span>
                              <button
                                onClick={() => handleEdit(child)}
                                className="text-blue-500 hover:text-blue-700 p-2"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(child._id!)}
                                className="text-red-500 hover:text-red-700 p-2"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
