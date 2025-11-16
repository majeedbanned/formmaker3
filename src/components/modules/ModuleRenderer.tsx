"use client";

import React, { useState } from "react";
import { ModuleConfig } from "@/types/modules";
import DynamicModule from "@/components/DynamicModule";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import { toast } from "sonner";

interface ModuleRendererProps {
  modules: ModuleConfig[];
  isEditMode?: boolean;
  pageId?: string;
  onModulesUpdate?: (modules: ModuleConfig[]) => void;
}

const ModuleRenderer: React.FC<ModuleRendererProps> = ({
  modules,
  isEditMode = false,
  pageId,
  onModulesUpdate,
}) => {
  const { user, isAuthenticated } = usePublicAuth();
  const [currentModules, setCurrentModules] = useState(modules);

  // Check if user is school admin
  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  // Filter and sort modules
  const visibleModules = currentModules
    .filter((module) => module.isVisible)
    .sort((a, b) => a.order - b.order);

  // Save modules to database
  const saveModules = async (updatedModules: ModuleConfig[]) => {
    if (!pageId) return;

    try {
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.hostname + ":" + window.location.port,
        },
        body: JSON.stringify({
          modules: updatedModules,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save modules");
      }

      setCurrentModules(updatedModules);
      if (onModulesUpdate) {
        onModulesUpdate(updatedModules);
      }

      toast.success("تغییرات با موفقیت ذخیره شد");
    } catch (error) {
      console.error("Error saving modules:", error);
      toast.error("خطا در ذخیره تغییرات");
    }
  };

  // Handle module edit
  const handleEditModule = (moduleId: string) => {
    // console.log("Edit module requested:", moduleId);
  };

  // Handle module save
  const handleSaveModule = async (
    moduleId: string,
    updatedConfig: Record<string, unknown>
  ) => {
    const updatedModules = currentModules.map((module) =>
      module.id === moduleId
        ? { ...module, config: updatedConfig, updatedAt: new Date() }
        : module
    );
    await saveModules(updatedModules);
  };

  // Handle visibility toggle
  const handleToggleVisibility = async (
    moduleId: string,
    isVisible: boolean
  ) => {
    const updatedModules = currentModules.map((module) =>
      module.id === moduleId
        ? { ...module, isVisible, updatedAt: new Date() }
        : module
    );
    await saveModules(updatedModules);
  };

  // Handle module delete
  const handleDeleteModule = async (moduleId: string) => {
    const moduleToDelete = currentModules.find((m) => m.id === moduleId);
    if (
      moduleToDelete &&
      window.confirm(`آیا از حذف ماژول "${moduleToDelete.type}" مطمئن هستید؟`)
    ) {
      const updatedModules = currentModules.filter((m) => m.id !== moduleId);
      await saveModules(updatedModules);
    }
  };

  // Empty state
  if (visibleModules.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            صفحه در حال آماده‌سازی است
          </h2>
          <p className="text-gray-600">
            محتوای این صفحه به زودی منتشر خواهد شد
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {visibleModules.map((module) => (
        <DynamicModule
          key={module.id}
          moduleConfig={module}
          isEditMode={isEditMode || isSchoolAdmin}
          onEdit={isSchoolAdmin ? handleEditModule : () => {}}
          onToggleVisibility={isSchoolAdmin ? handleToggleVisibility : () => {}}
          onDelete={isSchoolAdmin ? handleDeleteModule : () => {}}
          onSave={isSchoolAdmin ? handleSaveModule : () => {}}
        />
      ))}
    </div>
  );
};

export default ModuleRenderer;
