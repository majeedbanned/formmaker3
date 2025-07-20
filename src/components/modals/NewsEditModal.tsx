"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  TrashIcon,
  NewspaperIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
  link: string;
}

interface NewsContent {
  title: string;
  subtitle: string;
  description: string;
  news: NewsItem[];
  viewAllText: string;
  viewAllLink: string;
  isVisible: boolean;
  backgroundColor: string;
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  cardBackgroundColor: string;
  newsTitleColor: string;
  newsExcerptColor: string;
  newsDateColor: string;
  categoryBackgroundColor: string;
  categoryTextColor: string;
  readMoreColor: string;
  viewAllButtonBackgroundColor: string;
  viewAllButtonTextColor: string;
}

interface NewsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: NewsContent) => void;
  currentContent: NewsContent;
}

const colorPresets = [
  {
    name: "آبی",
    backgroundColor: "#FFFFFF",
    titleColor: "#4F46E5",
    subtitleColor: "#111827",
    descriptionColor: "#6B7280",
    cardBackgroundColor: "#FFFFFF",
    newsTitleColor: "#111827",
    newsExcerptColor: "#6B7280",
    newsDateColor: "#6B7280",
    categoryBackgroundColor: "#4F46E5",
    categoryTextColor: "#FFFFFF",
    readMoreColor: "#4F46E5",
    viewAllButtonBackgroundColor: "#4F46E5",
    viewAllButtonTextColor: "#FFFFFF",
  },
  {
    name: "سبز",
    backgroundColor: "#F0FDF4",
    titleColor: "#059669",
    subtitleColor: "#111827",
    descriptionColor: "#6B7280",
    cardBackgroundColor: "#FFFFFF",
    newsTitleColor: "#111827",
    newsExcerptColor: "#6B7280",
    newsDateColor: "#6B7280",
    categoryBackgroundColor: "#059669",
    categoryTextColor: "#FFFFFF",
    readMoreColor: "#059669",
    viewAllButtonBackgroundColor: "#059669",
    viewAllButtonTextColor: "#FFFFFF",
  },
  {
    name: "قرمز",
    backgroundColor: "#FEF2F2",
    titleColor: "#DC2626",
    subtitleColor: "#111827",
    descriptionColor: "#6B7280",
    cardBackgroundColor: "#FFFFFF",
    newsTitleColor: "#111827",
    newsExcerptColor: "#6B7280",
    newsDateColor: "#6B7280",
    categoryBackgroundColor: "#DC2626",
    categoryTextColor: "#FFFFFF",
    readMoreColor: "#DC2626",
    viewAllButtonBackgroundColor: "#DC2626",
    viewAllButtonTextColor: "#FFFFFF",
  },
  {
    name: "بنفش",
    backgroundColor: "#FAF5FF",
    titleColor: "#7C3AED",
    subtitleColor: "#111827",
    descriptionColor: "#6B7280",
    cardBackgroundColor: "#FFFFFF",
    newsTitleColor: "#111827",
    newsExcerptColor: "#6B7280",
    newsDateColor: "#6B7280",
    categoryBackgroundColor: "#7C3AED",
    categoryTextColor: "#FFFFFF",
    readMoreColor: "#7C3AED",
    viewAllButtonBackgroundColor: "#7C3AED",
    viewAllButtonTextColor: "#FFFFFF",
  },
];

export default function NewsEditModal({
  isOpen,
  onClose,
  onSave,
  currentContent,
}: NewsEditModalProps) {
  const [activeTab, setActiveTab] = useState("content");
  const [content, setContent] = useState<NewsContent>(currentContent);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setContent(currentContent);
  }, [currentContent]);

  const handleSave = () => {
    if (
      !content.title.trim() ||
      !content.subtitle.trim() ||
      !content.description.trim()
    ) {
      toast.error("لطفا تمام فیلدهای ضروری را پر کنید");
      return;
    }

    onSave(content);
    onClose();
  };

  const handleAddNews = () => {
    const newNewsItem: NewsItem = {
      id: Date.now(),
      title: "",
      excerpt: "",
      date: "",
      category: "",
      image: "",
      link: "",
    };
    setContent({
      ...content,
      news: [...content.news, newNewsItem],
    });
  };

  const handleDeleteNews = (id: number) => {
    setContent({
      ...content,
      news: content.news.filter((item) => item.id !== id),
    });
  };

  const handleNewsUpdate = (id: number, updatedNews: Partial<NewsItem>) => {
    setContent({
      ...content,
      news: content.news.map((item) =>
        item.id === id ? { ...item, ...updatedNews } : item
      ),
    });
  };

  const handleImageUpload = async (newsId: number, file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/news-images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data && data.success) {
        handleNewsUpdate(newsId, { image: data.url });
        toast.success("تصویر با موفقیت آپلود شد");
      } else {
        toast.error(data.message || "خطا در آپلود تصویر");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("خطا در آپلود تصویر");
    } finally {
      setIsUploading(false);
    }
  };

  const applyColorPreset = (preset: (typeof colorPresets)[0]) => {
    setContent({
      ...content,
      ...preset,
    });
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "content", label: "محتوا" },
    { id: "news", label: "اخبار" },
    { id: "appearance", label: "ظاهر" },
    { id: "links", label: "لینک‌ها" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir="rtl"
    >
      <motion.div
        className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <NewspaperIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              ویرایش بخش اخبار
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === tab.id
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  محتوای بخش
                </h3>
                <button
                  onClick={() =>
                    setContent({ ...content, isVisible: !content.isVisible })
                  }
                  className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-md ${
                    content.isVisible
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {content.isVisible ? (
                    <EyeIcon className="w-4 h-4" />
                  ) : (
                    <EyeSlashIcon className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {content.isVisible ? "نمایش" : "مخفی"}
                  </span>
                </button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان بالا
                  </label>
                  <input
                    type="text"
                    value={content.title}
                    onChange={(e) =>
                      setContent({ ...content, title: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="آخرین اخبار"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان اصلی
                  </label>
                  <input
                    type="text"
                    value={content.subtitle}
                    onChange={(e) =>
                      setContent({ ...content, subtitle: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="تازه‌ترین رویدادها و اخبار"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={content.description}
                    onChange={(e) =>
                      setContent({ ...content, description: e.target.value })
                    }
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="از آخرین تحولات، رویدادها و بروزرسانی‌ها مطلع شوید."
                  />
                </div>
              </div>
            </div>
          )}

          {/* News Tab */}
          {activeTab === "news" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  مدیریت اخبار
                </h3>
                <button
                  onClick={handleAddNews}
                  className="flex items-center space-x-2 rtl:space-x-reverse bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>افزودن خبر</span>
                </button>
              </div>

              <div className="space-y-6">
                {content.news.map((newsItem, index) => (
                  <div
                    key={newsItem.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        خبر {index + 1}
                      </h4>
                      <button
                        onClick={() => handleDeleteNews(newsItem.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          عنوان خبر
                        </label>
                        <input
                          type="text"
                          value={newsItem.title}
                          onChange={(e) =>
                            handleNewsUpdate(newsItem.id, {
                              title: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="عنوان خبر"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          دسته‌بندی
                        </label>
                        <input
                          type="text"
                          value={newsItem.category}
                          onChange={(e) =>
                            handleNewsUpdate(newsItem.id, {
                              category: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="رویدادها"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        خلاصه خبر
                      </label>
                      <textarea
                        value={newsItem.excerpt}
                        onChange={(e) =>
                          handleNewsUpdate(newsItem.id, {
                            excerpt: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="خلاصه کوتاه از خبر..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          تاریخ
                        </label>
                        <input
                          type="text"
                          value={newsItem.date}
                          onChange={(e) =>
                            handleNewsUpdate(newsItem.id, {
                              date: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="۲ مهر ۱۴۰۳"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          لینک خبر
                        </label>
                        <input
                          type="text"
                          value={newsItem.link}
                          onChange={(e) =>
                            handleNewsUpdate(newsItem.id, {
                              link: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="/news/1"
                        />
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تصویر خبر
                      </label>
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        {newsItem.image && (
                          <img
                            src={newsItem.image}
                            alt={newsItem.title}
                            className="w-16 h-16 rounded object-cover border"
                            onError={(e) => {
                              console.error("Failed to load news image preview:", newsItem.image);
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(newsItem.id, file);
                              }
                            }}
                            className="hidden"
                            id={`news-image-${newsItem.id}`}
                          />
                          <label
                            htmlFor={`news-image-${newsItem.id}`}
                            className="cursor-pointer inline-flex items-center space-x-2 rtl:space-x-reverse bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm"
                          >
                            <PhotoIcon className="w-4 h-4" />
                            <span>
                              {isUploading ? "در حال آپلود..." : "انتخاب تصویر"}
                            </span>
                          </label>
                        </div>
                      </div>
                      <input
                        type="url"
                        value={newsItem.image}
                        onChange={(e) =>
                          handleNewsUpdate(newsItem.id, {
                            image: e.target.value,
                          })
                        }
                        className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="یا لینک تصویر را وارد کنید"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                تنظیمات ظاهری
              </h3>

              {/* Color Presets */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  طرح‌های رنگی آماده
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyColorPreset(preset)}
                      className="p-3 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.titleColor }}
                        />
                        <span className="text-sm font-medium">
                          {preset.name}
                        </span>
                      </div>
                      <div className="flex space-x-1 rtl:space-x-reverse">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: preset.backgroundColor }}
                        />
                        <div
                          className="w-3 h-3 rounded"
                          style={{
                            backgroundColor: preset.cardBackgroundColor,
                          }}
                        />
                        <div
                          className="w-3 h-3 rounded"
                          style={{
                            backgroundColor: preset.categoryBackgroundColor,
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Colors */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  رنگ‌های پس‌زمینه
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      پس‌زمینه بخش
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.backgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            backgroundColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.backgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            backgroundColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      پس‌زمینه کارت‌ها
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.cardBackgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            cardBackgroundColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.cardBackgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            cardBackgroundColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Text Colors */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  رنگ‌های متن هدر
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      عنوان بالا
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.titleColor}
                        onChange={(e) =>
                          setContent({ ...content, titleColor: e.target.value })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.titleColor}
                        onChange={(e) =>
                          setContent({ ...content, titleColor: e.target.value })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      عنوان اصلی
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.subtitleColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            subtitleColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.subtitleColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            subtitleColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      توضیحات
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.descriptionColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            descriptionColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.descriptionColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            descriptionColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* News Card Colors */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  رنگ‌های کارت خبر
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      عنوان خبر
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.newsTitleColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            newsTitleColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.newsTitleColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            newsTitleColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      خلاصه خبر
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.newsExcerptColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            newsExcerptColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.newsExcerptColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            newsExcerptColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      تاریخ خبر
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.newsDateColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            newsDateColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.newsDateColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            newsDateColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category and Button Colors */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  رنگ‌های دسته‌بندی و دکمه‌ها
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      پس‌زمینه دسته‌بندی
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.categoryBackgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            categoryBackgroundColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.categoryBackgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            categoryBackgroundColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      متن دسته‌بندی
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.categoryTextColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            categoryTextColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.categoryTextColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            categoryTextColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      لینک ادامه مطلب
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.readMoreColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            readMoreColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.readMoreColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            readMoreColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      دکمه مشاهده همه
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.viewAllButtonBackgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            viewAllButtonBackgroundColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.viewAllButtonBackgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            viewAllButtonBackgroundColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Links Tab */}
          {activeTab === "links" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                تنظیمات لینک
              </h3>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    متن دکمه مشاهده همه
                  </label>
                  <input
                    type="text"
                    value={content.viewAllText}
                    onChange={(e) =>
                      setContent({ ...content, viewAllText: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="مشاهده همه اخبار"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    لینک صفحه اخبار
                  </label>
                  <input
                    type="text"
                    value={content.viewAllLink}
                    onChange={(e) =>
                      setContent({ ...content, viewAllLink: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="/news"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رنگ متن دکمه
                  </label>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <input
                      type="color"
                      value={content.viewAllButtonTextColor}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          viewAllButtonTextColor: e.target.value,
                        })
                      }
                      className="w-10 h-10 rounded border"
                    />
                    <input
                      type="text"
                      value={content.viewAllButtonTextColor}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          viewAllButtonTextColor: e.target.value,
                        })
                      }
                      className="flex-1 p-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 rtl:space-x-reverse p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            ذخیره تغییرات
          </button>
        </div>
      </motion.div>
    </div>
  );
}
