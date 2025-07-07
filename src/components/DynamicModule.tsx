"use client";

import React, { useState } from "react";
import { ModuleConfig } from "@/types/modules";
import { getModuleDefinition } from "@/lib/moduleRegistry";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import { CogIcon } from "@heroicons/react/24/outline";

interface DynamicModuleProps {
  moduleConfig: ModuleConfig;
  isEditMode?: boolean;
  onEdit?: (moduleId: string) => void;
  onToggleVisibility?: (moduleId: string, isVisible: boolean) => void;
  onDelete?: (moduleId: string) => void;
  onSave?: (moduleId: string, updatedConfig: Record<string, unknown>) => void;
}

const DynamicModule: React.FC<DynamicModuleProps> = ({
  moduleConfig,
  isEditMode = false,
  onEdit,
  onToggleVisibility,
  onDelete,
  onSave,
}) => {
  const { user, isAuthenticated } = usePublicAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if user is school admin
  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  const moduleDefinition = getModuleDefinition(moduleConfig.type);

  if (!moduleDefinition) {
    console.error(`Module definition not found for type: ${moduleConfig.type}`);
    return null;
  }

  // Don't render if module is not visible (unless user is admin)
  if (!moduleConfig.isVisible && !isSchoolAdmin) {
    return null;
  }

  // Get the component and edit modal
  const ModuleComponent = moduleDefinition.component;
  const EditModal = moduleDefinition.editModal;

  // Create module props with the configuration
  const moduleProps = {
    moduleConfig,
    isEditMode,
    onEdit,
    onToggleVisibility,
    onDelete,
    onSave,
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(moduleConfig.id);
    } else {
      setShowEditModal(true);
    }
  };

  const handleSave = (data: unknown) => {
    // Call the parent's save handler if provided
    if (onSave && typeof data === "object" && data !== null) {
      onSave(moduleConfig.id, data as Record<string, unknown>);
    }
    // Close the modal
    setShowEditModal(false);
  };

  // Show admin placeholder if module is invisible
  if (!moduleConfig.isVisible && isSchoolAdmin) {
    return (
      <div className="relative bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <span className="text-4xl">{moduleDefinition.icon}</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ماژول {moduleDefinition.name} غیرفعال است
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              این ماژول برای بازدیدکنندگان نمایش داده نمی‌شود.
            </p>
            <div className="flex justify-center space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => onToggleVisibility?.(moduleConfig.id, true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                فعال کردن
              </button>
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <CogIcon className="h-5 w-5" />
                تنظیمات
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Admin overlay controls */}
      {isEditMode && isSchoolAdmin && (
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={() =>
              onToggleVisibility?.(moduleConfig.id, !moduleConfig.isVisible)
            }
            className={`p-2 rounded-lg transition-colors ${
              moduleConfig.isVisible
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            title={moduleConfig.isVisible ? "پنهان کردن" : "نمایش دادن"}
          >
            {moduleConfig.isVisible ? "👁️" : "🙈"}
          </button>
          <button
            onClick={handleEdit}
            className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            title="ویرایش"
          >
            <CogIcon className="h-4 w-4" />
          </button>
          {!moduleDefinition.isRequired && (
            <button
              onClick={() => onDelete?.(moduleConfig.id)}
              className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              title="حذف"
            >
              🗑️
            </button>
          )}
        </div>
      )}

      {/* Render the actual module component */}
      <ModuleComponent {...moduleProps} />

      {/* Edit Modal */}
      {showEditModal && (
        <EditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
          initialData={moduleConfig.config}
          moduleId={moduleConfig.id}
        />
      )}
    </div>
  );
};

export default DynamicModule;
