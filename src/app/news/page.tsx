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
} from "@heroicons/react/24/outline";
import LandingNavbar from "@/components/landing/LandingNavbar";
import FooterSection from "@/components/landing/FooterSection";

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

export default function NewsPage() {
  const [content, setContent] = useState<NewsContent>(defaultNewsContent);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsContent();
  }, []);

  const fetchNewsContent = async () => {
    try {
      const response = await fetch("/api/admin/news");
      const data = await response.json();

      if (data.success) {
        setContent(data.news);
      } else {
        setContent(defaultNewsContent);
      }
    } catch (error) {
      console.error("Error fetching news content:", error);
      setContent(defaultNewsContent);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique categories
  const categories = [...new Set(content.news.map((item) => item.category))];

  // Filter news by category
  const filteredNews = selectedCategory
    ? content.news.filter((item) => item.category === selectedCategory)
    : content.news;

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

            {/* News Grid Skeleton */}
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
                <ArrowLeftIcon className="w-4 h-4 text-gray-400 mx-2" />
              </li>
              <li>
                <span className="text-gray-900 font-medium">اخبار</span>
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
                همه اخبار
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

      {/* News Grid */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredNews.map((item, index) => (
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
                    className="text-sm mb-3 flex items-center"
                    style={{ color: content.newsDateColor }}
                  >
                    <CalendarDaysIcon className="w-4 h-4 ml-1" />
                    {item.date}
                  </div>

                  <h3
                    className="text-xl font-bold mb-3 line-clamp-2"
                    style={{ color: content.newsTitleColor }}
                  >
                    {item.title}
                  </h3>

                  <p
                    className="mb-4 line-clamp-3 leading-relaxed"
                    style={{ color: content.newsExcerptColor }}
                  >
                    {item.excerpt}
                  </p>

                  <Link
                    href={item.link}
                    className="font-medium inline-flex items-center hover:opacity-75 transition-all duration-200 group"
                    style={{ color: content.readMoreColor }}
                  >
                    ادامه مطلب
                    <ArrowLongRightIcon className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Empty State */}
          {filteredNews.length === 0 && (
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
                خبری یافت نشد
              </h3>
              <p className="text-gray-500 mb-6">
                در دسته‌بندی انتخابی خبری وجود ندارد.
              </p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-colors"
                style={{ backgroundColor: content.categoryBackgroundColor }}
              >
                مشاهده همه اخبار
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
                عضویت در خبرنامه
              </h3>
              <p className="text-gray-600 mb-6">
                برای دریافت آخرین اخبار و اطلاعیه‌ها در خبرنامه ما عضو شوید.
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
