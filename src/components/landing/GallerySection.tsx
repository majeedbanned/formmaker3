"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

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

const galleries: Gallery[] = [
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
      {
        id: 3,
        src: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        title: "آزمایشگاه علوم",
        width: 600,
        height: 400,
      },
      {
        id: 4,
        src: "https://images.unsplash.com/photo-1568792923760-d70635a89fdd?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        title: "سالن کنفرانس",
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
        id: 5,
        src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        title: "همایش سالانه",
        width: 600,
        height: 400,
      },
      {
        id: 6,
        src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        title: "جلسه کارگروه مدیران",
        width: 600,
        height: 400,
      },
      {
        id: 7,
        src: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        title: "جشن فارغ‌التحصیلی",
        width: 400,
        height: 600,
      },
    ],
  },
  {
    id: "students",
    name: "دانش‌آموزان",
    images: [
      {
        id: 8,
        src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        title: "کلاس آنلاین",
        width: 400,
        height: 600,
      },
      {
        id: 9,
        src: "https://images.unsplash.com/photo-1522661067900-ab829854a57f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        title: "پروژه‌های گروهی",
        width: 600,
        height: 400,
      },
      {
        id: 10,
        src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        title: "کار با تبلت آموزشی",
        width: 400,
        height: 600,
      },
    ],
  },
];

export default function GallerySection() {
  const [selectedGallery, setSelectedGallery] = useState("school");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const currentGallery =
    galleries.find((g) => g.id === selectedGallery) || galleries[0];

  return (
    <section id="gallery" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">
            گالری تصاویر
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            لحظه‌های ماندگار
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            مجموعه‌ای از تصاویر محیط‌های آموزشی، مدارس و رویدادهای مرتبط با
            پارسا موز.
          </p>
        </motion.div>

        {/* Gallery filter */}
        <div className="mt-8 flex justify-center space-x-2 rtl:space-x-reverse">
          {galleries.map((gallery) => (
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

        {/* Masonry gallery */}
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
                />
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
                className="absolute -top-12 right-0 text-white text-xl p-2"
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
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
                  <h3 className="text-white font-medium text-lg">
                    {selectedImage.title}
                  </h3>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
