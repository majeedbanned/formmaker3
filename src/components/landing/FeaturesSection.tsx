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
        className="py-24 relative overflow-hidden"
        style={{ backgroundColor: featuresData.backgroundColor }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1000ms" }}
          />
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2000ms" }}
          />
        </div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, ${featuresData.titleColor} 2px, transparent 0)`,
              backgroundSize: "50px 50px",
            }}
          />
        </div>
        {/* Admin Controls */}
        {isSchoolAdmin && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-4 left-4 z-20 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 group"
            title="ویرایش بخش تماس با ما"
          >
            <CogIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
          </button>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Decorative elements */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent rounded-full" />

            <motion.h2
              className="text-base font-semibold tracking-wide uppercase mb-4 relative"
              style={{ color: featuresData.titleColor }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {featuresData.title}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent" />
            </motion.h2>

            <motion.p
              className="text-3xl font-extrabold sm:text-4xl lg:text-5xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent"
              style={{ color: featuresData.subtitleColor }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {featuresData.subtitle}
            </motion.p>

            <motion.p
              className="mt-6 max-w-3xl text-xl leading-relaxed mx-auto"
              style={{ color: featuresData.descriptionColor }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {featuresData.description}
            </motion.p>

            {/* Bottom decorative line */}
            <div className="mt-8 mx-auto w-32 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </motion.div>

          <motion.div
            className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
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
                  className="group relative"
                  variants={item}
                  whileHover={{
                    y: -8,
                    transition: { duration: 0.3, ease: "easeOut" },
                  }}
                >
                  {/* Floating background with glassmorphism */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-white/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl group-hover:shadow-3xl transition-all duration-500" />

                  {/* Animated glow effect */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                    style={{
                      background: `linear-gradient(45deg, ${featuresData.iconBackgroundColor}20, ${featuresData.iconBackgroundColor}10, ${featuresData.iconBackgroundColor}20)`,
                    }}
                  />

                  {/* Main card content */}
                  <div className="relative z-10 p-8 h-full flex flex-col items-center text-center">
                    {/* Floating icon container */}
                    <motion.div
                      className="relative mb-6"
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, -10, 10, 0],
                        transition: { duration: 0.5 },
                      }}
                    >
                      {/* Icon glow background */}
                      <div
                        className="absolute inset-0 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${featuresData.iconBackgroundColor}, ${featuresData.iconBackgroundColor}80)`,
                        }}
                      />

                      {/* Icon container */}
                      <div
                        className="relative flex items-center justify-center h-16 w-16 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${featuresData.iconBackgroundColor}, ${featuresData.iconBackgroundColor}CC)`,
                          color: featuresData.iconColor,
                        }}
                      >
                        <IconComponent
                          className="h-8 w-8 filter drop-shadow-sm"
                          aria-hidden="true"
                        />
                      </div>

                      {/* Floating particles */}
                      <div className="absolute -top-2 -right-2 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse opacity-60" />
                      <div
                        className="absolute -bottom-2 -left-2 w-2 h-2 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full animate-pulse opacity-60"
                        style={{ animationDelay: "500ms" }}
                      />
                    </motion.div>

                    {/* Title with modern typography */}
                    <motion.h3
                      className="text-xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                      style={{ color: featuresData.featureTitleColor }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {feature.name}
                    </motion.h3>

                    {/* Description with better spacing */}
                    <p
                      className="text-base leading-relaxed text-right flex-grow"
                      style={{ color: featuresData.featureDescriptionColor }}
                    >
                      {feature.description}
                    </p>

                    {/* Bottom accent line */}
                    <div className="mt-6 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Hover border effect */}
                  <div
                    className="absolute inset-0 rounded-3xl border-2 border-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{
                      background: `linear-gradient(45deg, ${featuresData.iconBackgroundColor}40, transparent, ${featuresData.iconBackgroundColor}40) border-box`,
                      mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                      maskComposite: "subtract",
                    }}
                  />
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
