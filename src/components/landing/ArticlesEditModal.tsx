"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
  tags: string[];
  content?: string;
}

interface ArticlesData {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionDescription: string;
  viewAllButtonText: string;
  viewAllButtonLink: string;
  articles: Article[];
  // Visibility setting
  isVisible: boolean;
  // Style settings
  sectionTitleColor: string;
  sectionSubtitleColor: string;
  sectionDescriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  cardBackgroundColor: string;
  cardTextColor: string;
  cardHoverShadow: string;
  buttonColor: string;
  buttonTextColor: string;
  tagBackgroundColor: string;
  tagTextColor: string;
}

interface ArticlesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ArticlesData) => void;
  initialData: ArticlesData;
}

export default function ArticlesEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ArticlesEditModalProps) {
  const [formData, setFormData] = useState<ArticlesData>(initialData);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const [isModalReady, setIsModalReady] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "content" | "appearance" | "articles"
  >("content");
  const [isSaving, setIsSaving] = useState(false);

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
  }, [isOpen, isModalReady, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setLoading(true);
    try {
      console.log("Saving articles data from modal:", formData);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving articles data from modal:", error);
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  const addArticle = () => {
    const newArticle: Article = {
      id: Date.now().toString(),
      title: "",
      excerpt: "",
      date: new Date().toLocaleDateString("fa-IR"),
      author: "",
      readTime: "۵ دقیقه",
      image: "",
      tags: [],
      content: "",
    };
    setFormData({
      ...formData,
      articles: [...formData.articles, newArticle],
    });
  };

  const removeArticle = (id: string) => {
    setFormData({
      ...formData,
      articles: formData.articles.filter((article) => article.id !== id),
    });
  };

  const updateArticle = (
    id: string,
    field: keyof Article,
    value: string | string[]
  ) => {
    const newArticles = formData.articles.map((article) =>
      article.id === id ? { ...article, [field]: value } : article
    );
    setFormData({
      ...formData,
      articles: newArticles,
    });
  };

  const handleImageUpload = async (articleId: string, file: File) => {
    setUploadingImages((prev) => [...prev, articleId]);

    try {
      console.log(`Uploading article image for article ${articleId}:`, file.name);
      
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);

      const response = await fetch("/api/upload/article-images", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();
      console.log(`Article image upload response for ${articleId}:`, data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Upload failed for ${file.name}`);
      }

      // Update the article with the new image URL
      updateArticle(articleId, "image", data.url);
      console.log(`Article image upload successful for ${articleId}, URL:`, data.url);
    } catch (error) {
      console.error("Article image upload error:", error);
      alert(
        `خطا در آپلود تصویر: ${
          error instanceof Error ? error.message : "خطای ناشناخته"
        }`
      );
    } finally {
      setUploadingImages((prev) => prev.filter((id) => id !== articleId));
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
              ویرایش بخش مقالات
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
                  onClick={() => setActiveTab("articles")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "articles"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <NewspaperIcon className="h-5 w-5" />
                  مقالات
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
                          نمایش بخش مقالات
                        </h3>
                        <p className="text-sm text-gray-600">
                          تعیین کنید که بخش مقالات در صفحه اصلی نمایش داده شود
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

                  {/* Section Content */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5" />
                      محتوای بخش
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          عنوان بخش *
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
                          placeholder="آخرین مطالب آموزشی"
                        />
                      </div>

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
                          placeholder="مقالات"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          توضیحات بخش
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
                          placeholder="با مطالعه مقالات کارشناسان ما، در مسیر بهبود و توسعه آموزش قدم بردارید."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            متن دکمه "مشاهده همه"
                          </label>
                          <input
                            type="text"
                            value={formData.viewAllButtonText}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                viewAllButtonText: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="مشاهده همه مقالات"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            لینک دکمه "مشاهده همه"
                          </label>
                          <input
                            type="text"
                            value={formData.viewAllButtonLink}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                viewAllButtonLink: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="/blog"
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
                    <div className="flex gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            sectionTitleColor: "#1F2937",
                            sectionSubtitleColor: "#4F46E5",
                            sectionDescriptionColor: "#6B7280",
                            backgroundGradientFrom: "#F9FAFB",
                            backgroundGradientTo: "#FFFFFF",
                            cardBackgroundColor: "#FFFFFF",
                            cardTextColor: "#1F2937",
                            buttonColor: "#4F46E5",
                            buttonTextColor: "#FFFFFF",
                            tagBackgroundColor: "#EEF2FF",
                            tagTextColor: "#4F46E5",
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
                            رنگ عنوان بخش
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

                    {/* Card Colors */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        رنگ کارت‌ها
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ پس‌زمینه کارت
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
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Articles Tab */}
              {activeTab === "articles" && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <NewspaperIcon className="h-5 w-5" />
                        مدیریت مقالات
                      </h3>
                      <button
                        type="button"
                        onClick={addArticle}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        افزودن مقاله جدید
                      </button>
                    </div>

                    {formData.articles.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <NewspaperIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium mb-2">
                          هیچ مقاله‌ای اضافه نشده است
                        </p>
                        <button
                          type="button"
                          onClick={addArticle}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          افزودن اولین مقاله
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {formData.articles.map((article, index) => (
                          <div
                            key={article.id}
                            className="bg-white border border-gray-200 rounded-lg p-6"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  {index + 1}
                                </span>
                                مقاله {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeArticle(article.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    عنوان مقاله *
                                  </label>
                                  <input
                                    type="text"
                                    value={article.title}
                                    onChange={(e) =>
                                      updateArticle(
                                        article.id,
                                        "title",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="عنوان جذاب برای مقاله"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    نویسنده
                                  </label>
                                  <input
                                    type="text"
                                    value={article.author}
                                    onChange={(e) =>
                                      updateArticle(
                                        article.id,
                                        "author",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="نام نویسنده"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  خلاصه مقاله *
                                </label>
                                <textarea
                                  rows={3}
                                  value={article.excerpt}
                                  onChange={(e) =>
                                    updateArticle(
                                      article.id,
                                      "excerpt",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="خلاصه‌ای کوتاه و جذاب از مقاله..."
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    تاریخ انتشار
                                  </label>
                                  <input
                                    type="text"
                                    value={article.date}
                                    onChange={(e) =>
                                      updateArticle(
                                        article.id,
                                        "date",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="۱۲ شهریور ۱۴۰۳"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    زمان مطالعه
                                  </label>
                                  <input
                                    type="text"
                                    value={article.readTime}
                                    onChange={(e) =>
                                      updateArticle(
                                        article.id,
                                        "readTime",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="۵ دقیقه"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    آپلود تصویر
                                  </label>
                                  <div className="flex items-center gap-4">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleImageUpload(article.id, file).then(() => {
                                            // Clear the file input after upload
                                            if (e.target) {
                                              e.target.value = "";
                                            }
                                          });
                                        }
                                      }}
                                      className="hidden"
                                      id={`article-image-${article.id}`}
                                      disabled={uploadingImages.includes(article.id)}
                                    />
                                    <label
                                      htmlFor={`article-image-${article.id}`}
                                      className="cursor-pointer inline-flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 px-4 py-2 rounded-md text-sm font-medium text-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                      <span>
                                        {uploadingImages.includes(article.id) ? "در حال آپلود..." : "انتخاب تصویر"}
                                      </span>
                                    </label>
                                    {uploadingImages.includes(article.id) && (
                                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  URL تصویر
                                </label>
                                <input
                                  type="text"
                                  value={article.image}
                                  onChange={(e) =>
                                    updateArticle(
                                      article.id,
                                      "image",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="https://example.com/image.jpg"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  تگ‌ها (با کاما جدا کنید)
                                </label>
                                <input
                                  type="text"
                                  value={article.tags.join(", ")}
                                  onChange={(e) =>
                                    updateArticle(
                                      article.id,
                                      "tags",
                                      e.target.value
                                        .split(",")
                                        .map((tag) => tag.trim())
                                        .filter((tag) => tag.length > 0)
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="آموزش دیجیتال, فناوری آموزشی"
                                />
                              </div>

                              {/* Image Preview */}
                              {article.image && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    پیش‌نمایش تصویر:
                                  </p>
                                  <div className="relative w-48 h-32 border rounded-md overflow-hidden bg-gray-50">
                                    <img
                                      src={article.image}
                                      alt={article.title || "Preview"}
                                      className="w-full h-full object-cover"
                                      onLoad={() => {
                                        console.log(
                                          "Article preview image loaded successfully:",
                                          article.image
                                        );
                                      }}
                                      onError={(e) => {
                                        console.error(
                                          "Article preview image failed to load:",
                                          article.image
                                        );
                                        // Fallback to placeholder image instead of hiding
                                        const target = e.target as HTMLImageElement;
                                        target.src = "/images/placeholder.jpg";
                                      }}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">
                                    URL: {article.image}
                                  </p>
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
                  disabled={isSaving || loading || uploadingImages.length > 0}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {isSaving || loading ? (
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
                  disabled={isSaving || uploadingImages.length > 0}
                  className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
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
