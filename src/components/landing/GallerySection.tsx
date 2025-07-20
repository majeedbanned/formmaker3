"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import { CogIcon } from "@heroicons/react/24/outline";
import GalleryEditModal from "./GalleryEditModal";

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

export default function GallerySection() {
  const { user, isAuthenticated } = usePublicAuth();
  const [galleryData, setGalleryData] = useState<GalleryData | null>(null);
  const [selectedGallery, setSelectedGallery] = useState("");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: number]: boolean}>({});

  // Check if user is school admin
  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  useEffect(() => {
    fetchGalleryData();
  }, []);

  useEffect(() => {
    if (
      galleryData?.galleries &&
      galleryData.galleries.length > 0 &&
      !selectedGallery
    ) {
      setSelectedGallery(galleryData.galleries[0].id);
    }
  }, [galleryData, selectedGallery]);

  const fetchGalleryData = async () => {
    try {
      // Add cache busting to ensure fresh data after uploads
      const response = await fetch("/api/admin/gallery", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      const data = await response.json();
      if (data.success) {
        setGalleryData(data.gallery);
      }
    } catch (error) {
      console.error("Error fetching gallery data:", error);
      // Set default data if fetch fails
      setGalleryData({
        title: "گالری تصاویر",
        subtitle: "لحظه‌های ماندگار",
        description:
          "مجموعه‌ای از تصاویر محیط‌های آموزشی، مدارس و رویدادهای مرتبط با پارسا موز.",
        isVisible: true,
        galleries: [
          {
            id: "school",
            name: "محیط مدارس",
            images: [
              {
                id: 1,
                src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                title: "کلاس درس مدرن",
                width: 600,
                height: 400,
              },
              {
                id: 2,
                src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                title: "کتابخانه دیجیتال",
                width: 400,
                height: 600,
              },
            ],
          },
          {
            id: "events",
            name: "رویدادها",
            images: [
              {
                id: 3,
                src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                title: "همایش سالانه",
                width: 600,
                height: 400,
              },
            ],
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGallery = async (data: GalleryData) => {
    try {
      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setGalleryData(data);
        setShowEditModal(false);
        await fetchGalleryData();
      } else {
        console.error("Failed to save gallery data:", result);
        alert("خطا در ذخیره اطلاعات: " + (result.error || "خطای نامشخص"));
      }
    } catch (error) {
      console.error("Error saving gallery data:", error);
      alert("خطا در ذخیره اطلاعات");
    }
  };

  if (loading || !galleryData) {
    return (
      <section
        className="py-24 bg-white flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            در حال بارگذاری گالری...
          </p>
        </div>
      </section>
    );
  }

  // Show admin placeholder if gallery section is invisible
  if (!galleryData.isVisible) {
    // Show nothing for regular users
    if (!isSchoolAdmin) {
      return null;
    }

    // Show admin placeholder with settings access
    return (
      <section
        className="relative bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300 py-12"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <span className="text-4xl">🖼️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              بخش گالری غیرفعال است
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              این بخش برای بازدیدکنندگان نمایش داده نمی‌شود. برای فعال کردن آن
              روی دکمه تنظیمات کلیک کنید.
            </p>
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <CogIcon className="h-5 w-5" />
              تنظیمات گالری
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <GalleryEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveGallery}
            initialData={galleryData}
          />
        )}
      </section>
    );
  }

  const currentGallery =
    galleryData.galleries.find((g) => g.id === selectedGallery) ||
    galleryData.galleries[0];

  return (
    <section id="gallery" className="py-24 bg-white relative" dir="rtl">
      {/* Settings Icon for School Admins */}
      {isSchoolAdmin && (
        <button
          onClick={() => setShowEditModal(true)}
          className="absolute top-8 left-4 z-20 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 group"
          title="ویرایش گالری"
        >
          <CogIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">
            {galleryData.title}
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {galleryData.subtitle}
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            {galleryData.description}
          </p>
        </motion.div>

        {/* Gallery filter */}
        {galleryData.galleries.length > 0 && (
          <div className="mt-8 flex justify-center space-x-2 rtl:space-x-reverse">
            {galleryData.galleries.map((gallery) => (
              <button
                key={gallery.id}
                onClick={() => setSelectedGallery(gallery.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedGallery === gallery.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {gallery.name}
              </button>
            ))}
          </div>
        )}

        {/* Gallery content */}
        {currentGallery && currentGallery.images.length > 0 ? (
          <motion.div
            className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            key={selectedGallery}
          >
            {currentGallery.images.map((image, index) => (
              <motion.div
                key={image.id}
                className={`overflow-hidden rounded-lg shadow-md cursor-pointer transform transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
                  image.height > image.width ? "row-span-2" : ""
                }`}
                onClick={() => setSelectedImage(image)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div
                  className="relative"
                  style={{
                    paddingBottom: `${(image.height / image.width) * 100}%`,
                  }}
                >
                  <Image
                    src={image.src}
                    alt={image.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index < 3}
                    onLoadingComplete={() => {
                      setImageLoadingStates(prev => ({...prev, [image.id]: false}));
                    }}
                    onLoadStart={() => {
                      setImageLoadingStates(prev => ({...prev, [image.id]: true}));
                    }}
                    onError={(e) => {
                      console.error("Failed to load image:", image.src);
                      setImageLoadingStates(prev => ({...prev, [image.id]: false}));
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  {imageLoadingStates[image.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-medium text-lg">
                        {image.title}
                      </h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="mt-10 text-center py-12 text-gray-500">
            <span className="text-6xl mb-4 block">🖼️</span>
            <p className="text-lg font-medium mb-2">
              گالری انتخاب شده خالی است
            </p>
            <p className="text-sm">تصویری برای نمایش موجود نیست</p>
          </div>
        )}

        {/* Lightbox */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-4xl max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute -top-12 right-0 text-white text-xl p-2 hover:text-gray-300 transition-colors"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
              <div
                className="relative w-full"
                style={{
                  height: "80vh",
                  maxWidth: "90vw",
                }}
              >
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  priority
                  onError={(e) => {
                    console.error("Failed to load image in lightbox:", selectedImage.src);
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
                  <h3 className="text-white font-medium text-lg text-right">
                    {selectedImage.title}
                  </h3>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && galleryData && (
        <GalleryEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveGallery}
          initialData={galleryData}
        />
      )}
    </section>
  );
}
