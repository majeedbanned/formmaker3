"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  ModuleConfig,
  ModuleType,
  ModuleDefinition,
  ModuleCategory,
} from "@/types/modules";
import {
  getAvailableModules,
  getModuleDefinition,
  getModulesByCategory,
} from "@/lib/moduleRegistry";

interface ModuleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentModules: ModuleConfig[];
  onSaveModules: (modules: ModuleConfig[]) => void;
}

interface SortableModuleItemProps {
  module: ModuleConfig;
  onEdit: (moduleId: string) => void;
  onToggleVisibility: (moduleId: string) => void;
  onDelete: (moduleId: string) => void;
}

const SortableModuleItem: React.FC<SortableModuleItemProps> = ({
  module,
  onEdit,
  onToggleVisibility,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const moduleDefinition = getModuleDefinition(module.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border-2 p-4 ${
        isDragging ? "border-blue-300" : "border-gray-200"
      } ${module.isVisible ? "" : "opacity-60"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <Bars3Icon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-2xl">{moduleDefinition.icon}</span>
            <div>
              <h3 className="font-medium text-gray-900">
                {moduleDefinition.name}
              </h3>
              <p className="text-sm text-gray-500">
                {moduleDefinition.description}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => onToggleVisibility(module.id)}
            className={`p-2 rounded-lg transition-colors ${
              module.isVisible
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            title={module.isVisible ? "پنهان کردن" : "نمایش دادن"}
          >
            {module.isVisible ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => onEdit(module.id)}
            className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            title="ویرایش"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          {!moduleDefinition.isRequired && (
            <button
              onClick={() => onDelete(module.id)}
              className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              title="حذف"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ModuleManager: React.FC<ModuleManagerProps> = ({
  isOpen,
  onClose,
  currentModules,
  onSaveModules,
}) => {
  const [modules, setModules] = useState<ModuleConfig[]>(currentModules);
  const [availableModules, setAvailableModules] = useState<ModuleDefinition[]>(
    []
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    ModuleCategory | "all"
  >("all");
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const allModules = getAvailableModules();
    const usedModuleTypes = new Set(currentModules.map((m) => m.type));
    const available = allModules.filter(
      (module) => !usedModuleTypes.has(module.type)
    );
    setAvailableModules(available);
  }, [currentModules]);

  useEffect(() => {
    setModules(currentModules);
    setHasChanges(false);
  }, [currentModules]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order property
        const reorderedItems = newItems.map((item, index) => ({
          ...item,
          order: index,
        }));

        setHasChanges(true);
        return reorderedItems;
      });
    }
  };

  const handleAddModule = (moduleType: ModuleType) => {
    const moduleDefinition = getModuleDefinition(moduleType);
    const newModule: ModuleConfig = {
      id: `${moduleType}_${Date.now()}`,
      type: moduleType,
      order: modules.length,
      isVisible: true,
      isEnabled: true,
      config: moduleDefinition.defaultConfig,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setModules([...modules, newModule]);
    setShowAddModal(false);
    setHasChanges(true);
    toast.success(`ماژول ${moduleDefinition.name} اضافه شد`);
  };

  const handleToggleVisibility = (moduleId: string) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId
          ? { ...module, isVisible: !module.isVisible, updatedAt: new Date() }
          : module
      )
    );
    setHasChanges(true);
  };

  const handleDeleteModule = (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    if (module) {
      const moduleDefinition = getModuleDefinition(module.type);
      if (moduleDefinition.isRequired) {
        toast.error("این ماژول الزامی است و قابل حذف نیست");
        return;
      }

      setModules(modules.filter((m) => m.id !== moduleId));
      setHasChanges(true);
      toast.success(`ماژول ${moduleDefinition.name} حذف شد`);
    }
  };

  const handleSave = () => {
    onSaveModules(modules);
    setHasChanges(false);
    toast.success("تغییرات ذخیره شد");
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        "آیا مطمئن هستید؟ تغییرات ذخیره نشده از بین خواهند رفت."
      );
      if (!confirmed) return;
    }
    onClose();
  };

  const getFilteredAvailableModules = () => {
    if (selectedCategory === "all") {
      return availableModules;
    }
    return availableModules.filter(
      (module) => module.category === selectedCategory
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              مدیریت ماژول‌ها
            </h2>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {hasChanges && (
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-amber-600">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">تغییرات ذخیره نشده</span>
              </div>
            )}
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col h-full max-h-[calc(90vh-80px)]">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                ماژول‌های فعال
              </h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>افزودن ماژول</span>
              </button>
            </div>
            <p className="text-sm text-gray-600">
              ماژول‌ها را با کشیدن و رها کردن مرتب کنید
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={modules.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {modules.map((module) => (
                    <SortableModuleItem
                      key={module.id}
                      module={module}
                      onEdit={(moduleId) => {
                        // Handle edit - this will be implemented later
                        toast.info(
                          "ویرایش ماژول‌ها در نسخه بعدی اضافه خواهد شد"
                        );
                      }}
                      onToggleVisibility={handleToggleVisibility}
                      onDelete={handleDeleteModule}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-600">
              <span>تعداد ماژول‌ها:</span>
              <span className="font-medium">{modules.length}</span>
            </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg transition-colors ${
                  hasChanges
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <CheckIcon className="h-4 w-4" />
                <span>ذخیره تغییرات</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Module Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  افزودن ماژول جدید
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      دسته‌بندی:
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) =>
                        setSelectedCategory(
                          e.target.value as ModuleCategory | "all"
                        )
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">همه دسته‌ها</option>
                      <option value={ModuleCategory.HEADER}>هدر</option>
                      <option value={ModuleCategory.HERO}>هیرو</option>
                      <option value={ModuleCategory.CONTENT}>محتوا</option>
                      <option value={ModuleCategory.SOCIAL_PROOF}>نظرات</option>
                      <option value={ModuleCategory.CONTACT}>تماس</option>
                      <option value={ModuleCategory.FOOTER}>فوتر</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {getFilteredAvailableModules().map((module) => (
                    <button
                      key={module.type}
                      onClick={() => handleAddModule(module.type)}
                      className="p-4 text-left rtl:text-right border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <span className="text-2xl">{module.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {module.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {module.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {getFilteredAvailableModules().length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📦</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      ماژولی برای افزودن وجود ندارد
                    </h3>
                    <p className="text-sm text-gray-500">
                      همه ماژول‌های موجود قبلاً اضافه شده‌اند
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModuleManager;
