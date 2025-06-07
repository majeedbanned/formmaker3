"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import { CogIcon } from "@heroicons/react/24/outline";
import {
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  CloudIcon,
  ShieldCheckIcon,
  BoltIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import AppDownloadEditModal from "./AppDownloadEditModal";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface DownloadButton {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  iconUrl: string;
  bgColor: string;
  textColor: string;
}

interface AppDownloadData {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionDescription: string;
  features: Feature[];
  downloadButtons: DownloadButton[];
  appScreenshots: string[];
  isVisible: boolean;
  sectionTitleColor: string;
  sectionSubtitleColor: string;
  sectionDescriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  featureTitleColor: string;
  featureDescriptionColor: string;
  featureIconBgColor: string;
  featureIconColor: string;
}

const iconMap = {
  DevicePhoneMobileIcon: DevicePhoneMobileIcon,
  DeviceTabletIcon: DeviceTabletIcon,
  CloudIcon: CloudIcon,
  ShieldCheckIcon: ShieldCheckIcon,
  BoltIcon: BoltIcon,
  UserGroupIcon: UserGroupIcon,
};

export default function AppDownloadSection() {
  const { user, isAuthenticated } = usePublicAuth();
  const [appDownloadData, setAppDownloadData] =
    useState<AppDownloadData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  useEffect(() => {
    fetchAppDownloadData();
  }, []);

  const fetchAppDownloadData = async () => {
    try {
      const response = await fetch("/api/admin/app-download");
      const data = await response.json();
      if (data.success) {
        setAppDownloadData(data.appDownload);
      }
    } catch (error) {
      console.error("Error fetching app download data:", error);
      // Set default data if fetch fails
      setAppDownloadData({
        sectionTitle: "پارسا موز را همیشه همراه داشته باشید",
        sectionSubtitle: "اپلیکیشن موبایل",
        sectionDescription:
          "با استفاده از اپلیکیشن موبایل پارسا موز، در هر زمان و مکان به سیستم مدیریت آموزشی خود دسترسی داشته باشید. مدیریت کلاس‌ها، پیگیری پیشرفت دانش‌آموزان و ارتباط با والدین را از طریق گوشی هوشمند خود انجام دهید.",
        features: [
          {
            id: "1",
            title: "رابط کاربری ساده و زیبا",
            description:
              "طراحی شده برای استفاده آسان و سریع توسط معلمان، مدیران، والدین و دانش‌آموزان.",
            icon: "DevicePhoneMobileIcon",
          },
          {
            id: "2",
            title: "سازگار با همه دستگاه‌ها",
            description:
              "قابل استفاده بر روی گوشی‌های اندروید، آیفون و تبلت‌ها با تجربه کاربری یکسان.",
            icon: "DeviceTabletIcon",
          },
        ],
        downloadButtons: [
          {
            id: "1",
            title: "دانلود از App Store",
            subtitle: "iOS",
            link: "#",
            iconUrl: "https://cdn-icons-png.flaticon.com/512/732/732208.png",
            bgColor: "#4F46E5",
            textColor: "#FFFFFF",
          },
          {
            id: "2",
            title: "دانلود از Google Play",
            subtitle: "Android",
            link: "#",
            iconUrl: "https://cdn-icons-png.flaticon.com/512/6124/6124997.png",
            bgColor: "#000000",
            textColor: "#FFFFFF",
          },
        ],
        appScreenshots: ["https://i.ibb.co/TLGBkg6/mobile-app-screen1.png"],
        isVisible: true,
        sectionTitleColor: "#1F2937",
        sectionSubtitleColor: "#4F46E5",
        sectionDescriptionColor: "#6B7280",
        backgroundGradientFrom: "#EEF2FF",
        backgroundGradientTo: "#FFFFFF",
        featureTitleColor: "#1F2937",
        featureDescriptionColor: "#6B7280",
        featureIconBgColor: "#4F46E5",
        featureIconColor: "#FFFFFF",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppDownload = async (data: AppDownloadData) => {
    try {
      const response = await fetch("/api/admin/app-download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setAppDownloadData(data);
        setShowEditModal(false);
        await fetchAppDownloadData();
      } else {
        console.error("Failed to save app download data:", result);
        alert("خطا در ذخیره اطلاعات: " + (result.error || "خطای نامشخص"));
      }
    } catch (error) {
      console.error("Error saving app download data:", error);
      alert("خطا در ذخیره اطلاعات");
    }
  };

  if (loading || !appDownloadData) {
    return (
      <section
        className="py-24 overflow-hidden flex items-center justify-center"
        style={{
          background: `linear-gradient(to bottom, #EEF2FF, #FFFFFF)`,
        }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            در حال بارگذاری...
          </p>
        </div>
      </section>
    );
  }

  // Show admin placeholder if section is invisible
  if (!appDownloadData.isVisible) {
    if (!isSchoolAdmin) {
      return null;
    }

    return (
      <section
        className="relative bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <span className="text-4xl">📱</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              بخش دانلود اپلیکیشن غیرفعال است
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
              تنظیمات بخش دانلود اپلیکیشن
            </button>
          </div>
        </div>

        {showEditModal && (
          <AppDownloadEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveAppDownload}
            initialData={appDownloadData}
          />
        )}
      </section>
    );
  }

  return (
    <section
      id="app"
      className="relative py-24 overflow-hidden"
      dir="rtl"
      style={{
        background: `linear-gradient(to bottom, ${appDownloadData.backgroundGradientFrom}, ${appDownloadData.backgroundGradientTo})`,
      }}
    >
      {/* Settings Icon for School Admins */}
      {isSchoolAdmin && (
        <button
          onClick={() => setShowEditModal(true)}
          className="absolute top-4 left-4 z-20 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 group"
          title="ویرایش بخش دانلود اپلیکیشن"
        >
          <CogIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="text-base font-semibold tracking-wide uppercase"
              style={{ color: appDownloadData.sectionSubtitleColor }}
            >
              {appDownloadData.sectionSubtitle}
            </h2>
            <p
              className="mt-2 text-3xl font-extrabold sm:text-4xl"
              style={{ color: appDownloadData.sectionTitleColor }}
            >
              {appDownloadData.sectionTitle}
            </p>
            <p
              className="mt-4 text-lg"
              style={{ color: appDownloadData.sectionDescriptionColor }}
            >
              {appDownloadData.sectionDescription}
            </p>

            <div className="mt-8 space-y-4">
              {appDownloadData.features.map((feature) => {
                const IconComponent =
                  iconMap[feature.icon as keyof typeof iconMap] ||
                  DevicePhoneMobileIcon;

                return (
                  <div key={feature.id} className="flex">
                    <div className="flex-shrink-0">
                      <div
                        className="flex items-center justify-center h-12 w-12 rounded-md"
                        style={{
                          backgroundColor: appDownloadData.featureIconBgColor,
                          color: appDownloadData.featureIconColor,
                        }}
                      >
                        <IconComponent className="h-6 w-6" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="mr-4">
                      <h3
                        className="text-lg font-medium"
                        style={{ color: appDownloadData.featureTitleColor }}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className="mt-1"
                        style={{
                          color: appDownloadData.featureDescriptionColor,
                        }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              {appDownloadData.downloadButtons.map((button) => (
                <motion.a
                  key={button.id}
                  href={button.link}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium transition-transform"
                  style={{
                    backgroundColor: button.bgColor,
                    color: button.textColor,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {button.iconUrl && (
                    <Image
                      src={button.iconUrl}
                      alt={button.title}
                      width={24}
                      height={24}
                      className="ml-2"
                    />
                  )}
                  {button.title}
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="mt-10 lg:mt-0 relative"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative mx-auto w-full max-w-md">
              {/* Phone frame */}
              <div className="relative z-10 overflow-hidden rounded-[2.5rem] border-4 border-gray-800 bg-gray-800 shadow-lg">
                <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-lg"></div>
                <div className="absolute top-2 inset-x-0 flex justify-center">
                  <div className="h-2 w-16 rounded-full bg-gray-700"></div>
                </div>

                {/* App screenshots */}
                <div className="aspect-[9/19] overflow-hidden">
                  <div className="h-full w-full relative">
                    {appDownloadData.appScreenshots.length > 0 ? (
                      <Image
                        src={appDownloadData.appScreenshots[0]}
                        alt="App Screenshot"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <DevicePhoneMobileIcon className="h-24 w-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Home button */}
                <div className="absolute bottom-1 inset-x-0 flex justify-center">
                  <div className="h-4 w-4 rounded-full border-2 border-gray-600"></div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-5 h-40 w-40 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-8 left-10 h-40 w-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <AppDownloadEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveAppDownload}
          initialData={appDownloadData}
        />
      )}
    </section>
  );
}
