"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  ListBulletIcon,
  ChartBarIcon,
  PhotoIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface Stat {
  id: number;
  name: string;
  value: string;
}

interface AboutImage {
  url: string;
  alt: string;
}

interface AboutData {
  title: string;
  description: string;
  benefitsTitle: string;
  benefits: string[];
  stats: Stat[];
  image: AboutImage;
  // Visibility setting
  isVisible: boolean;
  // Style settings
  backgroundColor: string;
  titleColor: string;
  descriptionColor: string;
  benefitsTitleColor: string;
  benefitsTextColor: string;
  benefitsIconColor: string;
  statsBackgroundColor: string;
  statsNameColor: string;
  statsValueColor: string;
}

interface AboutEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AboutData) => void;
  initialData: AboutData;
}

export default function AboutEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AboutEditModalProps) {
  const [formData, setFormData] = useState<AboutData>(initialData);
  const [loading, setLoading] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "content" | "benefits" | "stats" | "appearance"
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
      console.error("Error saving about data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addBenefit = () => {
    setFormData({
      ...formData,
      benefits: [...formData.benefits, ""],
    });
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  const addStat = () => {
    const newId = Math.max(...formData.stats.map((s) => s.id), 0) + 1;
    setFormData({
      ...formData,
      stats: [...formData.stats, { id: newId, name: "", value: "" }],
    });
  };

  const removeStat = (index: number) => {
    setFormData({
      ...formData,
      stats: formData.stats.filter((_, i) => i !== index),
    });
  };

  const updateStat = (
    index: number,
    field: keyof Stat,
    value: string | number
  ) => {
    const newStats = [...formData.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setFormData({ ...formData, stats: newStats });
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      dir="rtl"
    >
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
              ویرایش بخش درباره ما
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
                  onClick={() => setActiveTab("benefits")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "benefits"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                  مزایا
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("stats")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "stats"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <ChartBarIcon className="h-5 w-5" />
                  آمار
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
                          نمایش بخش درباره ما
                        </h3>
                        <p className="text-sm text-gray-600">
                          تعیین کنید که بخش درباره ما در صفحه اصلی نمایش داده
                          شود یا خیر
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

                  {/* Basic Content Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5" />
                      محتوای اصلی
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          عنوان بخش *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                          placeholder="درباره پارسا موز"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          توضیحات اصلی *
                        </label>
                        <textarea
                          rows={4}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                          placeholder="توضیح کامل در مورد شرکت و خدمات ارائه شده..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Image Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <PhotoIcon className="h-5 w-5" />
                      تصویر بخش
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          آدرس تصویر
                        </label>
                        <input
                          type="text"
                          value={formData.image.url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              image: { ...formData.image, url: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="/images/about-team.jpg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          متن جایگزین تصویر
                        </label>
                        <input
                          type="text"
                          value={formData.image.alt}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              image: { ...formData.image, alt: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Our team at work"
                        />
                      </div>

                      {/* Image Preview */}
                      {formData.image.url && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            پیش‌نمایش تصویر
                          </label>
                          <div className="relative h-40 w-full rounded-lg overflow-hidden border border-gray-300">
                            <img
                              src={formData.image.url}
                              alt={formData.image.alt}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/images/placeholder.jpg";
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits Tab */}
              {activeTab === "benefits" && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <ListBulletIcon className="h-5 w-5" />
                        مدیریت مزایا
                      </h3>
                      <button
                        type="button"
                        onClick={addBenefit}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        افزودن مزیت جدید
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عنوان بخش مزایا
                      </label>
                      <input
                        type="text"
                        value={formData.benefitsTitle}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            benefitsTitle: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="مزایای استفاده"
                      />
                    </div>

                    {formData.benefits.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <CheckCircleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium mb-2">
                          هیچ مزیتی اضافه نشده است
                        </p>
                        <p className="text-sm mb-4">
                          برای شروع اولین مزیت خود را اضافه کنید
                        </p>
                        <button
                          type="button"
                          onClick={addBenefit}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          افزودن اولین مزیت
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.benefits.map((benefit, index) => (
                          <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  {index + 1}
                                </span>
                                مزیت {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeBenefit(index)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={benefit}
                              onChange={(e) =>
                                updateBenefit(index, e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="توضیح مزیت..."
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === "stats" && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <ChartBarIcon className="h-5 w-5" />
                        مدیریت آمار
                      </h3>
                      <button
                        type="button"
                        onClick={addStat}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        افزودن آمار جدید
                      </button>
                    </div>

                    {formData.stats.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium mb-2">
                          هیچ آماری اضافه نشده است
                        </p>
                        <p className="text-sm mb-4">
                          برای شروع اولین آمار خود را اضافه کنید
                        </p>
                        <button
                          type="button"
                          onClick={addStat}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          افزودن اولین آمار
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.stats.map((stat, index) => (
                          <div
                            key={stat.id}
                            className="bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  {index + 1}
                                </span>
                                آمار {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeStat(index)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  نام آمار
                                </label>
                                <input
                                  type="text"
                                  value={stat.name}
                                  onChange={(e) =>
                                    updateStat(index, "name", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="سال تجربه"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  مقدار آمار
                                </label>
                                <input
                                  type="text"
                                  value={stat.value}
                                  onChange={(e) =>
                                    updateStat(index, "value", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="+10"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
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
                            backgroundColor: "#FFFFFF",
                            titleColor: "#111827",
                            descriptionColor: "#6B7280",
                            benefitsTitleColor: "#111827",
                            benefitsTextColor: "#6B7280",
                            benefitsIconColor: "#10B981",
                            statsBackgroundColor: "#FFFFFF",
                            statsNameColor: "#6B7280",
                            statsValueColor: "#4F46E5",
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                        کلاسیک سفید
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            backgroundColor: "#F0FDF4",
                            titleColor: "#059669",
                            descriptionColor: "#6B7280",
                            benefitsTitleColor: "#059669",
                            benefitsTextColor: "#6B7280",
                            benefitsIconColor: "#059669",
                            statsBackgroundColor: "#FFFFFF",
                            statsNameColor: "#6B7280",
                            statsValueColor: "#059669",
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
                            backgroundColor: "#EEF2FF",
                            titleColor: "#4F46E5",
                            descriptionColor: "#6B7280",
                            benefitsTitleColor: "#4F46E5",
                            benefitsTextColor: "#6B7280",
                            benefitsIconColor: "#4F46E5",
                            statsBackgroundColor: "#FFFFFF",
                            statsNameColor: "#6B7280",
                            statsValueColor: "#4F46E5",
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-lg hover:bg-indigo-200 transition-colors"
                      >
                        <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                        حرفه‌ای آبی
                      </button>
                    </div>
                  </div>

                  {/* Color Settings */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Main Content Colors */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📝</span>
                        رنگ محتوای اصلی
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
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ عنوان
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

                    {/* Benefits Colors */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        رنگ بخش مزایا
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ عنوان مزایا
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.benefitsTitleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  benefitsTitleColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.benefitsTitleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  benefitsTitleColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#111827"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ متن مزایا
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.benefitsTextColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  benefitsTextColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.benefitsTextColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  benefitsTextColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#6B7280"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ آیکون مزایا
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.benefitsIconColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  benefitsIconColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.benefitsIconColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  benefitsIconColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#10B981"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Colors */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        رنگ بخش آمار
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            پس‌زمینه آمار
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.statsBackgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  statsBackgroundColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.statsBackgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  statsBackgroundColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ نام آمار
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.statsNameColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  statsNameColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.statsNameColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  statsNameColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#6B7280"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ مقدار آمار
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.statsValueColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  statsValueColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.statsValueColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  statsValueColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#4F46E5"
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
