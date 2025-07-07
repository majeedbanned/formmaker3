"use client";

import React, { useState, useEffect } from "react";
import { ModuleConfig } from "@/types/modules";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import { toast } from "sonner";
import { Cog6ToothIcon, PlusIcon } from "@heroicons/react/24/outline";
import DynamicModule from "./DynamicModule";
import ModuleManager from "./ModuleManager";

interface DynamicHomePageProps {
  pageId?: string;
}

const DynamicHomePage: React.FC<DynamicHomePageProps> = ({
  pageId = "home",
}) => {
  const { user, isAuthenticated } = usePublicAuth();
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showModuleManager, setShowModuleManager] = useState(false);

  // Check if user is school admin
  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  // Load modules configuration
  useEffect(() => {
    loadModules();
  }, [pageId]);

  const loadModules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/modules?pageId=${pageId}`, {
        headers: {
          "x-domain": window.location.hostname + ":" + window.location.port,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load modules");
      }

      const data = await response.json();
      if (data.success) {
        // Sort modules by order
        const sortedModules = data.data.modules.sort(
          (a: ModuleConfig, b: ModuleConfig) => a.order - b.order
        );
        setModules(sortedModules);
      } else {
        throw new Error(data.error || "Failed to load modules");
      }
    } catch (err) {
      console.error("Error loading modules:", err);
      setError(err instanceof Error ? err.message : "Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModules = async (updatedModules: ModuleConfig[]) => {
    try {
      const response = await fetch("/api/admin/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.hostname + ":" + window.location.port,
        },
        body: JSON.stringify({
          pageId,
          modules: updatedModules,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save modules");
      }

      const data = await response.json();
      if (data.success) {
        setModules(updatedModules);
        setShowModuleManager(false);
        toast.success("تغییرات با موفقیت ذخیره شد");
      } else {
        throw new Error(data.error || "Failed to save modules");
      }
    } catch (err) {
      console.error("Error saving modules:", err);
      toast.error("خطا در ذخیره تغییرات");
    }
  };

  const handleToggleModuleVisibility = async (
    moduleId: string,
    isVisible: boolean
  ) => {
    const updatedModules = modules.map((module) =>
      module.id === moduleId
        ? { ...module, isVisible, updatedAt: new Date() }
        : module
    );
    await handleSaveModules(updatedModules);
  };

  const handleDeleteModule = async (moduleId: string) => {
    const moduleToDelete = modules.find((m) => m.id === moduleId);
    if (
      moduleToDelete &&
      window.confirm(`آیا از حذف ماژول "${moduleToDelete.type}" مطمئن هستید؟`)
    ) {
      const updatedModules = modules.filter((m) => m.id !== moduleId);
      await handleSaveModules(updatedModules);
    }
  };

  const handleEditModule = (moduleId: string) => {
    // The DynamicModule component handles the edit modal internally
    console.log("Edit module requested:", moduleId);
  };

  const handleSaveModule = async (
    moduleId: string,
    updatedConfig: Record<string, unknown>
  ) => {
    const updatedModules = modules.map((module) =>
      module.id === moduleId
        ? { ...module, config: updatedConfig, updatedAt: new Date() }
        : module
    );
    await handleSaveModules(updatedModules);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            در حال بارگذاری...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            خطا در بارگذاری
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadModules}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="overflow-hidden">
      {/* Admin Controls */}
      {isSchoolAdmin && (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col space-y-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-3 rounded-full shadow-lg transition-colors ${
              isEditMode
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
            title={isEditMode ? "خروج از حالت ویرایش" : "ورود به حالت ویرایش"}
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </button>

          {isEditMode && (
            <button
              onClick={() => setShowModuleManager(true)}
              className="p-3 rounded-full shadow-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              title="مدیریت ماژول‌ها"
            >
              <PlusIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      {/* Edit Mode Indicator */}
      {isEditMode && isSchoolAdmin && (
        <div className="fixed top-4 left-4 z-40 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Cog6ToothIcon className="h-5 w-5" />
            <span className="font-medium">حالت ویرایش</span>
          </div>
        </div>
      )}

      {/* Render Modules */}
      {modules
        .filter((module) =>
          // Show all modules for school admins in edit mode
          // Show only visible modules for regular users and guests
          isSchoolAdmin && isEditMode ? true : module.isVisible
        )
        .map((module) => (
          <DynamicModule
            key={module.id}
            moduleConfig={module}
            isEditMode={isEditMode && isSchoolAdmin}
            onEdit={handleEditModule}
            onToggleVisibility={handleToggleModuleVisibility}
            onDelete={handleDeleteModule}
            onSave={handleSaveModule}
          />
        ))}

      {/* Empty State */}
      {modules.filter((module) =>
        isSchoolAdmin && isEditMode ? true : module.isVisible
      ).length === 0 && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isSchoolAdmin
                ? "هیچ ماژولی وجود ندارد"
                : "صفحه در حال آماده‌سازی است"}
            </h2>
            <p className="text-gray-600 mb-6">
              {isSchoolAdmin
                ? "برای شروع، چند ماژول به صفحه اضافه کنید"
                : "محتوای این صفحه به زودی منتشر خواهد شد"}
            </p>
            {isSchoolAdmin && (
              <button
                onClick={() => setShowModuleManager(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                افزودن ماژول‌ها
              </button>
            )}
          </div>
        </div>
      )}

      {/* Admin login links */}
      <div className="fixed bottom-4 left-4 bg-white p-2 rounded-md shadow-md text-sm z-50">
        <div className="space-x-4 rtl:space-x-reverse">
          <a href="/login" className="text-indigo-600 hover:text-indigo-800">
            ورود
          </a>
          <a
            href="/admin/schools"
            className="text-indigo-600 hover:text-indigo-800"
          >
            پنل مدیریت
          </a>
        </div>
      </div>

      {/* Module Manager Modal */}
      {showModuleManager && (
        <ModuleManager
          isOpen={showModuleManager}
          onClose={() => setShowModuleManager(false)}
          currentModules={modules}
          onSaveModules={handleSaveModules}
        />
      )}
    </main>
  );
};

export default DynamicHomePage;
