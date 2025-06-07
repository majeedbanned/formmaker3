"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { CogIcon } from "@heroicons/react/24/outline";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import TestimonialsEditModal from "./TestimonialsEditModal";

interface Testimonial {
  id: string;
  content: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
}

interface TestimonialsData {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionDescription: string;
  testimonials: Testimonial[];
  isVisible: boolean;
  sectionTitleColor: string;
  sectionSubtitleColor: string;
  sectionDescriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  testimonialBgColor: string;
  testimonialTextColor: string;
  authorNameColor: string;
  authorRoleColor: string;
  starActiveColor: string;
  starInactiveColor: string;
}

export default function TestimonialsSection() {
  const { user, isAuthenticated } = usePublicAuth();
  const [testimonialsData, setTestimonialsData] =
    useState<TestimonialsData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  useEffect(() => {
    fetchTestimonialsData();
  }, []);

  useEffect(() => {
    if (
      testimonialsData?.testimonials &&
      testimonialsData.testimonials.length > 1
    ) {
      const interval = setInterval(() => {
        setCurrentIndex(
          (prevIndex) => (prevIndex + 1) % testimonialsData.testimonials.length
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [testimonialsData?.testimonials]);

  const fetchTestimonialsData = async () => {
    try {
      const response = await fetch("/api/admin/testimonials");
      const data = await response.json();
      if (data.success) {
        setTestimonialsData(data.testimonials);
      }
    } catch (error) {
      console.error("Error fetching testimonials data:", error);
      // Set default data if fetch fails
      setTestimonialsData({
        sectionTitle: "مدارس در مورد ما چه می‌گویند",
        sectionSubtitle: "نظرات مشتریان",
        sectionDescription:
          "بیش از ۲۵۰ مدرسه از سراسر کشور به پارسا موز اعتماد کرده‌اند.",
        testimonials: [
          {
            id: "1",
            content:
              "پارسا موز تحول بزرگی در مدیریت مدرسه ما ایجاد کرد. فرایندهای اداری ساده‌تر شدند و وقت بیشتری برای تمرکز بر آموزش داریم.",
            author: "محمد احمدی",
            role: "مدیر دبیرستان شهید بهشتی",
            avatar: "/images/avatar-1.jpg",
            rating: 5,
          },
          {
            id: "2",
            content:
              "با استفاده از این سیستم، ارتباط ما با والدین به‌طور چشمگیری بهبود یافته است. آنها از این که به‌سادگی می‌توانند پیشرفت فرزندانشان را پیگیری کنند، بسیار راضی هستند.",
            author: "زهرا محمدی",
            role: "معاون آموزشی دبستان ایران",
            avatar: "/images/avatar-2.jpg",
            rating: 5,
          },
          {
            id: "3",
            content:
              "داشبوردهای تحلیلی به من کمک می‌کند تا الگوهای پیشرفت دانش‌آموزان را شناسایی کنم و برنامه درسی را برای رفع نیازهای آنها تنظیم کنم.",
            author: "علی رضایی",
            role: "دبیر ریاضی دبیرستان نمونه",
            avatar: "/images/avatar-3.jpg",
            rating: 4,
          },
          {
            id: "4",
            content:
              "پشتیبانی فنی عالی، رابط کاربری ساده و قابلیت‌های گسترده. پارسا موز قطعاً بهترین سیستم مدیریتی است که تاکنون استفاده کرده‌ام.",
            author: "سارا کریمی",
            role: "مدیر فناوری مدرسه هوشمند",
            avatar: "/images/avatar-4.jpg",
            rating: 5,
          },
        ],
        isVisible: true,
        sectionTitleColor: "#1F2937",
        sectionSubtitleColor: "#4F46E5",
        sectionDescriptionColor: "#6B7280",
        backgroundGradientFrom: "#EEF2FF",
        backgroundGradientTo: "#FFFFFF",
        testimonialBgColor: "#FFFFFF",
        testimonialTextColor: "#1F2937",
        authorNameColor: "#1F2937",
        authorRoleColor: "#6B7280",
        starActiveColor: "#FBBF24",
        starInactiveColor: "#D1D5DB",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTestimonials = async (data: TestimonialsData) => {
    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setTestimonialsData(data);
        setShowEditModal(false);
        await fetchTestimonialsData();
      } else {
        console.error("Failed to save testimonials data:", result);
        alert("خطا در ذخیره اطلاعات: " + (result.error || "خطای نامشخص"));
      }
    } catch (error) {
      console.error("Error saving testimonials data:", error);
      alert("خطا در ذخیره اطلاعات");
    }
  };

  if (loading || !testimonialsData) {
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
  if (!testimonialsData.isVisible) {
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
              <span className="text-4xl">💬</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              بخش نظرات مشتریان غیرفعال است
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
              تنظیمات بخش نظرات مشتریان
            </button>
          </div>
        </div>

        {showEditModal && (
          <TestimonialsEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveTestimonials}
            initialData={testimonialsData}
          />
        )}
      </section>
    );
  }

  return (
    <section
      id="testimonials"
      className="relative py-24"
      dir="rtl"
      style={{
        background: `linear-gradient(to bottom, ${testimonialsData.backgroundGradientFrom}, ${testimonialsData.backgroundGradientTo})`,
      }}
    >
      {/* Settings Icon for School Admins */}
      {isSchoolAdmin && (
        <button
          onClick={() => setShowEditModal(true)}
          className="absolute top-4 left-4 z-20 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 group"
          title="ویرایش بخش نظرات مشتریان"
        >
          <CogIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-base font-semibold tracking-wide uppercase"
            style={{ color: testimonialsData.sectionSubtitleColor }}
          >
            {testimonialsData.sectionSubtitle}
          </h2>
          <p
            className="mt-2 text-3xl font-extrabold sm:text-4xl"
            style={{ color: testimonialsData.sectionTitleColor }}
          >
            {testimonialsData.sectionTitle}
          </p>
          <p
            className="mt-4 max-w-2xl text-xl mx-auto"
            style={{ color: testimonialsData.sectionDescriptionColor }}
          >
            {testimonialsData.sectionDescription}
          </p>
        </motion.div>

        {testimonialsData.testimonials.length > 0 && (
          <div className="relative">
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(${currentIndex * -100}%)` }}
              >
                {testimonialsData.testimonials.map((testimonial) => (
                  <motion.div
                    key={testimonial.id}
                    className="min-w-full px-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    <div
                      className="rounded-2xl shadow-xl p-8 md:p-10 flex flex-col items-center text-center"
                      style={{
                        backgroundColor: testimonialsData.testimonialBgColor,
                      }}
                    >
                      <div className="flex mb-6">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className="h-5 w-5"
                            style={{
                              color:
                                i < testimonial.rating
                                  ? testimonialsData.starActiveColor
                                  : testimonialsData.starInactiveColor,
                            }}
                          />
                        ))}
                      </div>

                      <blockquote>
                        <p
                          className="text-xl font-medium mb-8"
                          style={{
                            color: testimonialsData.testimonialTextColor,
                          }}
                        >
                          "{testimonial.content}"
                        </p>
                      </blockquote>

                      <div className="flex items-center mt-auto">
                        <div className="relative h-12 w-12 rounded-full overflow-hidden">
                          {testimonial.avatar ? (
                            <Image
                              src={testimonial.avatar}
                              alt={testimonial.author}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-lg font-bold">
                                {testimonial.author.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mr-4 text-right">
                          <div
                            className="text-base font-medium"
                            style={{ color: testimonialsData.authorNameColor }}
                          >
                            {testimonial.author}
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{ color: testimonialsData.authorRoleColor }}
                          >
                            {testimonial.role}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Navigation dots */}
            {testimonialsData.testimonials.length > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                {testimonialsData.testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-3 w-3 rounded-full ${
                      currentIndex === index ? "bg-indigo-600" : "bg-gray-300"
                    } transition-colors duration-300`}
                    aria-label={`برو به اسلاید ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state for admins */}
        {testimonialsData.testimonials.length === 0 && isSchoolAdmin && (
          <div className="text-center py-12">
            <div className="flex justify-center items-center mb-4">
              <span className="text-4xl">💬</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              هیچ نظری اضافه نشده است
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              برای شروع اولین نظر مشتری خود را اضافه کنید
            </p>
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <CogIcon className="h-5 w-5" />
              افزودن نظرات مشتریان
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <TestimonialsEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveTestimonials}
          initialData={testimonialsData}
        />
      )}
    </section>
  );
}
