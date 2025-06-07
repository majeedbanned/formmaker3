"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  Squares2X2Icon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ChartPieIcon,
  UserGroupIcon,
  CalendarIcon,
  AcademicCapIcon,
  CogIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DocumentIcon,
  HomeIcon,
  ShieldCheckIcon,
  StarIcon,
  LightBulbIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

interface Feature {
  name: string;
  description: string;
  iconName: string;
}

interface FeaturesData {
  title: string;
  subtitle: string;
  description: string;
  features: Feature[];
  // Visibility setting
  isVisible: boolean;
  // Style settings
  backgroundColor: string;
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  featureTitleColor: string;
  featureDescriptionColor: string;
}

interface FeaturesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FeaturesData) => void;
  initialData: FeaturesData;
}

// Available icons for features
const availableIcons = [
  { name: "BookOpenIcon", icon: BookOpenIcon, label: "کتاب" },
  {
    name: "ClipboardDocumentCheckIcon",
    icon: ClipboardDocumentCheckIcon,
    label: "ارزیابی",
  },
  {
    name: "ChatBubbleLeftRightIcon",
    icon: ChatBubbleLeftRightIcon,
    label: "چت",
  },
  { name: "ChartPieIcon", icon: ChartPieIcon, label: "نمودار" },
  { name: "UserGroupIcon", icon: UserGroupIcon, label: "کاربران" },
  { name: "CalendarIcon", icon: CalendarIcon, label: "تقویم" },
  { name: "AcademicCapIcon", icon: AcademicCapIcon, label: "آموزش" },
  { name: "CogIcon", icon: CogIcon, label: "تنظیمات" },
  { name: "ComputerDesktopIcon", icon: ComputerDesktopIcon, label: "دسکتاپ" },
  {
    name: "DevicePhoneMobileIcon",
    icon: DevicePhoneMobileIcon,
    label: "موبایل",
  },
  { name: "DocumentIcon", icon: DocumentIcon, label: "سند" },
  { name: "HomeIcon", icon: HomeIcon, label: "خانه" },
  { name: "ShieldCheckIcon", icon: ShieldCheckIcon, label: "امنیت" },
  { name: "StarIcon", icon: StarIcon, label: "ستاره" },
  { name: "LightBulbIcon", icon: LightBulbIcon, label: "ایده" },
  { name: "RocketLaunchIcon", icon: RocketLaunchIcon, label: "راکت" },
];

export default function FeaturesEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: FeaturesEditModalProps) {
  const [formData, setFormData] = useState<FeaturesData>(initialData);
  const [loading, setLoading] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "content" | "features" | "appearance"
  >("content");

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      const timer = setTimeout(() => setIsModalReady(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsModalReady(false);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalReady) {
        const mockEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.MouseEvent;
        handleCloseClick(mockEvent);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isModalReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      const mockEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
      } as React.MouseEvent;
      handleCloseClick(mockEvent);
    } catch (error) {
      console.error("Error saving features data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [
        ...formData.features,
        { name: "", description: "", iconName: "BookOpenIcon" },
      ],
    });
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const updateFeature = (
    index: number,
    field: keyof Feature,
    value: string
  ) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFormData({ ...formData, features: newFeatures });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isModalReady) {
      handleCloseClick(e);
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCloseClick = (e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const getIconComponent = (iconName: string) => {
    const iconData = availableIcons.find((icon) => icon.name === iconName);
    return iconData ? iconData.icon : BookOpenIcon;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="fixed inset-0" onClick={handleBackdropClick} />
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col h-full"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              ویرایش بخش ویژگی‌ها
            </h2>
            <button
              onClick={handleCloseClick}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-6 pb-0">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-reverse space-x-8">
                <button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "content"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  محتوا
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("features")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "features"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                  ویژگی‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("appearance")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "appearance"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <PaintBrushIcon className="h-5 w-5" />
                  ظاهر
                </button>
              </nav>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Content Tab */}
              {activeTab === "content" && (
                <div className="space-y-6">
                  {/* Visibility Section */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <span className="text-2xl">👁️</span>
                          نمایش بخش ویژگی‌ها
                        </h3>
                        <p className="text-sm text-gray-600">
                          تعیین کنید که بخش ویژگی‌ها در صفحه اصلی نمایش داده شود
                          یا خیر
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-medium ${
                            formData.isVisible
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {formData.isVisible ? "فعال" : "غیرفعال"}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isVisible}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                isVisible: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Header Content Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5" />
                      محتوای بخش ویژگی‌ها
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          عنوان کوچک *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                          placeholder="ویژگی‌ها"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          عنوان اصلی *
                        </label>
                        <input
                          type="text"
                          value={formData.subtitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subtitle: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                          placeholder="تمام آنچه برای مدیریت آموزشی نیاز دارید"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          توضیحات *
                        </label>
                        <textarea
                          rows={3}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                          placeholder="توضیح کلی در مورد ویژگی‌های سیستم..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Tab */}
              {activeTab === "features" && (
                <div className="space-y-6">
                  {/* Features Management Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Squares2X2Icon className="h-5 w-5" />
                        مدیریت ویژگی‌ها
                      </h3>
                      <button
                        type="button"
                        onClick={addFeature}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        افزودن ویژگی جدید
                      </button>
                    </div>

                    {formData.features.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Squares2X2Icon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium mb-2">
                          هیچ ویژگی‌ای اضافه نشده است
                        </p>
                        <p className="text-sm mb-4">
                          برای شروع اولین ویژگی خود را اضافه کنید
                        </p>
                        <button
                          type="button"
                          onClick={addFeature}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          افزودن اولین ویژگی
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.features.map((feature, index) => {
                          const IconComponent = getIconComponent(
                            feature.iconName
                          );
                          return (
                            <div
                              key={index}
                              className="bg-white border border-gray-200 rounded-lg p-6"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
                                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {index + 1}
                                  </span>
                                  ویژگی {index + 1}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => removeFeature(index)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    نام ویژگی *
                                  </label>
                                  <input
                                    type="text"
                                    value={feature.name}
                                    onChange={(e) =>
                                      updateFeature(
                                        index,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="نام ویژگی"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    انتخاب آیکون
                                  </label>
                                  <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-md">
                                    <div className="flex items-center justify-center h-8 w-8 rounded bg-indigo-500 text-white">
                                      <IconComponent className="h-4 w-4" />
                                    </div>
                                    <select
                                      value={feature.iconName}
                                      onChange={(e) =>
                                        updateFeature(
                                          index,
                                          "iconName",
                                          e.target.value
                                        )
                                      }
                                      className="flex-1 border-0 focus:ring-0 focus:outline-none"
                                    >
                                      {availableIcons.map((icon) => (
                                        <option
                                          key={icon.name}
                                          value={icon.name}
                                        >
                                          {icon.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  توضیحات ویژگی *
                                </label>
                                <textarea
                                  rows={3}
                                  value={feature.description}
                                  onChange={(e) =>
                                    updateFeature(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="توضیح کامل در مورد این ویژگی..."
                                  required
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  {/* Preset Color Schemes */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <PaintBrushIcon className="h-5 w-5" />
                      قالب‌های رنگی پیش‌فرض
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      برای شروع سریع یکی از قالب‌های آماده را انتخاب کنید:
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            backgroundColor: "#F9FAFB",
                            titleColor: "#4F46E5",
                            subtitleColor: "#111827",
                            descriptionColor: "#6B7280",
                            cardBackgroundColor: "#FFFFFF",
                            cardBorderColor: "#E5E7EB",
                            iconBackgroundColor: "#4F46E5",
                            iconColor: "#FFFFFF",
                            featureTitleColor: "#111827",
                            featureDescriptionColor: "#6B7280",
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-lg hover:bg-indigo-200 transition-colors"
                      >
                        <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                        کلاسیک آبی
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            backgroundColor: "#F0FDF4",
                            titleColor: "#059669",
                            subtitleColor: "#111827",
                            descriptionColor: "#6B7280",
                            cardBackgroundColor: "#FFFFFF",
                            cardBorderColor: "#D1FAE5",
                            iconBackgroundColor: "#059669",
                            iconColor: "#FFFFFF",
                            featureTitleColor: "#111827",
                            featureDescriptionColor: "#6B7280",
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        طبیعت سبز
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            backgroundColor: "#FEF2F2",
                            titleColor: "#DC2626",
                            subtitleColor: "#111827",
                            descriptionColor: "#6B7280",
                            cardBackgroundColor: "#FFFFFF",
                            cardBorderColor: "#FECACA",
                            iconBackgroundColor: "#DC2626",
                            iconColor: "#FFFFFF",
                            featureTitleColor: "#111827",
                            featureDescriptionColor: "#6B7280",
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        انرژی قرمز
                      </button>
                    </div>
                  </div>

                  {/* Color Settings */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Header Colors */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📝</span>
                        رنگ هدر
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ پس‌زمینه
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.backgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  backgroundColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.backgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  backgroundColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#F9FAFB"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ عنوان کوچک
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.titleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  titleColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.titleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  titleColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#4F46E5"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ عنوان اصلی
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.subtitleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  subtitleColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.subtitleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  subtitleColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#111827"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ توضیحات
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.descriptionColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  descriptionColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.descriptionColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  descriptionColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#6B7280"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Colors */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎴</span>
                        رنگ کارت‌ها
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            پس‌زمینه کارت
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.cardBackgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  cardBackgroundColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.cardBackgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  cardBackgroundColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            حاشیه کارت
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.cardBorderColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  cardBorderColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.cardBorderColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  cardBorderColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#E5E7EB"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            پس‌زمینه آیکون
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.iconBackgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  iconBackgroundColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.iconBackgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  iconBackgroundColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#4F46E5"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ آیکون
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.iconColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  iconColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.iconColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  iconColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ عنوان ویژگی
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.featureTitleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  featureTitleColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.featureTitleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  featureTitleColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#111827"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ توضیحات ویژگی
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.featureDescriptionColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  featureDescriptionColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.featureDescriptionColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  featureDescriptionColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#6B7280"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions - Fixed at bottom */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <form onSubmit={handleSubmit}>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin"></span>
                      در حال ذخیره...
                    </span>
                  ) : (
                    "ذخیره تغییرات"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseClick}
                  className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 font-medium transition-colors"
                >
                  لغو
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
