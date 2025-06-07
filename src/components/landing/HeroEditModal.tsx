"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

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

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (isOpen) {
      // Add a small delay to prevent immediate closing
      const timer = setTimeout(() => {
        setIsModalReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsModalReady(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && isModalReady) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isModalReady, onClose]);

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

        // Auto-fill alt text with filename if empty
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop, not on child elements, and modal is ready
    if (e.target === e.currentTarget && isModalReady) {
      onClose();
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    // Prevent event propagation to avoid closing modal when clicking inside
    e.stopPropagation();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      dir="rtl"
      onClick={handleBackdropClick}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto relative z-10"
          onClick={handleModalClick}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                ویرایش بخش اصلی
              </h2>
              <button
                onClick={handleCloseClick}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <XMarkIcon className="h-6 w-6" />
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
                    <PlusIcon className="h-4 w-4" />
                    افزودن تصویر
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
                  onClick={handleCloseClick}
                  className="flex-1 bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
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
