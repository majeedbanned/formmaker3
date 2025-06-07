"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

interface HeroImage {
  url: string;
  alt: string;
  title: string;
}

interface HeroData {
  title: string;
  subtitle: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  images: HeroImage[];
  // Visibility setting
  isVisible: boolean;
  // Style settings
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  primaryButtonColor: string;
  primaryButtonTextColor: string;
  secondaryButtonColor: string;
  secondaryButtonTextColor: string;
  secondaryButtonBorderColor: string;
}

interface HeroEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HeroData) => void;
  initialData: HeroData;
}

export default function HeroEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: HeroEditModalProps) {
  const [formData, setFormData] = useState<HeroData>(initialData);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<number[]>([]);
  const [isModalReady, setIsModalReady] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "content" | "appearance" | "images"
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
      console.error("Error saving hero data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    setFormData({
      ...formData,
      images: [...formData.images, { url: "", alt: "", title: "" }],
    });
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const updateImage = (
    index: number,
    field: keyof HeroImage,
    value: string
  ) => {
    const newImages = [...formData.images];
    newImages[index] = {
      ...newImages[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      images: newImages,
    });
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingImages((prev) => [...prev, index]);

    const formDataToSend = new FormData();
    formDataToSend.append("file", file);

    try {
      const response = await fetch("/api/upload/hero-images", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();
      console.log("Upload response:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      // Update both URL and alt text in a single state update to avoid timing issues
      const currentImage = formData.images[index];
      const newImageData = {
        url: data.url,
        alt: currentImage?.alt || file.name.split(".")[0], // Use existing alt or filename
        title: currentImage?.title || "", // Keep existing title
      };

      // Update the image with all the data at once
      const newImages = [...formData.images];
      newImages[index] = { ...currentImage, ...newImageData };
      setFormData({ ...formData, images: newImages });

      console.log("Upload successful, URL:", data.url);
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
              ویرایش بخش هیرو
            </h2>
            <button
              onClick={handleCloseClick}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tab Navigation - Fixed */}
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
                  onClick={() => setActiveTab("images")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "images"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <PhotoIcon className="h-5 w-5" />
                  تصاویر
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
                          نمایش بخش هیرو
                        </h3>
                        <p className="text-sm text-gray-600">
                          تعیین کنید که بخش هیرو در صفحه اصلی نمایش داده شود یا
                          خیر
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

                  {/* Text Content Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5" />
                      محتوای متنی
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            عنوان اصلی *
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                            placeholder="نام سیستم یا خدمات شما"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            زیرعنوان *
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
                            placeholder="توضیح کوتاه از خدمات"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          توضیحات تفصیلی *
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
                          placeholder="توضیح کامل و جذاب از محصول یا خدمات شما..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Button Settings Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      دکمه‌های عملیات
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2">
                          دکمه اصلی
                        </h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            متن دکمه
                          </label>
                          <input
                            type="text"
                            value={formData.primaryButtonText}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                primaryButtonText: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="شروع رایگان"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            لینک دکمه
                          </label>
                          <input
                            type="text"
                            value={formData.primaryButtonLink}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                primaryButtonLink: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="/signup"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2">
                          دکمه فرعی
                        </h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            متن دکمه
                          </label>
                          <input
                            type="text"
                            value={formData.secondaryButtonText}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                secondaryButtonText: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="نمایش دمو"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            لینک دکمه
                          </label>
                          <input
                            type="text"
                            value={formData.secondaryButtonLink}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                secondaryButtonLink: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="/demo"
                          />
                        </div>
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
                    <p className="text-sm text-gray-600 mb-4">
                      برای شروع سریع یکی از قالب‌های آماده را انتخاب کنید:
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            titleColor: "#4F46E5",
                            subtitleColor: "#374151",
                            descriptionColor: "#6B7280",
                            backgroundGradientFrom: "#EEF2FF",
                            backgroundGradientTo: "#FFFFFF",
                            primaryButtonColor: "#4F46E5",
                            primaryButtonTextColor: "#FFFFFF",
                            secondaryButtonColor: "#FFFFFF",
                            secondaryButtonTextColor: "#4F46E5",
                            secondaryButtonBorderColor: "#4F46E5",
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
                            titleColor: "#059669",
                            subtitleColor: "#374151",
                            descriptionColor: "#6B7280",
                            backgroundGradientFrom: "#ECFDF5",
                            backgroundGradientTo: "#FFFFFF",
                            primaryButtonColor: "#059669",
                            primaryButtonTextColor: "#FFFFFF",
                            secondaryButtonColor: "#FFFFFF",
                            secondaryButtonTextColor: "#059669",
                            secondaryButtonBorderColor: "#059669",
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
                            titleColor: "#DC2626",
                            subtitleColor: "#374151",
                            descriptionColor: "#6B7280",
                            backgroundGradientFrom: "#FEF2F2",
                            backgroundGradientTo: "#FFFFFF",
                            primaryButtonColor: "#DC2626",
                            primaryButtonTextColor: "#FFFFFF",
                            secondaryButtonColor: "#FFFFFF",
                            secondaryButtonTextColor: "#DC2626",
                            secondaryButtonBorderColor: "#DC2626",
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        انرژی قرمز
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            titleColor: "#7C3AED",
                            subtitleColor: "#374151",
                            descriptionColor: "#6B7280",
                            backgroundGradientFrom: "#F5F3FF",
                            backgroundGradientTo: "#FFFFFF",
                            primaryButtonColor: "#7C3AED",
                            primaryButtonTextColor: "#FFFFFF",
                            secondaryButtonColor: "#FFFFFF",
                            secondaryButtonTextColor: "#7C3AED",
                            secondaryButtonBorderColor: "#7C3AED",
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-300 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                        لوکس بنفش
                      </button>
                    </div>
                  </div>

                  {/* Color Settings */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Text Colors Section */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📝</span>
                        رنگ متن‌ها
                      </h4>
                      <div className="space-y-4">
                        {/* Title Color */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ عنوان اصلی
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

                        {/* Subtitle Color */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ زیرعنوان
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
                              placeholder="#374151"
                            />
                          </div>
                        </div>

                        {/* Description Color */}
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

                    {/* Background Colors Section */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎨</span>
                        رنگ پس‌زمینه
                      </h4>
                      <div className="space-y-4">
                        {/* Background Gradient From */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ شروع گرادیان
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.backgroundGradientFrom}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  backgroundGradientFrom: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.backgroundGradientFrom}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  backgroundGradientFrom: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#EEF2FF"
                            />
                          </div>
                        </div>

                        {/* Background Gradient To */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ پایان گرادیان
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.backgroundGradientTo}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  backgroundGradientTo: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.backgroundGradientTo}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  backgroundGradientTo: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Button Colors Section */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🔘</span>
                        رنگ دکمه‌ها
                      </h4>
                      <div className="space-y-6">
                        {/* Primary Button Colors */}
                        <div className="space-y-4">
                          <h5 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2">
                            دکمه اصلی
                          </h5>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              رنگ پس‌زمینه
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.primaryButtonColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    primaryButtonColor: e.target.value,
                                  })
                                }
                                className="w-12 h-10 border border-gray-300 rounded-md"
                              />
                              <input
                                type="text"
                                value={formData.primaryButtonColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    primaryButtonColor: e.target.value,
                                  })
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="#4F46E5"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              رنگ متن
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.primaryButtonTextColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    primaryButtonTextColor: e.target.value,
                                  })
                                }
                                className="w-12 h-10 border border-gray-300 rounded-md"
                              />
                              <input
                                type="text"
                                value={formData.primaryButtonTextColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    primaryButtonTextColor: e.target.value,
                                  })
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="#FFFFFF"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Secondary Button Colors */}
                        <div className="space-y-4">
                          <h5 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2">
                            دکمه فرعی
                          </h5>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              رنگ پس‌زمینه
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.secondaryButtonColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    secondaryButtonColor: e.target.value,
                                  })
                                }
                                className="w-12 h-10 border border-gray-300 rounded-md"
                              />
                              <input
                                type="text"
                                value={formData.secondaryButtonColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    secondaryButtonColor: e.target.value,
                                  })
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="#FFFFFF"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              رنگ متن
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.secondaryButtonTextColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    secondaryButtonTextColor: e.target.value,
                                  })
                                }
                                className="w-12 h-10 border border-gray-300 rounded-md"
                              />
                              <input
                                type="text"
                                value={formData.secondaryButtonTextColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    secondaryButtonTextColor: e.target.value,
                                  })
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="#4F46E5"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              رنگ حاشیه
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.secondaryButtonBorderColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    secondaryButtonBorderColor: e.target.value,
                                  })
                                }
                                className="w-12 h-10 border border-gray-300 rounded-md"
                              />
                              <input
                                type="text"
                                value={formData.secondaryButtonBorderColor}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    secondaryButtonBorderColor: e.target.value,
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
                </div>
              )}

              {/* Images Tab */}
              {activeTab === "images" && (
                <div className="space-y-6">
                  {/* Image Management Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <PhotoIcon className="h-5 w-5" />
                        مدیریت تصاویر اسلایدر
                      </h3>
                      <button
                        type="button"
                        onClick={addImage}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        افزودن تصویر جدید
                      </button>
                    </div>

                    {formData.images.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium mb-2">
                          هیچ تصویری اضافه نشده است
                        </p>
                        <p className="text-sm mb-4">
                          برای شروع اولین تصویر خود را اضافه کنید
                        </p>
                        <button
                          type="button"
                          onClick={addImage}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          افزودن اولین تصویر
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.images.map((image, index) => (
                          <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-lg p-6"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  {index + 1}
                                </span>
                                تصویر {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Image Upload */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                آپلود تصویر
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(index, file).then(() => {
                                      // Clear the file input after upload
                                      if (e.target) {
                                        e.target.value = "";
                                      }
                                    });
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              {uploadingImages.includes(index) && (
                                <div className="mt-2 p-2 bg-indigo-50 rounded-md">
                                  <p className="text-sm text-indigo-600 flex items-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-indigo-600 border-r-transparent rounded-full animate-spin"></span>
                                    در حال آپلود تصویر...
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  URL تصویر
                                </label>
                                <input
                                  type="text"
                                  value={image.url}
                                  onChange={(e) =>
                                    updateImage(index, "url", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="/images/hero-1.png"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  متن جایگزین (Alt)
                                </label>
                                <input
                                  type="text"
                                  value={image.alt}
                                  onChange={(e) =>
                                    updateImage(index, "alt", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="توضیح تصویر برای دسترسی"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  عنوان تصویر
                                </label>
                                <input
                                  type="text"
                                  value={image.title}
                                  onChange={(e) =>
                                    updateImage(index, "title", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="عنوان نمایشی تصویر"
                                />
                              </div>
                            </div>

                            {/* Image Preview */}
                            {image.url && (
                              <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  پیش‌نمایش:
                                </p>
                                <div className="relative w-48 h-32 border rounded-md overflow-hidden bg-gray-50">
                                  <img
                                    src={image.url}
                                    alt={image.alt || "Preview"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.error(
                                        "Preview image failed to load:",
                                        image.url
                                      );
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                    }}
                                    onLoad={() => {
                                      console.log(
                                        "Preview image loaded successfully:",
                                        image.url
                                      );
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  URL: {image.url}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
                  disabled={loading || uploadingImages.length > 0}
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
