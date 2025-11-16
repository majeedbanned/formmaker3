"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import {
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import HeroEditModal from "./HeroEditModal";

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
  // Visibility setting
  isVisible: boolean;
  // Style settings
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  primaryButtonColor: string;
  primaryButtonTextColor: string;
  secondaryButtonColor: string;
  secondaryButtonTextColor: string;
  secondaryButtonBorderColor: string;
}

export default function HeroSection() {
  const { user, isAuthenticated } = usePublicAuth();
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
        // console.log("Fetched hero data:", data.hero);
        // console.log("Hero images:", data.hero.images);
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
        // Default style settings
        titleColor: "#4F46E5",
        subtitleColor: "#374151",
        descriptionColor: "#6B7280",
        backgroundGradientFrom: "#EEF2FF",
        backgroundGradientTo: "#FFFFFF",
        primaryButtonColor: "#4F46E5",
        primaryButtonTextColor: "#FFFFFF",
        secondaryButtonColor: "#FFFFFF",
        secondaryButtonTextColor: "#4F46E5",
        secondaryButtonBorderColor: "#4F46E5",
        isVisible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHero = async (data: HeroData) => {
    try {
      // console.log("Saving hero data:", data);
      // console.log("Images being saved:", data.images);

      const response = await fetch("/api/admin/hero", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      // console.log("Save response:", result);

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

  // Show admin placeholder if hero section is invisible
  if (!heroData.isVisible) {
    // Show nothing for regular users
    if (!isSchoolAdmin) {
      return null;
    }

    // Show admin placeholder with settings access
    return (
      <section
        className="relative bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <span className="text-4xl">👁️‍🗨️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              بخش هیرو غیرفعال است
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
              تنظیمات بخش هیرو
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
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

  return (
    <section
      className="relative overflow-hidden"
      dir="rtl"
      style={{
        background: `linear-gradient(to bottom, ${heroData.backgroundGradientFrom}, ${heroData.backgroundGradientTo})`,
      }}
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
              className="text-3xl md:text-3xl text-right lg:text-4xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="block" style={{ color: heroData.titleColor }}>
                {heroData.title}
              </span>
              <span
                className="block text-2xl md:text-2xl text-right lg:text-3xl mt-4"
                style={{ color: heroData.subtitleColor }}
              >
                {heroData.subtitle}
              </span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg md:text-xl text-right max-w-3xl"
              style={{ color: heroData.descriptionColor }}
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
                  <button
                    className="w-full px-8 py-3 text-base font-medium rounded-md shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-1"
                    style={{
                      backgroundColor: heroData.primaryButtonColor,
                      color: heroData.primaryButtonTextColor,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    {heroData.primaryButtonText}
                  </button>
                </Link>
              )}
              {heroData.secondaryButtonText && (
                <Link
                  href={heroData.secondaryButtonLink}
                  className="w-full sm:w-auto"
                >
                  <button
                    className="w-full px-8 py-3 text-base font-medium rounded-md shadow-sm border transition duration-300 ease-in-out transform hover:-translate-y-1"
                    style={{
                      backgroundColor: heroData.secondaryButtonColor,
                      color: heroData.secondaryButtonTextColor,
                      borderColor: heroData.secondaryButtonBorderColor,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
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
                    className="w-full h-full object-cover rounded-lg shadow-2xl transition-opacity duration-500"
                    onLoad={() => {
                      // console.log(
                      //   "Image loaded successfully:",
                      //   heroData.images[currentImageIndex]?.url
                      // );
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
