"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import { toast } from "sonner";
import {
  CheckCircleIcon,
  PencilIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";
import AboutEditModal from "./AboutEditModal";
import { CogIcon } from "lucide-react";

interface Stat {
  id: number;
  name: string;
  value: string;
}

interface AboutImage {
  url: string;
  alt: string;
}

interface AboutData {
  title: string;
  description: string;
  benefitsTitle: string;
  benefits: string[];
  stats: Stat[];
  image: AboutImage;
  isVisible: boolean;
  backgroundColor: string;
  titleColor: string;
  descriptionColor: string;
  benefitsTitleColor: string;
  benefitsTextColor: string;
  benefitsIconColor: string;
  statsBackgroundColor: string;
  statsNameColor: string;
  statsValueColor: string;
}

export default function AboutSection() {
  const { user, isAuthenticated } = usePublicAuth();
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Check if user is school admin
  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  // Load about data from database
  const loadAboutData = async () => {
    try {
      // Add cache busting to ensure fresh data after uploads
      const response = await fetch("/api/admin/about", {
        cache: "no-store",
        headers: {
          "x-domain": window.location.hostname + ":" + window.location.port,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch about data");
      }

      const data = await response.json();
      if (data.success) {
        setAboutData(data.about);
      }
    } catch (error) {
      console.error("Error loading about data:", error);
      // Set default data on error
      setAboutData({
        title: "درباره پارسا موز",
        description:
          "پارسا موز با هدف ارتقای کیفیت آموزش و تسهیل فرآیندهای مدیریتی مدارس ایجاد شده است. تیم ما متشکل از متخصصان آموزشی و مهندسان نرم‌افزار، راهکاری جامع برای نیازهای آموزشی امروز طراحی کرده‌اند.",
        benefitsTitle: "مزایای استفاده",
        benefits: [
          "بهبود ارتباط بین معلمان، دانش‌آموزان و والدین",
          "صرفه‌جویی در زمان با اتوماسیون فرآیندهای اداری",
          "تحلیل و گزارش‌گیری جامع از عملکرد آموزشی",
          "دسترسی آسان به اطلاعات از هر دستگاه و هر مکان",
          "پشتیبانی فنی ۲۴/۷ و بروزرسانی‌های منظم",
        ],
        stats: [
          { id: 1, name: "سال تجربه", value: "+10" },
          { id: 2, name: "مدارس", value: "+250" },
          { id: 3, name: "دانش‌آموزان", value: "+45K" },
          { id: 4, name: "رضایت مشتریان", value: "98%" },
        ],
        image: {
          url: "/images/about-team.jpg",
          alt: "Our team at work",
        },
        isVisible: true,
        backgroundColor: "#FFFFFF",
        titleColor: "#111827",
        descriptionColor: "#6B7280",
        benefitsTitleColor: "#111827",
        benefitsTextColor: "#6B7280",
        benefitsIconColor: "#10B981",
        statsBackgroundColor: "#FFFFFF",
        statsNameColor: "#6B7280",
        statsValueColor: "#4F46E5",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAboutData();
  }, []);

  const handleSave = async (data: AboutData) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/about", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.hostname + ":" + window.location.port,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save about data");
      }

      const result = await response.json();
      if (result.success) {
        setAboutData(data);
        toast.success("تغییرات بخش درباره ما با موفقیت ذخیره شد");
        // Refresh data to ensure fresh content
        await loadAboutData();
      } else {
        throw new Error(result.error || "Failed to save about data");
      }
    } catch (error) {
      console.error("Error saving about data:", error);
      toast.error("خطا در ذخیره تغییرات");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <div className="h-8 bg-gray-300 rounded w-48 mb-4"></div>
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-8"></div>
                <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex">
                      <div className="h-6 w-6 bg-gray-300 rounded-full ml-2"></div>
                      <div className="h-6 bg-gray-300 rounded flex-1"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-10 lg:mt-0">
                <div className="h-80 lg:h-96 bg-gray-300 rounded-lg mb-10"></div>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-100 p-6 rounded-lg">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-8 bg-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!aboutData) {
    return null;
  }

  // If not visible and user is not admin, don't render anything
  if (!aboutData.isVisible && !isSchoolAdmin) {
    return null;
  }

  // If not visible but user is admin, show placeholder
  if (!aboutData.isVisible && isSchoolAdmin) {
    return (
      <>
        <section
          className="py-24 bg-yellow-50 border-2 border-dashed border-yellow-300 relative"
          dir="rtl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center items-center mb-4">
                <div className="bg-yellow-100 rounded-full p-3">
                  <EyeSlashIcon className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-yellow-800 mb-2">
                بخش درباره ما غیرفعال است
              </h2>
              <p className="text-yellow-700 mb-6">
                این بخش در حال حاضر برای بازدیدکنندگان نمایش داده نمی‌شود
              </p>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                <PencilIcon className="h-5 w-5" />
                تنظیمات بخش درباره ما
              </button>
            </div>
          </div>
        </section>

        {isEditModalOpen && (
          <AboutEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSave}
            initialData={aboutData}
          />
        )}
      </>
    );
  }

  return (
    <>
      <section
        id="about"
        className="py-24 relative"
        style={{ backgroundColor: aboutData.backgroundColor }}
        dir="rtl"
      >
        {/* Admin Controls */}
        {isSchoolAdmin && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-4 left-4 z-20 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 group"
            title="ویرایش بخش تماس با ما"
          >
            <CogIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
          </button>

          // <div className="absolute top-4 right-4 z-10">
          //   <button
          //     onClick={() => setIsEditModalOpen(true)}
          //     disabled={isSaving}
          //     className="flex items-center gap-2 bg-black/70 text-white px-3 py-2 rounded-lg hover:bg-black/80 transition-colors text-sm font-medium backdrop-blur-sm"
          //   >
          //     <PencilIcon className="h-4 w-4" />
          //     ویرایش
          //   </button>
          // </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl font-extrabold sm:text-4xl"
                style={{ color: aboutData.titleColor }}
              >
                {aboutData.title}
              </h2>
              <p
                className="mt-4 text-lg"
                style={{ color: aboutData.descriptionColor }}
              >
                {aboutData.description}
              </p>

              <div className="mt-8">
                <h3
                  className="text-xl font-semibold"
                  style={{ color: aboutData.benefitsTitleColor }}
                >
                  {aboutData.benefitsTitle}
                </h3>
                <ul className="mt-4 space-y-3">
                  {aboutData.benefits.map((benefit, index) => (
                    <motion.li
                      key={index}
                      className="flex"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <CheckCircleIcon
                        className="h-6 w-6 mr-2"
                        style={{ color: aboutData.benefitsIconColor }}
                      />
                      <span style={{ color: aboutData.benefitsTextColor }}>
                        {benefit}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div
              className="mt-10 lg:mt-0 relative"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative h-80 lg:h-96 overflow-hidden rounded-lg shadow-xl">
                <Image
                  src={aboutData.image.url}
                  alt={aboutData.image.alt}
                  fill
                  className="object-cover"
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  priority
                  onLoadingComplete={() => {
                    setImageLoading(false);
                  }}
                  onLoadStart={() => {
                    setImageLoading(true);
                  }}
                  onError={(e) => {
                    console.error("Failed to load about section image:", aboutData.image.url);
                    setImageLoading(false);
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/placeholder.jpg";
                  }}
                />
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                  </div>
                )}

                {/* Decorative elements */}
                <div
                  className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-20"
                  style={{ backgroundColor: aboutData.statsValueColor }}
                ></div>
                <div
                  className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
                  style={{ backgroundColor: aboutData.statsValueColor }}
                ></div>
              </div>

              {/* Stats */}
              <motion.dl
                className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {aboutData.stats.map((stat) => (
                  <div
                    key={stat.id}
                    className="px-4 py-5 shadow rounded-lg overflow-hidden sm:p-6 text-center"
                    style={{ backgroundColor: aboutData.statsBackgroundColor }}
                  >
                    <dt
                      className="text-sm font-medium truncate"
                      style={{ color: aboutData.statsNameColor }}
                    >
                      {stat.name}
                    </dt>
                    <dd
                      className="mt-1 text-3xl font-semibold"
                      style={{ color: aboutData.statsValueColor }}
                    >
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </motion.dl>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <AboutEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSave}
          initialData={aboutData}
        />
      )}
    </>
  );
}
