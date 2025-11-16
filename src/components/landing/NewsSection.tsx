"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLongRightIcon, CogIcon } from "@heroicons/react/24/outline";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import NewsEditModal from "@/components/modals/NewsEditModal";

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
  link: string;
}

interface NewsContent {
  title: string;
  subtitle: string;
  description: string;
  news: NewsItem[];
  viewAllText: string;
  viewAllLink: string;
  isVisible: boolean;
  backgroundColor: string;
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  cardBackgroundColor: string;
  newsTitleColor: string;
  newsExcerptColor: string;
  newsDateColor: string;
  categoryBackgroundColor: string;
  categoryTextColor: string;
  readMoreColor: string;
  viewAllButtonBackgroundColor: string;
  viewAllButtonTextColor: string;
}

const defaultNewsContent: NewsContent = {
  title: "آخرین اخبار",
  subtitle: "تازه‌ترین رویدادها و اخبار",
  description: "از آخرین تحولات، رویدادها و بروزرسانی‌های پارسا موز مطلع شوید.",
  news: [
    {
      id: 1,
      title: "برگزاری همایش فناوری آموزشی در تهران",
      excerpt:
        "همایش سالانه فناوری آموزشی با حضور مدیران مدارس برتر کشور در تهران برگزار شد.",
      date: "۲ مهر ۱۴۰۳",
      category: "رویدادها",
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      link: "/news/1",
    },
    {
      id: 2,
      title: "انتشار نسخه جدید پارسا موز با قابلیت‌های هوش مصنوعی",
      excerpt:
        "نسخه جدید پارسا موز با بهره‌گیری از هوش مصنوعی، امکانات تازه‌ای برای ارزیابی پیشرفت دانش‌آموزان ارائه می‌دهد.",
      date: "۱۵ شهریور ۱۴۰۳",
      category: "محصولات",
      image:
        "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      link: "/news/2",
    },
    {
      id: 3,
      title: "همکاری پارسا موز با وزارت آموزش و پرورش",
      excerpt:
        "تفاهم‌نامه همکاری میان پارسا موز و وزارت آموزش و پرورش جهت توسعه سیستم‌های نوین آموزشی به امضا رسید.",
      date: "۵ مرداد ۱۴۰۳",
      category: "همکاری‌ها",
      image:
        "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      link: "/news/3",
    },
  ],
  viewAllText: "مشاهده همه اخبار",
  viewAllLink: "/news",
  isVisible: true,
  backgroundColor: "#FFFFFF",
  titleColor: "#4F46E5",
  subtitleColor: "#111827",
  descriptionColor: "#6B7280",
  cardBackgroundColor: "#FFFFFF",
  newsTitleColor: "#111827",
  newsExcerptColor: "#6B7280",
  newsDateColor: "#6B7280",
  categoryBackgroundColor: "#4F46E5",
  categoryTextColor: "#FFFFFF",
  readMoreColor: "#4F46E5",
  viewAllButtonBackgroundColor: "#4F46E5",
  viewAllButtonTextColor: "#FFFFFF",
};

export default function NewsSection() {
  const { isAuthenticated, user } = usePublicAuth();
  const [content, setContent] = useState<NewsContent>(defaultNewsContent);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: number]: boolean}>({});

  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  useEffect(() => {
    fetchNewsContent();
  }, []);

  const fetchNewsContent = async () => {
    try {
      // console.log("Fetching news content...");
      // Add cache busting to ensure fresh data after uploads
      const response = await fetch("/api/admin/news", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });
      const data = await response.json();

      if (data.success) {
        // console.log("News content fetched successfully:", data.news);
        setContent(data.news);
      } else {
        // console.log("Using default news content");
        setContent(defaultNewsContent);
      }
    } catch (error) {
      console.error("Error fetching news content:", error);
      setContent(defaultNewsContent);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedContent: NewsContent) => {
    try {
      // console.log("Saving news content:", updatedContent);
      
      const response = await fetch("/api/admin/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedContent),
      });

      const data = await response.json();
      // console.log("News save response:", data);

      if (response.ok && data.success) {
        setContent(updatedContent);
        toast.success("تغییرات با موفقیت ذخیره شد");
        // Refresh content to ensure fresh data
        await fetchNewsContent();
      } else {
        console.error("Failed to save news content:", data);
        toast.error("خطا در ذخیره تغییرات: " + (data.error || "خطای نامشخص"));
      }
    } catch (error) {
      console.error("Error saving news content:", error);
      toast.error("خطا در ذخیره تغییرات");
    }
  };

  if (isLoading) {
    return (
      <section id="news" className="py-24 bg-white" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-80 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg animate-pulse"
              >
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-16 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If not visible and not admin, return null
  if (!content.isVisible && !isSchoolAdmin) {
    return null;
  }

  // Admin placeholder when content is hidden
  if (!content.isVisible && isSchoolAdmin) {
    return (
      <section
        id="news"
        className="py-24 relative"
        style={{ backgroundColor: content.backgroundColor }}
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-2 border-dashed border-yellow-400 bg-yellow-50/50 rounded-lg p-12 text-center">
            <CogIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              بخش اخبار (مخفی)
            </h3>
            <p className="text-yellow-700 mb-4">
              این بخش در حالت مخفی قرار دارد و برای بازدیدکنندگان نمایش داده
              نمی‌شود.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
            >
              تنظیمات بخش
            </button>
          </div>
        </div>
        <NewsEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          currentContent={content}
        />
      </section>
    );
  }

  return (
    <section
      id="news"
      className="py-24 relative"
      style={{ backgroundColor: content.backgroundColor }}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Settings Button */}
        {isSchoolAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all z-10"
            title="تنظیمات بخش اخبار"
          >
            <CogIcon className="w-5 h-5" />
          </button>
        )}

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-base font-semibold tracking-wide uppercase"
            style={{ color: content.titleColor }}
          >
            {content.title}
          </h2>
          <p
            className="mt-2 text-3xl font-extrabold sm:text-4xl"
            style={{ color: content.subtitleColor }}
          >
            {content.subtitle}
          </p>
          <p
            className="mt-4 max-w-2xl text-xl mx-auto"
            style={{ color: content.descriptionColor }}
          >
            {content.description}
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {content.news.map((item, index) => (
            <motion.div
              key={item.id}
              className="rounded-lg overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-xl"
              style={{ backgroundColor: content.cardBackgroundColor }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="relative h-48 w-full">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    // console.log("News image loaded successfully:", item.image);
                    setImageLoadingStates(prev => ({...prev, [item.id]: false}));
                  }}
                  onLoadStart={() => {
                    setImageLoadingStates(prev => ({...prev, [item.id]: true}));
                  }}
                  onError={(e) => {
                    console.error("News image failed to load:", item.image);
                    setImageLoadingStates(prev => ({...prev, [item.id]: false}));
                    // Fallback to placeholder image instead of hiding
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/placeholder.jpg";
                  }}
                />
                {imageLoadingStates[item.id] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                  </div>
                )}
                <div
                  className="absolute top-0 right-0 m-4 text-xs font-medium py-1 px-2 rounded"
                  style={{
                    backgroundColor: content.categoryBackgroundColor,
                    color: content.categoryTextColor,
                  }}
                >
                  {item.category}
                </div>
              </div>
              <div className="p-6">
                <div
                  className="text-xs mb-2"
                  style={{ color: content.newsDateColor }}
                >
                  {item.date}
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: content.newsTitleColor }}
                >
                  {item.title}
                </h3>
                <p className="mb-4" style={{ color: content.newsExcerptColor }}>
                  {item.excerpt}
                </p>
                <Link
                  href={item.link}
                  className="font-medium inline-flex items-center hover:opacity-75 transition-opacity"
                  style={{ color: content.readMoreColor }}
                >
                  ادامه مطلب
                  <ArrowLongRightIcon className="mr-1 h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href={content.viewAllLink}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium transition duration-300 ease-in-out hover:opacity-90"
            style={{
              backgroundColor: content.viewAllButtonBackgroundColor,
              color: content.viewAllButtonTextColor,
            }}
          >
            {content.viewAllText}
          </Link>
        </motion.div>
      </div>

      <NewsEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        currentContent={content}
      />
    </section>
  );
}
