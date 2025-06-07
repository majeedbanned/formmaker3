"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface DownloadButton {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  iconUrl: string;
  bgColor: string;
  textColor: string;
}

interface AppDownloadData {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionDescription: string;
  features: Feature[];
  downloadButtons: DownloadButton[];
  appScreenshots: string[];
  // Visibility setting
  isVisible: boolean;
  // Style settings
  sectionTitleColor: string;
  sectionSubtitleColor: string;
  sectionDescriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  featureTitleColor: string;
  featureDescriptionColor: string;
  featureIconBgColor: string;
  featureIconColor: string;
}

interface AppDownloadEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AppDownloadData) => void;
  initialData: AppDownloadData;
}

export default function AppDownloadEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AppDownloadEditModalProps) {
  const [formData, setFormData] = useState<AppDownloadData>(initialData);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<
    "content" | "appearance" | "features"
  >("content");

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving app download data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    const newFeature: Feature = {
      id: Date.now().toString(),
      title: "",
      description: "",
      icon: "DevicePhoneMobileIcon",
    };
    setFormData({
      ...formData,
      features: [...formData.features, newFeature],
    });
  };

  const removeFeature = (id: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter((feature) => feature.id !== id),
    });
  };

  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    const newFeatures = formData.features.map((feature) =>
      feature.id === id ? { ...feature, [field]: value } : feature
    );
    setFormData({
      ...formData,
      features: newFeatures,
    });
  };

  const addDownloadButton = () => {
    const newButton: DownloadButton = {
      id: Date.now().toString(),
      title: "",
      subtitle: "",
      link: "",
      iconUrl: "",
      bgColor: "#4F46E5",
      textColor: "#FFFFFF",
    };
    setFormData({
      ...formData,
      downloadButtons: [...formData.downloadButtons, newButton],
    });
  };

  const removeDownloadButton = (id: string) => {
    setFormData({
      ...formData,
      downloadButtons: formData.downloadButtons.filter(
        (button) => button.id !== id
      ),
    });
  };

  const updateDownloadButton = (
    id: string,
    field: keyof DownloadButton,
    value: string
  ) => {
    const newButtons = formData.downloadButtons.map((button) =>
      button.id === id ? { ...button, [field]: value } : button
    );
    setFormData({
      ...formData,
      downloadButtons: newButtons,
    });
  };

  const addScreenshot = () => {
    setFormData({
      ...formData,
      appScreenshots: [...formData.appScreenshots, ""],
    });
  };

  const removeScreenshot = (index: number) => {
    setFormData({
      ...formData,
      appScreenshots: formData.appScreenshots.filter((_, i) => i !== index),
    });
  };

  const updateScreenshot = (index: number, value: string) => {
    const newScreenshots = [...formData.appScreenshots];
    newScreenshots[index] = value;
    setFormData({
      ...formData,
      appScreenshots: newScreenshots,
    });
  };

  const handleScreenshotUpload = async (index: number, file: File) => {
    setUploadingImages((prev) => [...prev, index]);

    const formDataToSend = new FormData();
    formDataToSend.append("file", file);

    try {
      const response = await fetch("/api/upload/app-screenshots", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      updateScreenshot(index, data.url);
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `خطا در آپلود تصویر: ${
          error instanceof Error ? error.message : "خطای ناشناخته"
        }`
      );
    } finally {
      setUploadingImages((prev) => prev.filter((i) => i !== index));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      dir="rtl"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              ویرایش بخش دانلود اپلیکیشن
            </h2>
            <button
              onClick={onClose}
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
                <button
                  type="button"
                  onClick={() => setActiveTab("features")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "features"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <DevicePhoneMobileIcon className="h-5 w-5" />
                  ویژگی‌ها و دانلود
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
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
                          نمایش بخش دانلود اپلیکیشن
                        </h3>
                        <p className="text-sm text-gray-600">
                          تعیین کنید که بخش دانلود اپلیکیشن در صفحه اصلی نمایش
                          داده شود یا خیر
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

                  {/* Section Content */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5" />
                      محتوای بخش
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          زیرعنوان بخش
                        </label>
                        <input
                          type="text"
                          value={formData.sectionSubtitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sectionSubtitle: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="اپلیکیشن موبایل"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          عنوان اصلی *
                        </label>
                        <input
                          type="text"
                          value={formData.sectionTitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sectionTitle: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                          placeholder="پارسا موز را همیشه همراه داشته باشید"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          توضیحات بخش *
                        </label>
                        <textarea
                          rows={4}
                          value={formData.sectionDescription}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sectionDescription: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                          placeholder="با استفاده از اپلیکیشن موبایل پارسا موز، در هر زمان و مکان به سیستم مدیریت آموزشی خود دسترسی داشته باشید..."
                        />
                      </div>
                    </div>
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
                    <div className="flex gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            sectionTitleColor: "#1F2937",
                            sectionSubtitleColor: "#4F46E5",
                            sectionDescriptionColor: "#6B7280",
                            backgroundGradientFrom: "#EEF2FF",
                            backgroundGradientTo: "#FFFFFF",
                            featureTitleColor: "#1F2937",
                            featureDescriptionColor: "#6B7280",
                            featureIconBgColor: "#4F46E5",
                            featureIconColor: "#FFFFFF",
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-lg hover:bg-indigo-200 transition-colors"
                      >
                        <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                        کلاسیک آبی
                      </button>
                    </div>
                  </div>

                  {/* Color Settings */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Section Colors */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        رنگ‌های بخش
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ عنوان اصلی
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.sectionTitleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  sectionTitleColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.sectionTitleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  sectionTitleColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Feature Colors */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        رنگ‌های ویژگی‌ها
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ پس‌زمینه آیکون
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.featureIconBgColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  featureIconBgColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.featureIconBgColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  featureIconBgColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Tab */}
              {activeTab === "features" && (
                <div className="space-y-6">
                  {/* Features Management */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <DevicePhoneMobileIcon className="h-5 w-5" />
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

                    <div className="space-y-4">
                      {formData.features.map((feature, index) => (
                        <div
                          key={feature.id}
                          className="bg-white border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-medium text-gray-700">
                              ویژگی {index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeFeature(feature.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                عنوان ویژگی *
                              </label>
                              <input
                                type="text"
                                value={feature.title}
                                onChange={(e) =>
                                  updateFeature(
                                    feature.id,
                                    "title",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="رابط کاربری ساده و زیبا"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                توضیحات ویژگی *
                              </label>
                              <textarea
                                rows={2}
                                value={feature.description}
                                onChange={(e) =>
                                  updateFeature(
                                    feature.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="توضیح مختصری از این ویژگی..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                آیکون (نام کلاس)
                              </label>
                              <select
                                value={feature.icon}
                                onChange={(e) =>
                                  updateFeature(
                                    feature.id,
                                    "icon",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="DevicePhoneMobileIcon">
                                  📱 گوشی موبایل
                                </option>
                                <option value="DeviceTabletIcon">
                                  📱 تبلت
                                </option>
                                <option value="CloudIcon">☁️ ابر</option>
                                <option value="ShieldCheckIcon">
                                  🛡️ امنیت
                                </option>
                                <option value="BoltIcon">⚡ سرعت</option>
                                <option value="UserGroupIcon">
                                  👥 کاربران
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Download Buttons Management */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        دکمه‌های دانلود
                      </h3>
                      <button
                        type="button"
                        onClick={addDownloadButton}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        افزودن دکمه دانلود
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.downloadButtons.map((button, index) => (
                        <div
                          key={button.id}
                          className="bg-white border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-medium text-gray-700">
                              دکمه دانلود {index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeDownloadButton(button.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                عنوان دکمه *
                              </label>
                              <input
                                type="text"
                                value={button.title}
                                onChange={(e) =>
                                  updateDownloadButton(
                                    button.id,
                                    "title",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="دانلود از App Store"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                زیرعنوان
                              </label>
                              <input
                                type="text"
                                value={button.subtitle}
                                onChange={(e) =>
                                  updateDownloadButton(
                                    button.id,
                                    "subtitle",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="App Store"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                لینک دانلود *
                              </label>
                              <input
                                type="url"
                                value={button.link}
                                onChange={(e) =>
                                  updateDownloadButton(
                                    button.id,
                                    "link",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="https://apps.apple.com/..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                URL آیکون
                              </label>
                              <input
                                type="url"
                                value={button.iconUrl}
                                onChange={(e) =>
                                  updateDownloadButton(
                                    button.id,
                                    "iconUrl",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="https://cdn-icons-png.flaticon.com/..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* App Screenshots */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        تصاویر اپلیکیشن
                      </h3>
                      <button
                        type="button"
                        onClick={addScreenshot}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        افزودن تصویر
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.appScreenshots.map((screenshot, index) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-medium text-gray-700">
                              تصویر {index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeScreenshot(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                آپلود تصویر
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleScreenshotUpload(index, file);
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              {uploadingImages.includes(index) && (
                                <div className="mt-2 p-2 bg-indigo-50 rounded-md">
                                  <p className="text-sm text-indigo-600">
                                    در حال آپلود...
                                  </p>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                URL تصویر
                              </label>
                              <input
                                type="url"
                                value={screenshot}
                                onChange={(e) =>
                                  updateScreenshot(index, e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="https://example.com/screenshot.png"
                              />
                            </div>

                            {/* Image Preview */}
                            {screenshot && (
                              <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  پیش‌نمایش:
                                </p>
                                <div className="relative w-32 h-64 border rounded-md overflow-hidden bg-gray-50">
                                  <img
                                    src={screenshot}
                                    alt={`اسکرین‌شات ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <form onSubmit={handleSubmit}>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || uploadingImages.length > 0}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
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
