"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import {
  CalendarIcon,
  UserCircleIcon,
  ArrowLongRightIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import ArticlesEditModal from "./ArticlesEditModal";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
  tags: string[];
}

interface ArticlesData {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionDescription: string;
  viewAllButtonText: string;
  viewAllButtonLink: string;
  articles: Article[];
  // Visibility setting
  isVisible: boolean;
  // Style settings
  sectionTitleColor: string;
  sectionSubtitleColor: string;
  sectionDescriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  cardBackgroundColor: string;
  cardTextColor: string;
  cardHoverShadow: string;
  buttonColor: string;
  buttonTextColor: string;
  tagBackgroundColor: string;
  tagTextColor: string;
}

export default function ArticlesSection() {
  const { user, isAuthenticated } = usePublicAuth();
  const [articlesData, setArticlesData] = useState<ArticlesData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});

  // Check if user is school admin
  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  useEffect(() => {
    fetchArticlesData();
  }, []);

  const fetchArticlesData = async () => {
    try {
      // Add cache busting to ensure fresh data after uploads
      const response = await fetch("/api/admin/articles", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      const data = await response.json();
      if (data.success) {
        setArticlesData(data.articles);
      }
    } catch (error) {
      console.error("Error fetching articles data:", error);
      // Set default data if fetch fails
      setArticlesData({
        sectionTitle: "آخرین مطالب آموزشی",
        sectionSubtitle: "مقالات",
        sectionDescription:
          "با مطالعه مقالات کارشناسان ما، در مسیر بهبود و توسعه آموزش قدم بردارید.",
        viewAllButtonText: "مشاهده همه مقالات",
        viewAllButtonLink: "/blog",
        articles: [
          {
            id: "1",
            title: "راهکارهای نوین آموزش در عصر دیجیتال",
            excerpt:
              "امروزه با رشد فناوری‌های دیجیتال، روش‌های سنتی آموزش نیازمند بازنگری هستند. در این مقاله، راهکارهای مدرن آموزشی را بررسی می‌کنیم.",
            date: "۱۲ شهریور ۱۴۰۳",
            author: "دکتر مریم احمدی",
            readTime: "۸ دقیقه",
            image:
              "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            tags: ["آموزش دیجیتال", "فناوری آموزشی"],
          },
          {
            id: "2",
            title: "نقش هوش مصنوعی در ارتقاء کیفیت آموزش",
            excerpt:
              "هوش مصنوعی چگونه می‌تواند به بهبود کیفیت آموزش و شخصی‌سازی تجربه یادگیری دانش‌آموزان کمک کند؟ این مقاله به بررسی این موضوع می‌پردازد.",
            date: "۴ مرداد ۱۴۰۳",
            author: "مهندس علی محمدی",
            readTime: "۶ دقیقه",
            image:
              "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            tags: ["هوش مصنوعی", "یادگیری شخصی‌سازی شده"],
          },
          {
            id: "3",
            title: "مدیریت کلاس‌های آنلاین: چالش‌ها و راه‌حل‌ها",
            excerpt:
              "مدیریت کلاس‌های آنلاین چالش‌های خاص خود را دارد. در این مقاله، راهکارهای عملی برای مدیریت مؤثر کلاس‌های آنلاین ارائه می‌شود.",
            date: "۲۸ تیر ۱۴۰۳",
            author: "زهرا کریمی",
            readTime: "۱۰ دقیقه",
            image:
              "https://images.unsplash.com/photo-1610484826967-09c5720778c7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            tags: ["آموزش آنلاین", "مدیریت کلاس"],
          },
          {
            id: "4",
            title:
              "تحلیل داده‌های آموزشی و کاربرد آن در بهبود عملکرد دانش‌آموزان",
            excerpt:
              "چگونه می‌توان از تحلیل داده‌های آموزشی برای شناسایی نقاط ضعف و قوت دانش‌آموزان استفاده کرد و برنامه آموزشی را بهبود بخشید؟",
            date: "۱۰ تیر ۱۴۰۳",
            author: "دکتر امیر حسینی",
            readTime: "۷ دقیقه",
            image:
              "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            tags: ["تحلیل داده", "عملکرد تحصیلی"],
          },
        ],
        // Default style settings
        sectionTitleColor: "#1F2937",
        sectionSubtitleColor: "#4F46E5",
        sectionDescriptionColor: "#6B7280",
        backgroundGradientFrom: "#F9FAFB",
        backgroundGradientTo: "#FFFFFF",
        cardBackgroundColor: "#FFFFFF",
        cardTextColor: "#1F2937",
        cardHoverShadow: "lg",
        buttonColor: "#4F46E5",
        buttonTextColor: "#FFFFFF",
        tagBackgroundColor: "#EEF2FF",
        tagTextColor: "#4F46E5",
        isVisible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticles = async (data: ArticlesData) => {
    try {
      const response = await fetch("/api/admin/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setArticlesData(data);
        setShowEditModal(false);
        // Refresh articles data to ensure we have the latest from database
        await fetchArticlesData();
      } else {
        console.error("Failed to save articles data:", result);
        alert("خطا در ذخیره اطلاعات: " + (result.error || "خطای نامشخص"));
      }
    } catch (error) {
      console.error("Error saving articles data:", error);
      alert("خطا در ذخیره اطلاعات");
    }
  };

  if (loading || !articlesData) {
    return (
      <section
        className="py-24 flex items-center justify-center"
        style={{
          background: `linear-gradient(to bottom, #F9FAFB, #FFFFFF)`,
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

  // Show admin placeholder if articles section is invisible
  if (!articlesData.isVisible) {
    // Show nothing for regular users
    if (!isSchoolAdmin) {
      return null;
    }

    // Show admin placeholder with settings access
    return (
      <section
        className="relative bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300 py-24"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <span className="text-4xl">📰</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              بخش مقالات غیرفعال است
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
              تنظیمات بخش مقالات
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <ArticlesEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveArticles}
            initialData={articlesData}
          />
        )}
      </section>
    );
  }

  return (
    <section
      id="articles"
      className="relative py-24"
      dir="rtl"
      style={{
        background: `linear-gradient(to bottom, ${articlesData.backgroundGradientFrom}, ${articlesData.backgroundGradientTo})`,
      }}
    >
      {/* Settings Icon for School Admins */}
      {isSchoolAdmin && (
        <button
          onClick={() => setShowEditModal(true)}
          className="absolute top-8 left-4 z-20 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 group"
          title="ویرایش بخش مقالات"
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
          <h2
            className="text-base font-semibold tracking-wide uppercase"
            style={{ color: articlesData.sectionSubtitleColor }}
          >
            {articlesData.sectionSubtitle}
          </h2>
          <p
            className="mt-2 text-3xl font-extrabold sm:text-4xl"
            style={{ color: articlesData.sectionTitleColor }}
          >
            {articlesData.sectionTitle}
          </p>
          <p
            className="mt-4 max-w-2xl text-xl mx-auto"
            style={{ color: articlesData.sectionDescriptionColor }}
          >
            {articlesData.sectionDescription}
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {articlesData.articles.slice(0, 4).map((article, index) => (
            <motion.article
              key={article.id}
              className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
              style={{
                backgroundColor: articlesData.cardBackgroundColor,
                color: articlesData.cardTextColor,
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="md:flex h-full">
                <div className="md:w-2/5 relative">
                  <div className="h-48 md:h-full w-full relative">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                      priority={index < 2}
                      onLoadingComplete={() => {
                        setImageLoadingStates(prev => ({...prev, [article.id]: false}));
                      }}
                      onLoadStart={() => {
                        setImageLoadingStates(prev => ({...prev, [article.id]: true}));
                      }}
                      onError={(e) => {
                        console.error("Failed to load article image:", article.image);
                        setImageLoadingStates(prev => ({...prev, [article.id]: false}));
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    {imageLoadingStates[article.id] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6 md:w-3/5">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-4 w-4 ml-1" />
                      {article.author}
                    </div>
                    <span className="mx-2">•</span>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 ml-1" />
                      {article.date}
                    </div>
                    <span className="mx-2">•</span>
                    <span>{article.readTime} مطالعه</span>
                  </div>
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: articlesData.cardTextColor }}
                  >
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block text-xs font-medium px-2.5 py-0.5 rounded"
                        style={{
                          backgroundColor: articlesData.tagBackgroundColor,
                          color: articlesData.tagTextColor,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/blog/${article.id}`}
                    className="font-medium inline-flex items-center hover:opacity-80 transition-opacity"
                    style={{ color: articlesData.buttonColor }}
                  >
                    مطالعه مقاله
                    <ArrowLongRightIcon className="mr-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {articlesData.viewAllButtonText && articlesData.viewAllButtonLink && (
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href={articlesData.viewAllButtonLink}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium transition duration-300 ease-in-out"
              style={{
                backgroundColor: articlesData.buttonColor,
                color: articlesData.buttonTextColor,
              }}
            >
              {articlesData.viewAllButtonText}
            </Link>
          </motion.div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && articlesData && (
        <ArticlesEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveArticles}
          initialData={articlesData}
        />
      )}
    </section>
  );
}
