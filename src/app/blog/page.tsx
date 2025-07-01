"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  TagIcon,
  ArrowLongRightIcon,
  UserCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import LandingNavbar from "@/components/landing/LandingNavbar";
import FooterSection from "@/components/landing/FooterSection";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
  tags: string[];
  category: string;
}

interface ArticlesContent {
  title: string;
  subtitle: string;
  description: string;
  articles: Article[];
  viewAllText: string;
  viewAllLink: string;
  isVisible: boolean;
  backgroundColor: string;
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  cardBackgroundColor: string;
  articleTitleColor: string;
  articleExcerptColor: string;
  articleDateColor: string;
  categoryBackgroundColor: string;
  categoryTextColor: string;
  readMoreColor: string;
  tagBackgroundColor: string;
  tagTextColor: string;
}

const defaultArticlesContent: ArticlesContent = {
  title: "مقالات آموزشی",
  subtitle: "مجموعه مقالات کارشناسی",
  description: "با مطالعه مقالات کارشناسان ما، در مسیر بهبود و توسعه آموزش قدم بردارید.",
  articles: [
    {
      id: "1",
      title: "راهکارهای نوین آموزش در عصر دیجیتال",
      excerpt: "امروزه با رشد فناوری‌های دیجیتال، روش‌های سنتی آموزش نیازمند بازنگری هستند. در این مقاله، راهکارهای مدرن آموزشی را بررسی می‌کنیم.",
      date: "۱۲ شهریور ۱۴۰۳",
      author: "دکتر مریم احمدی",
      readTime: "۸ دقیقه",
      image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      tags: ["آموزش دیجیتال", "فناوری آموزشی"],
      category: "فناوری",
    },
    {
      id: "2",
      title: "نقش هوش مصنوعی در ارتقاء کیفیت آموزش",
      excerpt: "هوش مصنوعی چگونه می‌تواند به بهبود کیفیت آموزش و شخصی‌سازی تجربه یادگیری دانش‌آموزان کمک کند؟ این مقاله به بررسی این موضوع می‌پردازد.",
      date: "۴ مرداد ۱۴۰۳",
      author: "مهندس علی محمدی",
      readTime: "۶ دقیقه",
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      tags: ["هوش مصنوعی", "یادگیری شخصی‌سازی شده"],
      category: "هوش مصنوعی",
    },
    {
      id: "3",
      title: "مدیریت کلاس‌های آنلاین: چالش‌ها و راه‌حل‌ها",
      excerpt: "مدیریت کلاس‌های آنلاین چالش‌های خاص خود را دارد. در این مقاله، راهکارهای عملی برای مدیریت مؤثر کلاس‌های آنلاین ارائه می‌شود.",
      date: "۲۸ تیر ۱۴۰۳",
      author: "زهرا کریمی",
      readTime: "۱۰ دقیقه",
      image: "https://images.unsplash.com/photo-1610484826967-09c5720778c7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      tags: ["آموزش آنلاین", "مدیریت کلاس"],
      category: "مدیریت",
    },
    {
      id: "4",
      title: "تحلیل داده‌های آموزشی و کاربرد آن در بهبود عملکرد دانش‌آموزان",
      excerpt: "چگونه می‌توان از تحلیل داده‌های آموزشی برای شناسایی نقاط ضعف و قوت دانش‌آموزان استفاده کرد و برنامه آموزشی را بهبود بخشید؟",
      date: "۱۰ تیر ۱۴۰۳",
      author: "دکتر امیر حسینی",
      readTime: "۷ دقیقه",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      tags: ["تحلیل داده", "عملکرد تحصیلی"],
      category: "تحلیل داده",
    },
    {
      id: "5",
      title: "بهترین شیوه‌های ارزیابی دانش‌آموزان در محیط آنلاین",
      excerpt: "ارزیابی عادلانه و مؤثر دانش‌آموزان در محیط آنلاین نیازمند تکنیک‌ها و ابزارهای خاصی است. این مقاله روش‌های مختلف ارزیابی را بررسی می‌کند.",
      date: "۱۵ خرداد ۱۴۰۳",
      author: "دکتر فاطمه نوری",
      readTime: "۹ دقیقه",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      tags: ["ارزیابی", "آموزش آنلاین"],
      category: "ارزیابی",
    },
    {
      id: "6",
      title: "روش‌های تقویت انگیزه یادگیری در دانش‌آموزان",
      excerpt: "انگیزه یکی از مهم‌ترین عوامل موفقیت در یادگیری است. این مقاله راهکارهای عملی برای تقویت انگیزه یادگیری در دانش‌آموزان ارائه می‌دهد.",
      date: "۳ خرداد ۱۴۰۳",
      author: "احمد محمودی",
      readTime: "۶ دقیقه",
      image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      tags: ["انگیزه", "روانشناسی تربیتی"],
      category: "روانشناسی",
    },
  ],
  viewAllText: "مشاهده همه مقالات",
  viewAllLink: "/blog",
  isVisible: true,
  backgroundColor: "#FFFFFF",
  titleColor: "#4F46E5",
  subtitleColor: "#111827",
  descriptionColor: "#6B7280",
  cardBackgroundColor: "#FFFFFF",
  articleTitleColor: "#111827",
  articleExcerptColor: "#6B7280",
  articleDateColor: "#6B7280",
  categoryBackgroundColor: "#4F46E5",
  categoryTextColor: "#FFFFFF",
  readMoreColor: "#4F46E5",
  tagBackgroundColor: "#EEF2FF",
  tagTextColor: "#4F46E5",
};

export default function BlogPage() {
  const [content, setContent] = useState<ArticlesContent>(defaultArticlesContent);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchArticlesContent();
  }, []);

  const fetchArticlesContent = async () => {
    try {
      const response = await fetch("/api/admin/articles");
      const data = await response.json();

      if (data.success) {
        setContent(data.articles);
      } else {
        setContent(defaultArticlesContent);
      }
    } catch (error) {
      console.error("Error fetching articles content:", error);
      setContent(defaultArticlesContent);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique categories
  const categories = [...new Set(content.articles.map((item) => item.category))];

  // Filter articles by category
  const filteredArticles = selectedCategory
    ? content.articles.filter((item) => item.category === selectedCategory)
    : content.articles;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LandingNavbar />
        <div className="pt-24 pb-12" dir="rtl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Skeleton */}
            <div className="text-center mb-16 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-4"></div>
              <div className="h-12 bg-gray-200 rounded w-96 mx-auto mb-6"></div>
              <div className="h-6 bg-gray-200 rounded w-[600px] mx-auto"></div>
            </div>

            {/* Filter Skeleton */}
            <div className="flex justify-center mb-12 animate-pulse">
              <div className="flex gap-2">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="h-10 bg-gray-200 rounded-lg w-20"
                  ></div>
                ))}
              </div>
            </div>

            {/* Articles Grid Skeleton */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(9)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg animate-pulse"
                >
                  <div className="h-48 bg-gray-200 rounded-t-xl"></div>
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
        </div>
        <FooterSection />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: content.backgroundColor }}
    >
      <LandingNavbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <motion.nav
            className="flex mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ol className="flex items-center space-x-2 rtl:space-x-reverse">
              <li>
                <Link
                  href="/"
                  className="text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  خانه
                </Link>
              </li>
              <li>
                <span className="text-gray-400 mx-2">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">مقالات</span>
              </li>
            </ol>
          </motion.nav>

          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1
              className="text-base font-semibold tracking-wide uppercase mb-4"
              style={{ color: content.titleColor }}
            >
              {content.title}
            </h1>
            <h2
              className="text-4xl md:text-5xl font-extrabold mb-6"
              style={{ color: content.subtitleColor }}
            >
              {content.subtitle}
            </h2>
            <p
              className="text-xl max-w-3xl mx-auto leading-relaxed"
              style={{ color: content.descriptionColor }}
            >
              {content.description}
            </p>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            className="flex justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? "text-white"
                    : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                }`}
                style={
                  selectedCategory === null
                    ? {
                        backgroundColor: content.categoryBackgroundColor,
                        color: content.categoryTextColor,
                      }
                    : {}
                }
              >
                همه مقالات
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "text-white"
                      : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                  }`}
                  style={
                    selectedCategory === category
                      ? {
                          backgroundColor: content.categoryBackgroundColor,
                          color: content.categoryTextColor,
                        }
                      : {}
                  }
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((item, index) => (
              <motion.article
                key={item.id}
                className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                style={{ backgroundColor: content.cardBackgroundColor }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <div
                    className="absolute top-0 right-0 m-4 text-xs font-medium py-1.5 px-3 rounded-full flex items-center"
                    style={{
                      backgroundColor: content.categoryBackgroundColor,
                      color: content.categoryTextColor,
                    }}
                  >
                    <TagIcon className="w-3 h-3 ml-1" />
                    {item.category}
                  </div>
                </div>

                <div className="p-6">
                  <div
                    className="text-sm mb-3 flex items-center justify-between"
                    style={{ color: content.articleDateColor }}
                  >
                    <div className="flex items-center">
                      <CalendarDaysIcon className="w-4 h-4 ml-1" />
                      {item.date}
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 ml-1" />
                      {item.readTime}
                    </div>
                  </div>

                  <h3
                    className="text-xl font-bold mb-3 line-clamp-2"
                    style={{ color: content.articleTitleColor }}
                  >
                    {item.title}
                  </h3>

                  <p
                    className="mb-4 line-clamp-3 leading-relaxed"
                    style={{ color: content.articleExcerptColor }}
                  >
                    {item.excerpt}
                  </p>

                  <div className="mb-4 flex items-center text-sm">
                    <UserCircleIcon className="w-4 h-4 ml-1 text-gray-400" />
                    <span style={{ color: content.articleDateColor }}>
                      {item.author}
                    </span>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block text-xs font-medium px-2.5 py-0.5 rounded"
                        style={{
                          backgroundColor: content.tagBackgroundColor,
                          color: content.tagTextColor,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/blog/${item.id}`}
                    className="font-medium inline-flex items-center hover:opacity-75 transition-all duration-200 group"
                    style={{ color: content.readMoreColor }}
                  >
                    مطالعه مقاله
                    <ArrowLongRightIcon className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Empty State */}
          {filteredArticles.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <TagIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                مقاله‌ای یافت نشد
              </h3>
              <p className="text-gray-500 mb-6">
                در دسته‌بندی انتخابی مقاله‌ای وجود ندارد.
              </p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-colors"
                style={{ backgroundColor: content.categoryBackgroundColor }}
              >
                مشاهده همه مقالات
              </button>
            </motion.div>
          )}

          {/* Newsletter Subscription */}
          <motion.div
            className="text-center mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                عضویت در خبرنامه آموزشی
              </h3>
              <p className="text-gray-600 mb-6">
                برای دریافت آخرین مقالات و محتواهای آموزشی در خبرنامه ما عضو شوید.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="آدرس ایمیل شما"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  className="px-6 py-3 rounded-lg text-white font-medium hover:scale-105 transform duration-200"
                  style={{ backgroundColor: content.categoryBackgroundColor }}
                >
                  عضویت
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
