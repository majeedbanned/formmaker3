"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import { toast } from "sonner";
import {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ChartPieIcon,
  UserGroupIcon,
  CalendarIcon,
  AcademicCapIcon,
  CogIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DocumentIcon,
  HomeIcon,
  ShieldCheckIcon,
  StarIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  PencilIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import FeaturesEditModal from "./FeaturesEditModal";

interface Feature {
  name: string;
  description: string;
  iconName: string;
}

interface FeaturesData {
  title: string;
  subtitle: string;
  description: string;
  features: Feature[];
  isVisible: boolean;
  backgroundColor: string;
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  featureTitleColor: string;
  featureDescriptionColor: string;
}

// Icon mapping for dynamic icon rendering
const iconMap = {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ChartPieIcon,
  UserGroupIcon,
  CalendarIcon,
  AcademicCapIcon,
  CogIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DocumentIcon,
  HomeIcon,
  ShieldCheckIcon,
  StarIcon,
  LightBulbIcon,
  RocketLaunchIcon,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturesSection() {
  const { user, isAuthenticated } = usePublicAuth();
  const [featuresData, setFeaturesData] = useState<FeaturesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is school admin
  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  // Load features data from database
  useEffect(() => {
    const loadFeaturesData = async () => {
      try {
        const response = await fetch("/api/admin/features", {
          headers: {
            "x-domain": window.location.hostname + ":" + window.location.port,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch features data");
        }

        const data = await response.json();
        if (data.success) {
          setFeaturesData(data.features);
        }
      } catch (error) {
        console.error("Error loading features data:", error);
        // Set default data on error
        setFeaturesData({
          title: "ویژگی‌ها",
          subtitle: "تمام آنچه برای مدیریت آموزشی نیاز دارید",
          description:
            "پارسا موز با مجموعه‌ای از ابزارهای کارآمد، فرآیند آموزش و یادگیری را برای همه ذینفعان تسهیل می‌کند.",
          features: [
            {
              name: "مدیریت کلاس‌ها",
              description:
                "کلاس‌ها، دروس و دانش‌آموزان را به آسانی مدیریت کنید. از تقویم درسی تا ارائه تکالیف، همه در یک پلتفرم.",
              iconName: "BookOpenIcon",
            },
            {
              name: "ارزیابی و آزمون‌ها",
              description:
                "آزمون‌های آنلاین ایجاد کنید، نمرات را ثبت کنید و نتایج را به صورت نمودارهای تحلیلی مشاهده کنید.",
              iconName: "ClipboardDocumentCheckIcon",
            },
            {
              name: "ارتباط با والدین",
              description:
                "ارتباط موثر با والدین از طریق پیام‌رسان داخلی، گزارش‌دهی خودکار و اطلاع‌رسانی وضعیت تحصیلی.",
              iconName: "ChatBubbleLeftRightIcon",
            },
          ],
          isVisible: true,
          backgroundColor: "#F9FAFB",
          titleColor: "#4F46E5",
          subtitleColor: "#111827",
          descriptionColor: "#6B7280",
          cardBackgroundColor: "#FFFFFF",
          cardBorderColor: "#E5E7EB",
          iconBackgroundColor: "#4F46E5",
          iconColor: "#FFFFFF",
          featureTitleColor: "#111827",
          featureDescriptionColor: "#6B7280",
        });
      } finally {
        setLoading(false);
      }
    };

    loadFeaturesData();
  }, []);

  const handleSave = async (data: FeaturesData) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.hostname + ":" + window.location.port,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save features data");
      }

      const result = await response.json();
      if (result.success) {
        setFeaturesData(data);
        toast.success("تغییرات بخش ویژگی‌ها با موفقیت ذخیره شد");
      } else {
        throw new Error(result.error || "Failed to save features data");
      }
    } catch (error) {
      console.error("Error saving features data:", error);
      toast.error("خطا در ذخیره تغییرات");
    } finally {
      setIsSaving(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || BookOpenIcon;
  };

  if (loading) {
    return (
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="text-center">
              <div className="h-4 bg-gray-300 rounded w-24 mx-auto mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-96 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-80 mx-auto"></div>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="h-12 w-12 bg-gray-300 rounded-md mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuresData) {
    return null;
  }

  // If not visible and user is not admin, don't render anything
  if (!featuresData.isVisible && !isSchoolAdmin) {
    return null;
  }

  // If not visible but user is admin, show placeholder
  if (!featuresData.isVisible && isSchoolAdmin) {
    return (
      <>
        <section className="py-24 bg-yellow-50 border-2 border-dashed border-yellow-300 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center items-center mb-4">
                <div className="bg-yellow-100 rounded-full p-3">
                  <EyeSlashIcon className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-yellow-800 mb-2">
                بخش ویژگی‌ها غیرفعال است
              </h2>
              <p className="text-yellow-700 mb-6">
                این بخش در حال حاضر برای بازدیدکنندگان نمایش داده نمی‌شود
              </p>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                <PencilIcon className="h-5 w-5" />
                تنظیمات بخش ویژگی‌ها
              </button>
            </div>
          </div>
        </section>

        {isEditModalOpen && (
          <FeaturesEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSave}
            initialData={featuresData}
          />
        )}
      </>
    );
  }

  return (
    <>
      <section
        id="features"
        className="py-24 relative"
        style={{ backgroundColor: featuresData.backgroundColor }}
      >
        {/* Admin Controls */}
        {isSchoolAdmin && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setIsEditModalOpen(true)}
              disabled={isSaving}
              className="flex items-center gap-2 bg-black/70 text-white px-3 py-2 rounded-lg hover:bg-black/80 transition-colors text-sm font-medium backdrop-blur-sm"
            >
              <PencilIcon className="h-4 w-4" />
              ویرایش
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="text-base font-semibold tracking-wide uppercase"
              style={{ color: featuresData.titleColor }}
            >
              {featuresData.title}
            </h2>
            <p
              className="mt-2 text-3xl font-extrabold sm:text-4xl"
              style={{ color: featuresData.subtitleColor }}
            >
              {featuresData.subtitle}
            </p>
            <p
              className="mt-4 max-w-2xl text-xl mx-auto"
              style={{ color: featuresData.descriptionColor }}
            >
              {featuresData.description}
            </p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {featuresData.features.map((feature, index) => {
              const IconComponent = getIconComponent(feature.iconName);
              return (
                <motion.div
                  key={index}
                  className="relative p-6 rounded-lg border shadow-sm hover:shadow-lg transition-shadow duration-300"
                  style={{
                    backgroundColor: featuresData.cardBackgroundColor,
                    borderColor: featuresData.cardBorderColor,
                  }}
                  variants={item}
                >
                  <div>
                    <div
                      className="flex items-center justify-center h-12 w-12 rounded-md"
                      style={{
                        backgroundColor: featuresData.iconBackgroundColor,
                        color: featuresData.iconColor,
                      }}
                    >
                      <IconComponent className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3
                      className="mt-4 text-lg font-medium"
                      style={{ color: featuresData.featureTitleColor }}
                    >
                      {feature.name}
                    </h3>
                    <p
                      className="mt-2 text-base"
                      style={{ color: featuresData.featureDescriptionColor }}
                    >
                      {feature.description}
                    </p>
                  </div>
                  <div
                    className="absolute inset-0 rounded-lg pointer-events-none border-2 border-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(90deg, ${featuresData.iconBackgroundColor}20 0%, rgba(0,0,0,0) 50%, ${featuresData.iconBackgroundColor}20 100%) border-box`,
                    }}
                  ></div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <FeaturesEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSave}
          initialData={featuresData}
        />
      )}
    </>
  );
}
