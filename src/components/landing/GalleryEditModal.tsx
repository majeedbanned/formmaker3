"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PhotoIcon,
  FolderIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";

interface GalleryImage {
  id: number;
  src: string;
  title: string;
  width: number;
  height: number;
}

interface Gallery {
  id: string;
  name: string;
  images: GalleryImage[];
}

interface GalleryData {
  title: string;
  subtitle: string;
  description: string;
  galleries: Gallery[];
  isVisible: boolean;
}

interface GalleryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GalleryData) => void;
  initialData: GalleryData;
}

export default function GalleryEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: GalleryEditModalProps) {
  const [formData, setFormData] = useState<GalleryData>(initialData);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{
    [galleryId: string]: boolean;
  }>({});
  const [isModalReady, setIsModalReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "galleries">(
    "content"
  );
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      if (initialData.galleries.length > 0) {
        setSelectedGalleryId(initialData.galleries[0].id);
      }
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
    setIsSaving(true);
    setLoading(true);
    try {
      // console.log("Saving gallery data from modal:", formData);
      await onSave(formData);
      const mockEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
      } as React.MouseEvent;
      handleCloseClick(mockEvent);
    } catch (error) {
      console.error("Error saving gallery data from modal:", error);
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  const addGallery = () => {
    const newId = `gallery_${Date.now()}`;
    const newGallery: Gallery = {
      id: newId,
      name: "گالری جدید",
      images: [],
    };
    setFormData({
      ...formData,
      galleries: [...formData.galleries, newGallery],
    });
    setSelectedGalleryId(newId);
  };

  const removeGallery = (galleryId: string) => {
    if (formData.galleries.length <= 1) {
      alert("حداقل یک گالری باید موجود باشد");
      return;
    }

    const updatedGalleries = formData.galleries.filter(
      (g) => g.id !== galleryId
    );
    setFormData({
      ...formData,
      galleries: updatedGalleries,
    });

    // Update selected gallery if needed
    if (selectedGalleryId === galleryId) {
      setSelectedGalleryId(updatedGalleries[0]?.id || "");
    }
  };

  const updateGalleryName = (galleryId: string, newName: string) => {
    const updatedGalleries = formData.galleries.map((gallery) =>
      gallery.id === galleryId ? { ...gallery, name: newName } : gallery
    );
    setFormData({
      ...formData,
      galleries: updatedGalleries,
    });
  };

  const addImageToGallery = (galleryId: string) => {
    const newImage: GalleryImage = {
      id: Date.now(),
      src: "",
      title: "تصویر جدید",
      width: 600,
      height: 400,
    };

    const updatedGalleries = formData.galleries.map((gallery) =>
      gallery.id === galleryId
        ? { ...gallery, images: [...gallery.images, newImage] }
        : gallery
    );

    setFormData({
      ...formData,
      galleries: updatedGalleries,
    });
  };

  const removeImageFromGallery = (galleryId: string, imageId: number) => {
    const updatedGalleries = formData.galleries.map((gallery) =>
      gallery.id === galleryId
        ? {
            ...gallery,
            images: gallery.images.filter((img) => img.id !== imageId),
          }
        : gallery
    );

    setFormData({
      ...formData,
      galleries: updatedGalleries,
    });
  };

  const updateImageInGallery = (
    galleryId: string,
    imageId: number,
    field: keyof GalleryImage,
    value: string | number
  ) => {
    const updatedGalleries = formData.galleries.map((gallery) =>
      gallery.id === galleryId
        ? {
            ...gallery,
            images: gallery.images.map((img) =>
              img.id === imageId ? { ...img, [field]: value } : img
            ),
          }
        : gallery
    );

    setFormData({
      ...formData,
      galleries: updatedGalleries,
    });
  };

  const handleBulkImageUpload = async (galleryId: string, files: FileList) => {
    setUploadingImages((prev) => ({ ...prev, [galleryId]: true }));

    try {
      // console.log(`Starting bulk upload of ${files.length} images for gallery ${galleryId}`);
      
      const uploadPromises = Array.from(files).map(async (file) => {
        // console.log(`Uploading file: ${file.name}`);
        const formDataToSend = new FormData();
        formDataToSend.append("file", file);

        const response = await fetch("/api/upload/gallery-images", {
          method: "POST",
          body: formDataToSend,
        });

        const data = await response.json();
        // console.log(`Upload response for ${file.name}:`, data);

        if (!response.ok || !data.success) {
          throw new Error(data.error || `Upload failed for ${file.name}`);
        }

        return {
          id: Date.now() + Math.random(),
          src: data.url,
          title: file.name.split(".")[0],
          width: 600,
          height: 400,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      // Add all uploaded images to the gallery
      const updatedGalleries = formData.galleries.map((gallery) =>
        gallery.id === galleryId
          ? { ...gallery, images: [...gallery.images, ...uploadedImages] }
          : gallery
      );

      setFormData({
        ...formData,
        galleries: updatedGalleries,
      });

      // console.log(`Successfully uploaded ${uploadedImages.length} images to gallery ${galleryId}`);
    } catch (error) {
      console.error("Gallery bulk upload error:", error);
      alert(
        `خطا در آپلود تصاویر: ${
          error instanceof Error ? error.message : "خطای ناشناخته"
        }`
      );
    } finally {
      setUploadingImages((prev) => ({ ...prev, [galleryId]: false }));
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

  const selectedGallery = formData.galleries.find(
    (g) => g.id === selectedGalleryId
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="fixed inset-0" onClick={handleBackdropClick} />
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] overflow-hidden relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col h-full"
          onClick={handleModalClick}
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              ویرایش گالری تصاویر
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
                  محتوا و تنظیمات
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("galleries")}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "galleries"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <FolderIcon className="h-5 w-5" />
                  مدیریت گالری‌ها
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
                          نمایش بخش گالری
                        </h3>
                        <p className="text-sm text-gray-600">
                          تعیین کنید که بخش گالری در صفحه اصلی نمایش داده شود یا
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          عنوان بخش *
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
                          placeholder="گالری تصاویر"
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
                          placeholder="لحظه‌های ماندگار"
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
                          placeholder="توضیح کامل از گالری..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Galleries Tab */}
              {activeTab === "galleries" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                  {/* Gallery List Sidebar */}
                  <div className="lg:col-span-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        گالری‌ها
                      </h3>
                      <button
                        type="button"
                        onClick={addGallery}
                        className="p-1 text-indigo-600 hover:bg-indigo-100 rounded"
                        title="افزودن گالری جدید"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formData.galleries.map((gallery) => (
                        <div
                          key={gallery.id}
                          className={`p-3 rounded-md cursor-pointer transition-colors ${
                            selectedGalleryId === gallery.id
                              ? "bg-indigo-100 border border-indigo-300"
                              : "bg-white border border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedGalleryId(gallery.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {gallery.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">
                                {gallery.images.length} تصویر
                              </span>
                              {formData.galleries.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeGallery(gallery.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="حذف گالری"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gallery Content Editor */}
                  <div className="lg:col-span-3">
                    {selectedGallery ? (
                      <div className="space-y-6">
                        {/* Gallery Name */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">
                            تنظیمات گالری
                          </h4>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              نام گالری
                            </label>
                            <input
                              type="text"
                              value={selectedGallery.name}
                              onChange={(e) =>
                                updateGalleryName(
                                  selectedGallery.id,
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="نام گالری..."
                            />
                          </div>
                        </div>

                        {/* Bulk Upload */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <CloudArrowUpIcon className="h-5 w-5" />
                            آپلود دسته‌ای تصاویر
                          </h4>
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                  if (
                                    e.target.files &&
                                    e.target.files.length > 0
                                  ) {
                                    handleBulkImageUpload(
                                      selectedGallery.id,
                                      e.target.files
                                    ).then(() => {
                                      // Clear the file input after upload
                                      if (e.target) {
                                        e.target.value = "";
                                      }
                                    });
                                  }
                                }}
                                className="hidden"
                                id={`bulk-upload-${selectedGallery.id}`}
                                disabled={uploadingImages[selectedGallery.id]}
                              />
                              <label
                                htmlFor={`bulk-upload-${selectedGallery.id}`}
                                className="cursor-pointer block"
                              >
                                <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-lg font-medium text-gray-700 mb-2">
                                  چندین تصویر را انتخاب کنید
                                </p>
                                <p className="text-sm text-gray-500">
                                  فرمت‌های مجاز: JPG, PNG, GIF, WebP
                                </p>
                              </label>
                            </div>

                            {uploadingImages[selectedGallery.id] && (
                              <div className="bg-indigo-50 p-4 rounded-md">
                                <p className="text-sm text-indigo-600 flex items-center gap-2">
                                  <span className="inline-block w-4 h-4 border-2 border-indigo-600 border-r-transparent rounded-full animate-spin"></span>
                                  در حال آپلود تصاویر...
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Images Management */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                              <PhotoIcon className="h-5 w-5" />
                              تصاویر گالری ({selectedGallery.images.length})
                            </h4>
                            <button
                              type="button"
                              onClick={() =>
                                addImageToGallery(selectedGallery.id)
                              }
                              className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                            >
                              <PlusIcon className="h-4 w-4" />
                              افزودن تصویر
                            </button>
                          </div>

                          {selectedGallery.images.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                              <p className="text-lg font-medium mb-2">
                                هیچ تصویری در این گالری نیست
                              </p>
                              <p className="text-sm mb-4">
                                با کلیک بر روی &ldquo;آپلود دسته‌ای&rdquo; چندین
                                تصویر اضافه کنید
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {selectedGallery.images.map((image) => (
                                <div
                                  key={image.id}
                                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                                >
                                  {/* Image Preview */}
                                  {image.src && (
                                    <div className="aspect-video relative bg-gray-100 rounded-md overflow-hidden">
                                      <img
                                        src={image.src}
                                        alt={image.title}
                                        className="w-full h-full object-cover"
                                        onLoad={() => {
                                          // console.log(
                                          //   "Gallery preview image loaded successfully:",
                                          //   image.src
                                          // );
                                        }}
                                        onError={(e) => {
                                          // console.error(
                                          //   "Gallery preview image failed to load:",
                                          //   image.src
                                          // );
                                          // Fallback to placeholder image instead of hiding
                                          const target = e.target as HTMLImageElement;
                                          target.src = "/images/placeholder.jpg";
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* Image Fields */}
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={image.title}
                                      onChange={(e) =>
                                        updateImageInGallery(
                                          selectedGallery.id,
                                          image.id,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      placeholder="عنوان تصویر"
                                    />
                                    <input
                                      type="text"
                                      value={image.src}
                                      onChange={(e) =>
                                        updateImageInGallery(
                                          selectedGallery.id,
                                          image.id,
                                          "src",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      placeholder="URL تصویر"
                                    />
                                    <div className="flex gap-2">
                                      <input
                                        type="number"
                                        value={image.width}
                                        onChange={(e) =>
                                          updateImageInGallery(
                                            selectedGallery.id,
                                            image.id,
                                            "width",
                                            parseInt(e.target.value) || 600
                                          )
                                        }
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="عرض"
                                      />
                                      <input
                                        type="number"
                                        value={image.height}
                                        onChange={(e) =>
                                          updateImageInGallery(
                                            selectedGallery.id,
                                            image.id,
                                            "height",
                                            parseInt(e.target.value) || 400
                                          )
                                        }
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="ارتفاع"
                                      />
                                    </div>
                                  </div>

                                  {/* Remove Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeImageFromGallery(
                                        selectedGallery.id,
                                        image.id
                                      )
                                    }
                                    className="w-full text-red-600 hover:text-red-800 text-sm py-1 transition-colors"
                                  >
                                    <TrashIcon className="h-4 w-4 inline mr-1" />
                                    حذف تصویر
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FolderIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium">
                          گالری‌ای انتخاب نشده است
                        </p>
                        <p className="text-sm">
                          از سمت راست یک گالری انتخاب کنید
                        </p>
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
                  disabled={
                    isSaving || loading || Object.values(uploadingImages).some(Boolean)
                  }
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
                  onClick={handleCloseClick}
                  disabled={isSaving || Object.values(uploadingImages).some(Boolean)}
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
