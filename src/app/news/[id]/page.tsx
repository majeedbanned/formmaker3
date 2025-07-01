"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  TagIcon,
  ShareIcon,
  ClockIcon,
  EyeIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/24/outline";
import LandingNavbar from "@/components/landing/LandingNavbar";

interface NewsArticle {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  image: string;
  author: string;
  readTime: string;
  views: number;
  tags: string[];
  relatedNews: NewsItem[];
}

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
}

const defaultNewsContent: NewsContent = {
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
};

const mockNewsArticles: { [key: string]: NewsArticle } = {
  "1": {
    id: 1,
    title: "برگزاری همایش فناوری آموزشی در تهران",
    excerpt:
      "همایش سالانه فناوری آموزشی با حضور مدیران مدارس برتر کشور در تهران برگزار شد.",
    content: `
      <p>همایش سالانه فناوری آموزشی یکی از مهم‌ترین رویدادهای علمی و تخصصی در حوزه آموزش و پرورش محسوب می‌شود که امسال با حضور گسترده‌ای از مدیران مدارس، معلمان، کارشناسان آموزشی و فعالان حوزه فناوری آموزشی از سراسر کشور در تهران برگزار شد.</p>
      
      <h3>اهداف همایش</h3>
      <p>این همایش با هدف ارتقاء سطح کیفی آموزش، معرفی جدیدترین فناوری‌های آموزشی، تبادل تجربیات موفق و ایجاد فرصت‌های همکاری میان مراکز آموزشی برگزار گردید.</p>
      
      <h3>سخنرانان و موضوعات کلیدی</h3>
      <p>در این همایش، متخصصان برجسته داخلی و خارجی به ارائه آخرین یافته‌های پژوهشی خود در زمینه‌های مختلف فناوری آموزشی پرداختند. از جمله موضوعات کلیدی مطرح شده می‌توان به کاربرد هوش مصنوعی در آموزش، یادگیری تطبیقی، واقعیت مجازی و افزوده در کلاس‌های درس، و سیستم‌های مدیریت یادگیری نوین اشاره کرد.</p>
      
      <h3>کارگاه‌های تخصصی</h3>
      <p>علاوه بر سخنرانی‌های کلیدی، کارگاه‌های تخصصی متنوعی نیز در زمینه‌های مختلف برگزار شد که شرکت‌کنندگان فرصت یادگیری عملی و تعامل مستقیم با ابزارها و تکنیک‌های جدید آموزشی را پیدا کردند.</p>
      
      <h3>نمایشگاه فناوری آموزشی</h3>
      <p>همزمان با همایش، نمایشگاهی از جدیدترین محصولات و خدمات فناوری آموزشی نیز برپا شد که بازدیدکنندگان توانستند با آخرین دستاورد‌ها در این حوزه آشنا شوند و امکان تست و ارزیابی آن‌ها را داشته باشند.</p>
      
      <h3>نتایج و دستاوردها</h3>
      <p>در پایان همایش، بیانیه‌ای منتشر شد که شامل راهکارها و پیشنهادات عملی برای بهبود وضعیت فناوری آموزشی در کشور بود. همچنین تفاهم‌نامه‌های همکاری میان مراکز مختلف آموزشی و شرکت‌های فناور به امضا رسید.</p>
    `,
    date: "۲ مهر ۱۴۰۳",
    category: "رویدادها",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
    author: "دکتر احمد محمدی",
    readTime: "۸ دقیقه",
    views: 1247,
    tags: ["فناوری آموزشی", "همایش", "آموزش", "نوآوری"],
    relatedNews: [
      {
        id: 2,
        title: "انتشار نسخه جدید پارسا موز با قابلیت‌های هوش مصنوعی",
        excerpt:
          "نسخه جدید پارسا موز با بهره‌گیری از هوش مصنوعی، امکانات تازه‌ای برای ارزیابی پیشرفت دانش‌آموزان ارائه می‌دهد.",
        date: "۱۵ شهریور ۱۴۰۳",
        category: "محصولات",
        image:
          "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
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
          "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        link: "/news/3",
      },
    ],
  },
  "2": {
    id: 2,
    title: "انتشار نسخه جدید پارسا موز با قابلیت‌های هوش مصنوعی",
    excerpt:
      "نسخه جدید پارسا موز با بهره‌گیری از هوش مصنوعی، امکانات تازه‌ای برای ارزیابی پیشرفت دانش‌آموزان ارائه می‌دهد.",
    content: `
      <p>شرکت پارسا موز با افتخار از انتشار نسخه جدید پلتفرم آموزشی خود خبر می‌دهد که در آن از پیشرفته‌ترین تکنولوژی‌های هوش مصنوعی برای بهبود تجربه یادگیری دانش‌آموزان استفاده شده است.</p>
      
      <h3>قابلیت‌های جدید هوش مصنوعی</h3>
      <p>این نسخه شامل سیستم تحلیل هوشمند عملکرد دانش‌آموزان، پیشنهاد محتوای شخصی‌سازی شده، و ارزیابی خودکار پاسخ‌های تشریحی است که به معلمان کمک می‌کند تا بهتر با نیازهای هر دانش‌آموز آشنا شوند.</p>
      
      <h3>تحلیل هوشمند عملکرد</h3>
      <p>سیستم جدید قادر است الگوهای یادگیری هر دانش‌آموز را تشخیص داده و نقاط قوت و ضعف آن‌ها را شناسایی کند. این اطلاعات به معلمان کمک می‌کند تا برنامه آموزشی مناسب‌تری طراحی نمایند.</p>
      
      <h3>شخصی‌سازی محتوا</h3>
      <p>بر اساس عملکرد و علایق دانش‌آموزان، سیستم محتوای آموزشی مناسب را پیشنهاد می‌دهد و مسیر یادگیری هر فرد را به صورت هوشمند تنظیم می‌کند.</p>
    `,
    date: "۱۵ شهریور ۱۴۰۳",
    category: "محصولات",
    image:
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
    author: "مهندس علی کریمی",
    readTime: "۶ دقیقه",
    views: 892,
    tags: ["هوش مصنوعی", "پارسا موز", "یادگیری", "فناوری"],
    relatedNews: [
      {
        id: 1,
        title: "برگزاری همایش فناوری آموزشی در تهران",
        excerpt:
          "همایش سالانه فناوری آموزشی با حضور مدیران مدارس برتر کشور در تهران برگزار شد.",
        date: "۲ مهر ۱۴۰۳",
        category: "رویدادها",
        image:
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        link: "/news/1",
      },
      {
        id: 3,
        title: "همکاری پارسا موز با وزارت آموزش و پرورش",
        excerpt:
          "تفاهم‌نامه همکاری میان پارسا موز و وزارت آموزش و پرورش جهت توسعه سیستم‌های نوین آموزشی به امضا رسید.",
        date: "۵ مرداد ۱۴۰۳",
        category: "همکاری‌ها",
        image:
          "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        link: "/news/3",
      },
    ],
  },
  "3": {
    id: 3,
    title: "همکاری پارسا موز با وزارت آموزش و پرورش",
    excerpt:
      "تفاهم‌نامه همکاری میان پارسا موز و وزارت آموزش و پرورش جهت توسعه سیستم‌های نوین آموزشی به امضا رسید.",
    content: `
      <p>در گامی مهم برای توسعه آموزش دیجیتال در کشور، تفاهم‌نامه همکاری میان شرکت پارسا موز و وزارت آموزش و پرورش به امضا رسید.</p>
      
      <h3>اهداف تفاهم‌نامه</h3>
      <p>این تفاهم‌نامه با هدف ارتقاء کیفیت آموزش، توسعه ابزارهای نوین آموزشی، و بهره‌برداری بهینه از فناوری‌های مدرن در کلاس‌های درس منعقد شده است.</p>
      
      <h3>زمینه‌های همکاری</h3>
      <p>بر اساس این توافق، همکاری‌های مشترکی در زمینه توسعه محتوای آموزشی دیجیتال، آموزش معلمان، و پیاده‌سازی سیستم‌های هوشمند مدیریت آموزش انجام خواهد شد.</p>
      
      <h3>مزایای انتظاری</h3>
      <p>انتظار می‌رود این همکاری منجر به بهبود کیفیت آموزش در سراسر کشور، کاهش شکاف‌های آموزشی، و ایجاد فرصت‌های برابر یادگیری برای همه دانش‌آموزان شود.</p>
    `,
    date: "۵ مرداد ۱۴۰۳",
    category: "همکاری‌ها",
    image:
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
    author: "سارا احمدی",
    readTime: "۵ دقیقه",
    views: 634,
    tags: ["همکاری", "وزارت آموزش و پرورش", "پارسا موز", "آموزش دیجیتال"],
    relatedNews: [
      {
        id: 1,
        title: "برگزاری همایش فناوری آموزشی در تهران",
        excerpt:
          "همایش سالانه فناوری آموزشی با حضور مدیران مدارس برتر کشور در تهران برگزار شد.",
        date: "۲ مهر ۱۴۰۳",
        category: "رویدادها",
        image:
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
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
          "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        link: "/news/2",
      },
    ],
  },
};

export default function NewsArticlePage() {
  const params = useParams();
  const newsId = params.id as string;

  const [content, setContent] = useState<NewsContent>(defaultNewsContent);
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [newsId]);

  const fetchContent = async () => {
    try {
      // Fetch news content styles
      const response = await fetch("/api/admin/news");
      const data = await response.json();

      if (data.success) {
        setContent({
          backgroundColor:
            data.news.backgroundColor || defaultNewsContent.backgroundColor,
          titleColor: data.news.titleColor || defaultNewsContent.titleColor,
          subtitleColor:
            data.news.subtitleColor || defaultNewsContent.subtitleColor,
          descriptionColor:
            data.news.descriptionColor || defaultNewsContent.descriptionColor,
          cardBackgroundColor:
            data.news.cardBackgroundColor ||
            defaultNewsContent.cardBackgroundColor,
          newsTitleColor:
            data.news.newsTitleColor || defaultNewsContent.newsTitleColor,
          newsExcerptColor:
            data.news.newsExcerptColor || defaultNewsContent.newsExcerptColor,
          newsDateColor:
            data.news.newsDateColor || defaultNewsContent.newsDateColor,
          categoryBackgroundColor:
            data.news.categoryBackgroundColor ||
            defaultNewsContent.categoryBackgroundColor,
          categoryTextColor:
            data.news.categoryTextColor || defaultNewsContent.categoryTextColor,
          readMoreColor:
            data.news.readMoreColor || defaultNewsContent.readMoreColor,
        });
      }

      // For now, use mock data. In production, you would fetch from API
      const foundArticle = mockNewsArticles[newsId];
      if (foundArticle) {
        setArticle(foundArticle);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching article:", error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert("لینک کپی شد!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LandingNavbar />
        <div className="pt-24 pb-12" dir="rtl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              {/* Breadcrumb Skeleton */}
              <div className="h-4 bg-gray-200 rounded w-48 mb-8"></div>

              {/* Hero Image Skeleton */}
              <div className="h-96 bg-gray-200 rounded-2xl mb-8"></div>

              {/* Article Header Skeleton */}
              <div className="mb-8">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3 mb-6"></div>
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="space-y-4">
                {[...Array(8)].map((_, index) => (
                  <div
                    key={index}
                    className="h-4 bg-gray-200 rounded w-full"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: content.backgroundColor }}
      >
        <LandingNavbar />
        <div className="pt-24 pb-12" dir="rtl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="py-20">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                خبر یافت نشد
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                متأسفانه خبر مورد نظر یافت نشد یا ممکن است حذف شده باشد.
              </p>
              <Link
                href="/news"
                className="inline-flex items-center px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-colors"
                style={{ backgroundColor: content.categoryBackgroundColor }}
              >
                <ArrowLeftIcon className="w-5 h-5 ml-2" />
                بازگشت به فهرست اخبار
              </Link>
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

      <article className="pt-24 pb-12" dir="rtl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <motion.nav
            className="flex mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ol className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
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
                <Link
                  href="/news"
                  className="text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  اخبار
                </Link>
              </li>
              <li>
                <ArrowLeftIcon className="w-4 h-4 text-gray-400 mx-2" />
              </li>
              <li>
                <span className="text-gray-900 font-medium line-clamp-1">
                  {article.title}
                </span>
              </li>
            </ol>
          </motion.nav>

          {/* Hero Image */}
          <motion.div
            className="relative h-96 rounded-2xl overflow-hidden mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div
              className="absolute bottom-4 right-4 text-sm font-medium py-2 px-4 rounded-full flex items-center"
              style={{
                backgroundColor: content.categoryBackgroundColor,
                color: content.categoryTextColor,
              }}
            >
              <TagIcon className="w-4 h-4 ml-1" />
              {article.category}
            </div>
          </motion.div>

          {/* Article Header */}
          <motion.header
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1
              className="text-3xl md:text-4xl font-bold leading-tight mb-4"
              style={{ color: content.subtitleColor }}
            >
              {article.title}
            </h1>

            <p
              className="text-xl leading-relaxed mb-6"
              style={{ color: content.descriptionColor }}
            >
              {article.excerpt}
            </p>

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div
                className="flex items-center"
                style={{ color: content.newsDateColor }}
              >
                <CalendarDaysIcon className="w-4 h-4 ml-1" />
                {article.date}
              </div>
              <div
                className="flex items-center"
                style={{ color: content.newsDateColor }}
              >
                <ClockIcon className="w-4 h-4 ml-1" />
                {article.readTime}
              </div>
              <div
                className="flex items-center"
                style={{ color: content.newsDateColor }}
              >
                <EyeIcon className="w-4 h-4 ml-1" />
                {article.views.toLocaleString("fa-IR")} بازدید
              </div>
              <div
                className="flex items-center"
                style={{ color: content.newsDateColor }}
              >
                نویسنده: {article.author}
              </div>
            </div>

            {/* Share Button */}
            <div className="mt-6">
              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ShareIcon className="w-4 h-4 ml-1" />
                اشتراک‌گذاری
              </button>
            </div>
          </motion.header>

          {/* Article Content */}
          <motion.div
            className="prose prose-lg max-w-none"
            style={{
              color: content.newsExcerptColor,
              fontSize: "18px",
              lineHeight: "1.8",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          <motion.div
            className="mt-8 pt-8 border-t border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: content.subtitleColor }}
            >
              برچسب‌ها
            </h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm rounded-full"
                  style={{
                    backgroundColor: content.categoryBackgroundColor + "15",
                    color: content.categoryBackgroundColor,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </article>

      {/* Related News */}
      {article.relatedNews.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
            <motion.h2
              className="text-2xl font-bold mb-12 text-center"
              style={{ color: content.subtitleColor }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              اخبار مرتبط
            </motion.h2>

            <div className="grid gap-8 md:grid-cols-2">
              {article.relatedNews.map((relatedItem, index) => (
                <motion.article
                  key={relatedItem.id}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="relative h-48">
                    <Image
                      src={relatedItem.image}
                      alt={relatedItem.title}
                      fill
                      className="object-cover"
                    />
                    <div
                      className="absolute top-0 right-0 m-4 text-xs font-medium py-1 px-2 rounded-full"
                      style={{
                        backgroundColor: content.categoryBackgroundColor,
                        color: content.categoryTextColor,
                      }}
                    >
                      {relatedItem.category}
                    </div>
                  </div>

                  <div className="p-6">
                    <div
                      className="text-sm mb-2"
                      style={{ color: content.newsDateColor }}
                    >
                      {relatedItem.date}
                    </div>

                    <h3
                      className="text-lg font-bold mb-2 line-clamp-2"
                      style={{ color: content.newsTitleColor }}
                    >
                      {relatedItem.title}
                    </h3>

                    <p
                      className="mb-4 line-clamp-2"
                      style={{ color: content.newsExcerptColor }}
                    >
                      {relatedItem.excerpt}
                    </p>

                    <Link
                      href={relatedItem.link}
                      className="font-medium inline-flex items-center hover:opacity-75 transition-opacity group"
                      style={{ color: content.readMoreColor }}
                    >
                      ادامه مطلب
                      <ArrowLongRightIcon className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>

            <motion.div
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link
                href="/news"
                className="inline-flex items-center px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-colors"
                style={{ backgroundColor: content.categoryBackgroundColor }}
              >
                مشاهده همه اخبار
                <ArrowLongRightIcon className="mr-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}
