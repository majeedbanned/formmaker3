"use client";

import React, { useState, useEffect } from "react";
import { ModuleConfig } from "@/types/modules";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import { toast } from "sonner";
import { Cog6ToothIcon, PlusIcon, XMarkIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
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
  const [showMobileAppPanel, setShowMobileAppPanel] = useState(true);
  const [mobileAppPanelMinimized, setMobileAppPanelMinimized] = useState(false);

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

      {/* Mobile App Download Panel */}
      {!mobileAppPanelMinimized && showMobileAppPanel && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-l-2xl shadow-2xl max-w-sm">
            <div className="p-6 relative">
              {/* Close Button */}
              <button
                onClick={() => setMobileAppPanelMinimized(true)}
                className="absolute top-3 left-3 p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="بستن پنل"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="flex items-center mb-4 mt-2">
                <DevicePhoneMobileIcon className="h-8 w-8 ml-3" />
                <div>
                  <h3 className="text-xl font-bold">اپلیکیشن موبایل</h3>
                  <p className="text-sm text-white/80">دانلود نسخه اندروید و iOS</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-white/90 mb-6">
                برای تجربه بهتر و دسترسی سریع‌تر، اپلیکیشن موبایل را دانلود کنید
              </p>

              {/* Download Links */}
              <div className="space-y-3">
                {/* Android Download */}
                <a
                  href="https://farsamooz.ir/uploads/parsamooz-latest.apk"
                  className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all transform hover:scale-105 group"
                  download
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center ml-3">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.6,9.48l-7.36-4.24c-0.5-0.29-1.12-0.29-1.62,0L1.25,9.48C0.76,9.77,0.44,10.29,0.44,10.86v8.49 c0,0.57,0.32,1.09,0.81,1.38l7.36,4.24c0.25,0.15,0.53,0.22,0.81,0.22s0.56-0.07,0.81-0.22l7.36-4.24 c0.5-0.29,0.81-0.81,0.81-1.38v-8.49C18.4,10.29,18.09,9.77,17.6,9.48z M17.24,18.9l-6.8,3.92c-0.16,0.09-0.36,0.09-0.52,0 l-6.8-3.92c-0.16-0.09-0.26-0.26-0.26-0.44V11.3l7.37,4.25c0.25,0.15,0.53,0.22,0.81,0.22s0.56-0.07,0.81-0.22l7.37-4.25v7.17 C17.5,18.64,17.4,18.81,17.24,18.9z M7.85,6.35l5.3,3.05v6.12c0,0.22,0.18,0.4,0.4,0.4s0.4-0.18,0.4-0.4V9.77l5.3-3.05 c0.19-0.11,0.25-0.35,0.14-0.53c-0.11-0.19-0.35-0.25-0.53-0.14L13.55,9.1L8.24,6.05C8.06,5.94,7.82,6,7.71,6.18 S7.66,6.46,7.85,6.35z"/>
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">اندروید</div>
                      <div className="text-xs text-white/70">فایل APK</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>

                {/* iOS/PWA Link */}
                <a
                  href="https://wpa.farsamooz.ir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all transform hover:scale-105 group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center ml-3">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">iOS / وب‌اپ</div>
                      <div className="text-xs text-white/70">Progressive Web App</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 transform group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimized Tab */}
      {mobileAppPanelMinimized && (
        <button
          onClick={() => setMobileAppPanelMinimized(false)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-l-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 group"
          aria-label="باز کردن پنل دانلود اپلیکیشن"
        >
          <div className="py-6 px-2 flex flex-col items-center">
            <DevicePhoneMobileIcon className="h-6 w-6 mb-2" />
            <div className="writing-mode-vertical text-sm font-semibold whitespace-nowrap">
              دانلود اپلیکیشن
            </div>
          </div>
        </button>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%) translateY(-50%);
            opacity: 0;
          }
          to {
            transform: translateX(0) translateY(-50%);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </main>
  );
};

export default DynamicHomePage;
