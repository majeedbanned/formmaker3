"use client";

import React, { useState, useEffect } from "react";
import { ModuleConfig } from "@/types/modules";
import { Button } from "@/components/ui/button";
import ModuleManager from "@/components/ModuleManager";
import DynamicModule from "@/components/DynamicModule";
import { toast } from "sonner";
import { getRequiredModules } from "@/lib/moduleRegistry";
import { Save, Eye, EyeOff, Plus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

interface PageBuilderProps {
  page?: DynamicPage;
  onSave: (pageData: DynamicPage) => Promise<void>;
  onCancel: () => void;
  isNewPage?: boolean;
}

const PageBuilder: React.FC<PageBuilderProps> = ({
  page,
  onSave,
  onCancel,
  isNewPage = false,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [pageData, setPageData] = useState<DynamicPage>({
    title: page?.title || "",
    slug: page?.slug || "",
    metaDescription: page?.metaDescription || "",
    metaKeywords: page?.metaKeywords || "",
    isPublished: page?.isPublished || false,
    modules: page?.modules || [],
    ...page,
  });

  const [showModuleManager, setShowModuleManager] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is school admin
  const isSchoolAdmin = user?.userType === "school";

  // Initialize with default modules for new pages
  useEffect(() => {
    if (isNewPage && pageData.modules.length === 0) {
      const requiredModules = getRequiredModules();
      const defaultModules: ModuleConfig[] = requiredModules.map(
        (module, index) => ({
          id: `${module.type}_${Date.now()}_${index}`,
          type: module.type,
          order: index,
          isVisible: true,
          isEnabled: true,
          config: module.defaultConfig,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      setPageData((prev) => ({
        ...prev,
        modules: defaultModules,
      }));
    }
  }, [isNewPage, pageData.modules.length]);

  const handleInputChange = (
    field: keyof DynamicPage,
    value: string | boolean
  ) => {
    setPageData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSlugChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    setPageData((prev) => ({
      ...prev,
      title,
      slug: slug || "new-page",
    }));
  };

  const handleSaveModules = (updatedModules: ModuleConfig[]) => {
    setPageData((prev) => ({
      ...prev,
      modules: updatedModules,
    }));
    setShowModuleManager(false);
    toast.success("ماژول‌ها به‌روزرسانی شدند");
  };

  const handleToggleModuleVisibility = (
    moduleId: string,
    isVisible: boolean
  ) => {
    const updatedModules = pageData.modules.map((module) =>
      module.id === moduleId
        ? { ...module, isVisible, updatedAt: new Date() }
        : module
    );

    setPageData((prev) => ({
      ...prev,
      modules: updatedModules,
    }));
  };

  const handleDeleteModule = (moduleId: string) => {
    const moduleToDelete = pageData.modules.find((m) => m.id === moduleId);
    if (
      moduleToDelete &&
      window.confirm(`آیا از حذف ماژول "${moduleToDelete.type}" مطمئن هستید؟`)
    ) {
      const updatedModules = pageData.modules.filter((m) => m.id !== moduleId);
      setPageData((prev) => ({
        ...prev,
        modules: updatedModules,
      }));
    }
  };

  const handleEditModule = (moduleId: string) => {
    // The DynamicModule component handles the edit modal internally
    // We'll need to pass an onSave callback to actually save the changes
    // console.log("Edit module requested:", moduleId);
  };

  const handleSaveModule = (
    moduleId: string,
    updatedConfig: Record<string, unknown>
  ) => {
    const updatedModules = pageData.modules.map((module) =>
      module.id === moduleId
        ? { ...module, config: updatedConfig, updatedAt: new Date() }
        : module
    );

    setPageData((prev) => ({
      ...prev,
      modules: updatedModules,
    }));

    toast.success("ماژول با موفقیت به‌روزرسانی شد");
  };

  const handleSave = async () => {
    if (!pageData.title.trim()) {
      toast.error("عنوان صفحه الزامی است");
      return;
    }

    if (!pageData.slug.trim()) {
      toast.error("نشانی صفحه الزامی است");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(pageData);
      toast.success(
        isNewPage ? "صفحه با موفقیت ایجاد شد" : "صفحه با موفقیت به‌روزرسانی شد"
      );
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("خطا در ذخیره صفحه");
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading) {
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

  // For guest users (not authenticated) and non-school users, show the designed page (modules only)
  if (!isAuthenticated || !isSchoolAdmin) {
    return (
      <div className="min-h-screen bg-white">
        {/* Page Content for Guest Users and Regular Users */}
        <div className="w-full">
          {pageData.modules
            .filter((module) => module.isVisible)
            .sort((a, b) => a.order - b.order)
            .map((module) => (
              <DynamicModule
                key={module.id}
                moduleConfig={module}
                isEditMode={false}
                onEdit={() => {}}
                onToggleVisibility={() => {}}
                onDelete={() => {}}
                onSave={() => {}}
              />
            ))}

          {/* Empty state for pages with no visible modules */}
          {pageData.modules.filter((module) => module.isVisible).length ===
            0 && (
            <div className="flex h-screen items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  صفحه در حال آماده‌سازی است
                </h3>
                <p className="text-gray-500">
                  محتوای این صفحه به زودی منتشر خواهد شد
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For school admins, show the full admin interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Button
                variant="ghost"
                onClick={onCancel}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>بازگشت</span>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isNewPage ? "ایجاد صفحه جدید" : `ویرایش: ${pageData.title}`}
                </h1>
                <p className="text-sm text-gray-500">
                  {pageData.modules.length} ماژول
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Button
                variant="outline"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                {isPreviewMode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span>{isPreviewMode ? "خروج از پیش‌نمایش" : "پیش‌نمایش"}</span>
              </Button>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? "در حال ذخیره..." : "ذخیره"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Panel */}
          {!isPreviewMode && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  تنظیمات صفحه
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان صفحه *
                    </label>
                    <input
                      type="text"
                      value={pageData.title}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="عنوان صفحه"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نشانی صفحه *
                    </label>
                    <input
                      type="text"
                      value={pageData.slug}
                      onChange={(e) =>
                        handleInputChange("slug", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="page-url"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      توضیحات متا
                    </label>
                    <textarea
                      value={pageData.metaDescription}
                      onChange={(e) =>
                        handleInputChange("metaDescription", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="توضیحات کوتاه برای SEO"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      کلمات کلیدی
                    </label>
                    <input
                      type="text"
                      value={pageData.metaKeywords}
                      onChange={(e) =>
                        handleInputChange("metaKeywords", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="کلمه1, کلمه2, کلمه3"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={pageData.isPublished}
                      onChange={(e) =>
                        handleInputChange("isPublished", e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isPublished"
                      className="mr-2 block text-sm text-gray-900"
                    >
                      انتشار صفحه
                    </label>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <Button
                    onClick={() => setShowModuleManager(true)}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse"
                  >
                    <Plus className="h-4 w-4" />
                    <span>مدیریت ماژول‌ها</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className={isPreviewMode ? "lg:col-span-4" : "lg:col-span-3"}>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Modules */}
              {pageData.modules
                .sort((a, b) => a.order - b.order)
                .map((module) => (
                  <DynamicModule
                    key={module.id}
                    moduleConfig={module}
                    isEditMode={isSchoolAdmin && !isPreviewMode}
                    onEdit={handleEditModule}
                    onToggleVisibility={handleToggleModuleVisibility}
                    onDelete={handleDeleteModule}
                    onSave={handleSaveModule}
                  />
                ))}

              {/* Empty State */}
              {pageData.modules.length === 0 && (
                <div className="p-12 text-center">
                  <div className="text-gray-400 text-4xl mb-4">📄</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    صفحه خالی است
                  </h3>
                  <p className="text-gray-500 mb-6">
                    برای شروع، ماژول‌هایی به صفحه اضافه کنید
                  </p>
                  <Button onClick={() => setShowModuleManager(true)}>
                    افزودن ماژول‌ها
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Module Manager Modal */}
      {showModuleManager && (
        <ModuleManager
          isOpen={showModuleManager}
          onClose={() => setShowModuleManager(false)}
          currentModules={pageData.modules}
          onSaveModules={handleSaveModules}
        />
      )}
    </div>
  );
};

export default PageBuilder;
