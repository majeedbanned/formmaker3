"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

interface Testimonial {
  id: string;
  content: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
}

interface TestimonialsData {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionDescription: string;
  testimonials: Testimonial[];
  // Visibility setting
  isVisible: boolean;
  // Style settings
  sectionTitleColor: string;
  sectionSubtitleColor: string;
  sectionDescriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  testimonialBgColor: string;
  testimonialTextColor: string;
  authorNameColor: string;
  authorRoleColor: string;
  starActiveColor: string;
  starInactiveColor: string;
}

interface TestimonialsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TestimonialsData) => void;
  initialData: TestimonialsData;
}

export default function TestimonialsEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: TestimonialsEditModalProps) {
  const [formData, setFormData] = useState<TestimonialsData>(initialData);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<
    "content" | "appearance" | "testimonials"
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
      console.error("Error saving testimonials data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTestimonial = () => {
    const newTestimonial: Testimonial = {
      id: Date.now().toString(),
      content: "",
      author: "",
      role: "",
      avatar: "",
      rating: 5,
    };
    setFormData({
      ...formData,
      testimonials: [...formData.testimonials, newTestimonial],
    });
  };

  const removeTestimonial = (id: string) => {
    setFormData({
      ...formData,
      testimonials: formData.testimonials.filter(
        (testimonial) => testimonial.id !== id
      ),
    });
  };

  const updateTestimonial = (
    id: string,
    field: keyof Testimonial,
    value: string | number
  ) => {
    const newTestimonials = formData.testimonials.map((testimonial) =>
      testimonial.id === id ? { ...testimonial, [field]: value } : testimonial
    );
    setFormData({
      ...formData,
      testimonials: newTestimonials,
    });
  };

  const handleAvatarUpload = async (id: string, file: File) => {
    setUploadingImages((prev) => [...prev, id]);

    const formDataToSend = new FormData();
    formDataToSend.append("file", file);

    try {
      const response = await fetch("/api/upload/testimonial-avatars", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      updateTestimonial(id, "avatar", data.url);
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `خطا در آپلود تصویر: ${
          error instanceof Error ? error.message : "خطای ناشناخته"
        }`
      );
    } finally {
      setUploadingImages((prev) => prev.filter((imgId) => imgId !== id));
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
              ویرایش بخش نظرات مشتریان
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
                  onClick={() => setActiveTab("testimonials")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "testimonials"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  نظرات
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
                          نمایش بخش نظرات مشتریان
                        </h3>
                        <p className="text-sm text-gray-600">
                          تعیین کنید که بخش نظرات مشتریان در صفحه اصلی نمایش
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
                          placeholder="نظرات مشتریان"
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
                          placeholder="مدارس در مورد ما چه می‌گویند"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          توضیحات بخش *
                        </label>
                        <textarea
                          rows={3}
                          value={formData.sectionDescription}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sectionDescription: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                          placeholder="بیش از ۲۵۰ مدرسه از سراسر کشور به پارسا موز اعتماد کرده‌اند."
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
                            testimonialBgColor: "#FFFFFF",
                            testimonialTextColor: "#1F2937",
                            authorNameColor: "#1F2937",
                            authorRoleColor: "#6B7280",
                            starActiveColor: "#FBBF24",
                            starInactiveColor: "#D1D5DB",
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
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📝</span>
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

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ زیرعنوان
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.sectionSubtitleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  sectionSubtitleColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.sectionSubtitleColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  sectionSubtitleColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Testimonial Colors */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">💬</span>
                        رنگ‌های کارت نظرات
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ پس‌زمینه کارت
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.testimonialBgColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  testimonialBgColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.testimonialBgColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  testimonialBgColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ متن نظر
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.testimonialTextColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  testimonialTextColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.testimonialTextColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  testimonialTextColor: e.target.value,
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

              {/* Testimonials Tab */}
              {activeTab === "testimonials" && (
                <div className="space-y-6">
                  {/* Testimonials Management */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        مدیریت نظرات مشتریان
                      </h3>
                      <button
                        type="button"
                        onClick={addTestimonial}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        افزودن نظر جدید
                      </button>
                    </div>

                    {formData.testimonials.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium mb-2">
                          هیچ نظری اضافه نشده است
                        </p>
                        <p className="text-sm mb-4">
                          برای شروع اولین نظر مشتری خود را اضافه کنید
                        </p>
                        <button
                          type="button"
                          onClick={addTestimonial}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          افزودن اولین نظر
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {formData.testimonials.map((testimonial, index) => (
                          <div
                            key={testimonial.id}
                            className="bg-white border border-gray-200 rounded-lg p-6"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  {index + 1}
                                </span>
                                نظر {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() =>
                                  removeTestimonial(testimonial.id)
                                }
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              {/* Content */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  متن نظر *
                                </label>
                                <textarea
                                  rows={3}
                                  value={testimonial.content}
                                  onChange={(e) =>
                                    updateTestimonial(
                                      testimonial.id,
                                      "content",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="نظر مشتری را در اینجا وارد کنید..."
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Author */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    نام نویسنده *
                                  </label>
                                  <input
                                    type="text"
                                    value={testimonial.author}
                                    onChange={(e) =>
                                      updateTestimonial(
                                        testimonial.id,
                                        "author",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="محمد احمدی"
                                    required
                                  />
                                </div>

                                {/* Role */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    سمت نویسنده *
                                  </label>
                                  <input
                                    type="text"
                                    value={testimonial.role}
                                    onChange={(e) =>
                                      updateTestimonial(
                                        testimonial.id,
                                        "role",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="مدیر دبیرستان شهید بهشتی"
                                    required
                                  />
                                </div>
                              </div>

                              {/* Rating */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  امتیاز (۱ تا ۵ ستاره)
                                </label>
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() =>
                                        updateTestimonial(
                                          testimonial.id,
                                          "rating",
                                          star
                                        )
                                      }
                                      className="p-1"
                                    >
                                      <StarIcon
                                        className={`h-6 w-6 ${
                                          star <= testimonial.rating
                                            ? "text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    </button>
                                  ))}
                                  <span className="text-sm text-gray-600 mr-2">
                                    {testimonial.rating} ستاره
                                  </span>
                                </div>
                              </div>

                              {/* Avatar Upload */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  آپلود تصویر پروفایل
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleAvatarUpload(testimonial.id, file);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {uploadingImages.includes(testimonial.id) && (
                                  <div className="mt-2 p-2 bg-indigo-50 rounded-md">
                                    <p className="text-sm text-indigo-600 flex items-center gap-2">
                                      <span className="inline-block w-4 h-4 border-2 border-indigo-600 border-r-transparent rounded-full animate-spin"></span>
                                      در حال آپلود تصویر...
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Avatar URL */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  URL تصویر پروفایل
                                </label>
                                <input
                                  type="url"
                                  value={testimonial.avatar}
                                  onChange={(e) =>
                                    updateTestimonial(
                                      testimonial.id,
                                      "avatar",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="/images/avatar-1.jpg"
                                />
                              </div>

                              {/* Avatar Preview */}
                              {testimonial.avatar && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    پیش‌نمایش تصویر:
                                  </p>
                                  <div className="relative w-16 h-16 border rounded-full overflow-hidden bg-gray-50">
                                    <img
                                      src={testimonial.avatar}
                                      alt={`تصویر ${testimonial.author}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.style.display = "none";
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
