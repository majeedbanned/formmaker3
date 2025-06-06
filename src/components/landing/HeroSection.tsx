"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
}

export default function HeroSection() {
  const { user, isAuthenticated } = useAuth();
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is school admin
  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  useEffect(() => {
    fetchHeroData();
  }, []);

  useEffect(() => {
    if (heroData?.images && heroData.images.length > 1) {
      const timer = setInterval(() => {
        setCurrentImageIndex((prev) =>
          prev === heroData.images.length - 1 ? 0 : prev + 1
        );
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [heroData?.images]);

  const fetchHeroData = async () => {
    try {
      const response = await fetch("/api/admin/hero");
      const data = await response.json();
      if (data.success) {
        console.log("Fetched hero data:", data.hero);
        console.log("Hero images:", data.hero.images);
        setHeroData(data.hero);
      }
    } catch (error) {
      console.error("Error fetching hero data:", error);
      // Set default data if fetch fails
      setHeroData({
        title: "پارسا موز",
        subtitle: "سیستم مدیریت آموزش",
        description:
          "سیستم مدیریت آموزش، راهکاری جامع برای مدارس و موسسات آموزشی. با پارسا موز، آسان‌تر تدریس کنید، عملکرد دانش آموزان را رصد کنید و ارتباط موثرتری با والدین داشته باشید.",
        primaryButtonText: "شروع رایگان",
        primaryButtonLink: "/signup",
        secondaryButtonText: "نمایش دمو",
        secondaryButtonLink: "/demo",
        images: [
          {
            url: "/images/hero-dashboard.png",
            alt: "Dashboard Preview",
            title: "پیشخوان مدیریت",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHero = async (data: HeroData) => {
    try {
      console.log("Saving hero data:", data);
      console.log("Images being saved:", data.images);

      const response = await fetch("/api/admin/hero", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("Save response:", result);

      if (response.ok) {
        setHeroData(data);
        setShowEditModal(false);
        // Refresh hero data to ensure we have the latest from database
        await fetchHeroData();
      } else {
        console.error("Failed to save hero data:", result);
        alert("خطا در ذخیره اطلاعات: " + (result.error || "خطای نامشخص"));
      }
    } catch (error) {
      console.error("Error saving hero data:", error);
      alert("خطا در ذخیره اطلاعات");
    }
  };

  const nextImage = () => {
    if (heroData?.images && heroData.images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === heroData.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (heroData?.images && heroData.images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? heroData.images.length - 1 : prev - 1
      );
    }
  };

  if (loading || !heroData) {
    return (
      <section className="relative bg-gradient-to-b from-indigo-50 to-white overflow-hidden h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            در حال بارگذاری...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative bg-gradient-to-b from-indigo-50 to-white overflow-hidden"
      dir="rtl"
    >
      {/* Settings Icon for School Admins */}
      {isSchoolAdmin && (
        <button
          onClick={() => setShowEditModal(true)}
          className="absolute top-24 left-4 z-20 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 group"
          title="ویرایش بخش اصلی"
        >
          <CogIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
        </button>
      )}

      {/* Background decorations */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 right-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-40 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-7xl mx-auto pt-20 pb-16 px-4 sm:pt-24 sm:pb-24 sm:px-6 lg:pt-32 lg:pb-28 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <motion.div
            className="text-center lg:text-left lg:w-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              className="text-3xl md:text-3xl text-right  lg:text-4xl font-bold tracking-tight text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="block text-indigo-600">{heroData.title}</span>
              <span className="block text-2xl md:text-2xl text-right  lg:text-3xl mt-4">
                {heroData.subtitle}
              </span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg md:text-xl text-right text-gray-600 max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {heroData.description}
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {heroData.primaryButtonText && (
                <Link
                  href={heroData.primaryButtonLink}
                  className="w-full sm:w-auto"
                >
                  <button className="w-full px-8 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-1">
                    {heroData.primaryButtonText}
                  </button>
                </Link>
              )}
              {heroData.secondaryButtonText && (
                <Link
                  href={heroData.secondaryButtonLink}
                  className="w-full sm:w-auto"
                >
                  <button className="w-full px-8 py-3 text-base font-medium text-indigo-700 bg-white border border-indigo-600 rounded-md shadow-sm hover:bg-indigo-50 transition duration-300 ease-in-out transform hover:-translate-y-1">
                    {heroData.secondaryButtonText}
                  </button>
                </Link>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-10 lg:mt-0 lg:w-1/2 lg:pl-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <div className="relative w-full h-64 md:h-80 lg:h-96 group">
              {heroData.images && heroData.images.length > 0 && (
                <>
                  <img
                    src={
                      heroData.images[currentImageIndex]?.url ||
                      "/images/hero-dashboard.png"
                    }
                    alt={
                      heroData.images[currentImageIndex]?.alt || "Hero Image"
                    }
                    className="w-full h-full object-contain rounded-lg shadow-2xl transition-opacity duration-500"
                    onLoad={() => {
                      console.log(
                        "Image loaded successfully:",
                        heroData.images[currentImageIndex]?.url
                      );
                    }}
                    onError={(e) => {
                      console.error(
                        "Image failed to load:",
                        heroData.images[currentImageIndex]?.url
                      );
                      // Fallback to default image
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/hero-dashboard.png";
                    }}
                  />

                  {/* Navigation arrows */}
                  {heroData.images.length > 1 && (
                    <>
                      <button
                        onClick={nextImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
                      </button>
                      <button
                        onClick={prevImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <ChevronRightIcon className="h-5 w-5 text-gray-700" />
                      </button>
                    </>
                  )}

                  {/* Dots indicator */}
                  {heroData.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-reverse space-x-2">
                      {heroData.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                            index === currentImageIndex
                              ? "bg-indigo-600"
                              : "bg-white bg-opacity-60"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Image title overlay */}
                  {heroData.images[currentImageIndex]?.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent rounded-b-lg p-4">
                      <p className="text-white text-sm font-medium">
                        {heroData.images[currentImageIndex].title}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-5 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 1.2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </motion.div>
      </div>

      {/* Edit Modal */}
      {showEditModal && heroData && (
        <HeroEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveHero}
          initialData={heroData}
        />
      )}
    </section>
  );
}

// Simplified Modal Component (inline)
interface HeroEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HeroData) => void;
  initialData: HeroData;
}

function HeroEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: HeroEditModalProps) {
  const [formData, setFormData] = useState<HeroData>(initialData);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<number[]>([]);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
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
    console.log(`Updating image ${index}, field ${field}, value:`, value);
    setFormData((prevFormData) => {
      const updatedImages = prevFormData.images.map((img, i) =>
        i === index ? { ...img, [field]: value } : img
      );
      const newFormData = { ...prevFormData, images: updatedImages };
      console.log("Updated form data:", newFormData);
      return newFormData;
    });
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingImages((prev) => [...prev, index]);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload/hero-images", {
        method: "POST",
        body: uploadFormData,
      });

      const result = await response.json();

      if (result.success) {
        console.log("Upload successful, URL:", result.url);
        updateImage(index, "url", result.url);

        // Auto-fill alt text with filename if empty - use setTimeout to ensure state is updated
        setTimeout(() => {
          setFormData((currentFormData) => {
            if (!currentFormData.images[index]?.alt) {
              const updatedImages = currentFormData.images.map((img, i) =>
                i === index ? { ...img, alt: file.name.split(".")[0] } : img
              );
              return { ...currentFormData, images: updatedImages };
            }
            return currentFormData;
          });
        }, 100);
      } else {
        console.error("Upload failed:", result.error);
        alert("خطا در آپلود تصویر: " + result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("خطا در آپلود تصویر");
    } finally {
      setUploadingImages((prev) => prev.filter((i) => i !== index));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                ویرایش بخش اصلی
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Text Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان اصلی
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    زیرعنوان
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  توضیحات
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Button Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    دکمه اصلی
                  </h3>
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
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    دکمه فرعی
                  </h3>
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
                    />
                  </div>
                </div>
              </div>

              {/* Image Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    تصاویر اسلایدر
                  </h3>
                  <button
                    type="button"
                    onClick={addImage}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200"
                  >
                    + افزودن تصویر
                  </button>
                </div>

                {formData.images.map((image, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 mb-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-medium text-gray-700">
                        تصویر {index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️ حذف
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
                            handleImageUpload(index, file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {uploadingImages.includes(index) && (
                        <p className="text-sm text-indigo-600 mt-1">
                          در حال آپلود...
                        </p>
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
                          متن جایگزین
                        </label>
                        <input
                          type="text"
                          value={image.alt}
                          onChange={(e) =>
                            updateImage(index, "alt", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="توضیح تصویر"
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
                          placeholder="عنوان نمایشی"
                        />
                      </div>
                    </div>

                    {/* Image Preview */}
                    {image.url && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          پیش‌نمایش:
                        </p>
                        <div className="relative w-32 h-20 border rounded-md overflow-hidden">
                          <img
                            src={image.url}
                            alt={image.alt || "Preview"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error(
                                "Preview image failed to load:",
                                image.url
                              );
                              const target = e.target as HTMLImageElement;
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
                        <p className="text-xs text-gray-500 mt-1">
                          URL: {image.url}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {formData.images.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>هیچ تصویری اضافه نشده است</p>
                    <button
                      type="button"
                      onClick={addImage}
                      className="mt-2 text-indigo-600 hover:text-indigo-800"
                    >
                      اولین تصویر را اضافه کنید
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  disabled={loading || uploadingImages.length > 0}
                  className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  لغو
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
