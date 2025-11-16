"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import LandingNavbar from "@/components/landing/LandingNavbar";
import FooterSection from "@/components/landing/FooterSection";

interface BlogArticle {
  id: string;
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
  relatedArticles: ArticleItem[];
}

interface ArticleItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
  link: string;
}

interface ArticlesContent {
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

const mockBlogArticles: { [key: string]: BlogArticle } = {
  "1": {
    id: "1",
    title: "راهکارهای نوین آموزش در عصر دیجیتال",
    excerpt: "امروزه با رشد فناوری‌های دیجیتال، روش‌های سنتی آموزش نیازمند بازنگری هستند. در این مقاله، راهکارهای مدرن آموزشی را بررسی می‌کنیم.",
    content: `
      <p>در دنیای امروز که فناوری‌های دیجیتال با سرعت بی‌سابقه‌ای در حال توسعه هستند، نظام‌های آموزشی نیز باید خود را با این تغییرات همگام سازند. آموزش سنتی که بر محوریت معلم و انتقال یک‌طرفه اطلاعات استوار بود، دیگر پاسخگوی نیازهای دانش‌آموزان قرن بیست و یکم نیست.</p>
      
      <h3>چالش‌های آموزش سنتی</h3>
      <p>روش‌های سنتی آموزش با محدودیت‌هایی مواجه هستند که شامل عدم انطباق با سبک‌های مختلف یادگیری، کمبود تعامل و مشارکت فعال دانش‌آموزان، و عدم امکان شخصی‌سازی فرآیند یادگیری می‌شود.</p>
      
      <h3>فناوری‌های نوین در آموزش</h3>
      <p>استفاده از ابزارهای دیجیتال مانند واقعیت مجازی، هوش مصنوعی، یادگیری تطبیقی، و پلتفرم‌های آنلاین می‌تواند تجربه یادگیری را متحول کند. این فناوری‌ها امکان ایجاد محیط‌های یادگیری تعاملی، شخصی‌سازی شده و جذاب را فراهم می‌کنند.</p>
      
      <h3>مزایای آموزش دیجیتال</h3>
      <ul>
        <li>دسترسی آسان به منابع آموزشی متنوع</li>
        <li>امکان یادگیری در زمان و مکان دلخواه</li>
        <li>تعامل بیشتر و مشارکت فعال دانش‌آموزان</li>
        <li>شخصی‌سازی فرآیند یادگیری</li>
        <li>ارزیابی مداوم و بازخورد فوری</li>
      </ul>
      
      <h3>استراتژی‌های پیاده‌سازی</h3>
      <p>برای پیاده‌سازی موفق آموزش دیجیتال، مؤسسات آموزشی باید روی آموزش معلمان، تهیه زیرساخت‌های فناوری، طراحی محتوای تعاملی، و ایجاد فرهنگ نوآوری سرمایه‌گذاری کنند.</p>
      
      <h3>نتیجه‌گیری</h3>
      <p>آموزش در عصر دیجیتال نیازمند تغییر پارادایم از روش‌های سنتی به رویکردهای نوین است. این تحول نه تنها امکان بهبود کیفیت آموزش را فراهم می‌کند، بلکه دانش‌آموزان را برای موفقیت در جامعه دیجیتال آینده آماده می‌سازد.</p>
    `,
    date: "۱۲ شهریور ۱۴۰۳",
    category: "فناوری",
    image: "/uploads/articles/digital-education-solutions.jpg",
    author: "دکتر مریم احمدی",
    readTime: "۸ دقیقه",
    views: 1532,
    tags: ["آموزش دیجیتال", "فناوری آموزشی", "نوآوری", "تحول آموزش"],
    relatedArticles: [
      {
        id: "2",
        title: "نقش هوش مصنوعی در ارتقاء کیفیت آموزش",
        excerpt: "هوش مصنوعی چگونه می‌تواند به بهبود کیفیت آموزش و شخصی‌سازی تجربه یادگیری دانش‌آموزان کمک کند؟",
        date: "۴ مرداد ۱۴۰۳",
        category: "هوش مصنوعی",
        image: "/uploads/articles/ai-in-education.jpg",
        link: "/blog/2",
      },
      {
        id: "3",
        title: "مدیریت کلاس‌های آنلاین: چالش‌ها و راه‌حل‌ها",
        excerpt: "مدیریت کلاس‌های آنلاین چالش‌های خاص خود را دارد. راهکارهای عملی برای مدیریت مؤثر کلاس‌های آنلاین.",
        date: "۲۸ تیر ۱۴۰۳",
        category: "مدیریت",
        image: "/uploads/articles/online-class-management.jpg",
        link: "/blog/3",
      },
    ],
  },
  "2": {
    id: "2",
    title: "نقش هوش مصنوعی در ارتقاء کیفیت آموزش",
    excerpt: "هوش مصنوعی چگونه می‌تواند به بهبود کیفیت آموزش و شخصی‌سازی تجربه یادگیری دانش‌آموزان کمک کند؟ این مقاله به بررسی این موضوع می‌پردازد.",
    content: `
      <p>هوش مصنوعی (AI) یکی از مهم‌ترین فناوری‌های قرن بیست و یکم محسوب می‌شود که قابلیت تحول بنیادین در حوزه آموزش و پرورش را دارد. این فناوری می‌تواند نحوه یاددهی و یادگیری را به طور کامل متحول کند.</p>
      
      <h3>کاربردهای هوش مصنوعی در آموزش</h3>
      <p>هوش مصنوعی در آموزش کاربردهای متنوعی دارد از جمله سیستم‌های توصیه‌گر محتوا، ارزیابی خودکار، تحلیل رفتار یادگیری، و ایجاد دستیارهای آموزشی هوشمند.</p>
      
      <h3>شخصی‌سازی یادگیری</h3>
      <p>یکی از مهم‌ترین مزایای هوش مصنوعی در آموزش، قابلیت شخصی‌سازی تجربه یادگیری است. الگوریتم‌های هوش مصنوعی می‌توانند سبک یادگیری، سرعت پیشرفت، و نقاط قوت و ضعف هر دانش‌آموز را تحلیل کرده و محتوای مناسب را ارائه دهند.</p>
      
      <h3>پیش‌بینی و پیشگیری</h3>
      <p>سیستم‌های هوش مصنوعی قادرند با تحلیل داده‌های عملکرد دانش‌آموزان، ریسک افت تحصیلی را پیش‌بینی کرده و راهکارهای مداخله‌ای مناسب را پیشنهاد دهند.</p>
    `,
    date: "۴ مرداد ۱۴۰۳",
    category: "هوش مصنوعی",
    image: "/uploads/articles/ai-education-quality.jpg",
    author: "مهندس علی محمدی",
    readTime: "۶ دقیقه",
    views: 1204,
    tags: ["هوش مصنوعی", "یادگیری شخصی‌سازی شده", "فناوری", "نوآوری"],
    relatedArticles: [
      {
        id: "1",
        title: "راهکارهای نوین آموزش در عصر دیجیتال",
        excerpt: "امروزه با رشد فناوری‌های دیجیتال، روش‌های سنتی آموزش نیازمند بازنگری هستند.",
        date: "۱۲ شهریور ۱۴۰۳",
        category: "فناوری",
        image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        link: "/blog/1",
      },
      {
        id: "4",
        title: "تحلیل داده‌های آموزشی و کاربرد آن در بهبود عملکرد دانش‌آموزان",
        excerpt: "چگونه می‌توان از تحلیل داده‌های آموزشی برای شناسایی نقاط ضعف و قوت دانش‌آموزان استفاده کرد؟",
        date: "۱۰ تیر ۱۴۰۳",
        category: "تحلیل داده",
        image: "/uploads/articles/educational-data-analysis.jpg",
        link: "/blog/4",
      },
    ],
  },
  "3": {
    id: "3",
    title: "مدیریت کلاس‌های آنلاین: چالش‌ها و راه‌حل‌ها",
    excerpt: "مدیریت کلاس‌های آنلاین چالش‌های خاص خود را دارد. در این مقاله، راهکارهای عملی برای مدیریت مؤثر کلاس‌های آنلاین ارائه می‌شود.",
    content: `
      <p>با گسترش آموزش آنلاین، مدیریت کلاس‌های مجازی به یکی از مهارت‌های ضروری معلمان تبدیل شده است. این نوع کلاس‌ها چالش‌ها و فرصت‌های منحصر به فردی دارند که نیازمند رویکردهای جدید هستند.</p>
      
      <h3>چالش‌های کلاس‌های آنلاین</h3>
      <p>برخی از مهم‌ترین چالش‌های کلاس‌های آنلاین عبارتند از: کاهش تعامل چهره به چهره، مشکلات فناوری، کنترل حواس‌پرتی، و ایجاد انگیزه در دانش‌آموزان.</p>
      
      <h3>استراتژی‌های مدیریت مؤثر</h3>
      <p>برای مدیریت موفق کلاس‌های آنلاین، معلمان باید از تکنیک‌هایی مانند تعامل مداوم، استفاده از ابزارهای چندرسانه‌ای، ایجاد فعالیت‌های گروهی، و ارائه بازخورد منظم استفاده کنند.</p>
      
      <h3>ابزارها و تکنولوژی‌های کمکی</h3>
      <p>انتخاب پلتفرم مناسب، استفاده از ابزارهای تعاملی، سیستم‌های مدیریت یادگیری، و تکنولوژی‌های ارزیابی آنلاین در موفقیت کلاس‌های مجازی نقش مهمی دارند.</p>
    `,
    date: "۲۸ تیر ۱۴۰۳",
    category: "مدیریت",
    image: "/uploads/articles/online-class-management-guide.jpg",
    author: "زهرا کریمی",
    readTime: "۱۰ دقیقه",
    views: 983,
    tags: ["آموزش آنلاین", "مدیریت کلاس", "تکنولوژی", "مدیریت"],
    relatedArticles: [
      {
        id: "1",
        title: "راهکارهای نوین آموزش در عصر دیجیتال",
        excerpt: "امروزه با رشد فناوری‌های دیجیتال، روش‌های سنتی آموزش نیازمند بازنگری هستند.",
        date: "۱۲ شهریور ۱۴۰۳",
        category: "فناوری",
        image: "/uploads/articles/digital-education-solutions.jpg",
        link: "/blog/1",
      },
      {
        id: "5",
        title: "بهترین شیوه‌های ارزیابی دانش‌آموزان در محیط آنلاین",
        excerpt: "ارزیابی عادلانه و مؤثر دانش‌آموزان در محیط آنلاین نیازمند تکنیک‌ها و ابزارهای خاصی است.",
        date: "۱۵ خرداد ۱۴۰۳",
        category: "ارزیابی",
        image: "/uploads/articles/online-assessment-methods.jpg",
        link: "/blog/5",
      },
    ],
  },
};

export default function BlogArticlePage() {
  const params = useParams();
  const [content, setContent] = useState<ArticlesContent>(defaultArticlesContent);
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchContent();
    fetchArticle();
  }, [params.id]);

  const fetchContent = async () => {
    try {
      // console.log("Fetching blog article content styles...");
      const response = await fetch("/api/admin/articles", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });
      const data = await response.json();
      if (data.success) {
        // console.log("Blog article content styles fetched successfully:", data.articles);
        setContent({
          backgroundColor: data.articles.backgroundColor || defaultArticlesContent.backgroundColor,
          titleColor: data.articles.titleColor || defaultArticlesContent.titleColor,
          subtitleColor: data.articles.subtitleColor || defaultArticlesContent.subtitleColor,
          descriptionColor: data.articles.descriptionColor || defaultArticlesContent.descriptionColor,
          cardBackgroundColor: data.articles.cardBackgroundColor || defaultArticlesContent.cardBackgroundColor,
          articleTitleColor: data.articles.articleTitleColor || defaultArticlesContent.articleTitleColor,
          articleExcerptColor: data.articles.articleExcerptColor || defaultArticlesContent.articleExcerptColor,
          articleDateColor: data.articles.articleDateColor || defaultArticlesContent.articleDateColor,
          categoryBackgroundColor: data.articles.categoryBackgroundColor || defaultArticlesContent.categoryBackgroundColor,
          categoryTextColor: data.articles.categoryTextColor || defaultArticlesContent.categoryTextColor,
          readMoreColor: data.articles.readMoreColor || defaultArticlesContent.readMoreColor,
          tagBackgroundColor: data.articles.tagBackgroundColor || defaultArticlesContent.tagBackgroundColor,
          tagTextColor: data.articles.tagTextColor || defaultArticlesContent.tagTextColor,
        });
      } else {
        // console.log("Using default blog article content styles");
      }
    } catch (error) {
      console.error("Error fetching blog article content:", error);
    }
  };

  const fetchArticle = async () => {
    try {
      // console.log("Fetching blog article with ID:", params.id);
      // For now, use mock data. In a real app, this would fetch from API
      const articleData = mockBlogArticles[params.id as string];
      if (articleData) {
        // console.log("Blog article found:", articleData.title);
        setArticle(articleData);
      } else {
        // console.log("Blog article not found for ID:", params.id);
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching blog article:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
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
        // console.log("Error sharing:", error);
      }
    } else {
      // Fallback to copying URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("لینک مقاله کپی شد!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: content.backgroundColor }}>
        <LandingNavbar />
        <div className="pt-24 pb-12" dir="rtl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-64 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded-xl mb-8"></div>
              <div className="space-y-4">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <FooterSection />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: content.backgroundColor }}>
        <LandingNavbar />
        <div className="pt-24 pb-12" dir="rtl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">مقاله یافت نشد</h1>
              <p className="text-gray-600 mb-8">مقاله مورد نظر شما وجود ندارد یا حذف شده است.</p>
              <Link
                href="/blog"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                بازگشت به صفحه مقالات
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: content.backgroundColor }}>
      <LandingNavbar />

      {/* Hero Image */}
      <section className="pt-20">
        <div className="relative h-[400px] w-full">
          <img
            src={article.image}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => {
              // console.log("Blog article hero image loaded successfully:", article.image);
            }}
            onError={(e) => {
              console.error("Blog article hero image failed to load:", article.image);
              // Fallback to placeholder image
              const target = e.target as HTMLImageElement;
              target.src = "/images/placeholder.jpg";
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
          <div
            className="absolute top-8 right-8 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: content.categoryBackgroundColor,
              color: content.categoryTextColor,
            }}
          >
            {article.category}
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-12" dir="rtl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <motion.nav
            className="flex mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ol className="flex items-center space-x-2 rtl:space-x-reverse">
              <li>
                <Link href="/" className="text-gray-500 hover:text-indigo-600 transition-colors">
                  خانه
                </Link>
              </li>
              <li>
                <span className="text-gray-400 mx-2">/</span>
              </li>
              <li>
                <Link href="/blog" className="text-gray-500 hover:text-indigo-600 transition-colors">
                  مقالات
                </Link>
              </li>
              <li>
                <span className="text-gray-400 mx-2">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium line-clamp-1">{article.title}</span>
              </li>
            </ol>
          </motion.nav>

          {/* Article Header */}
          <motion.header
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1
              className="text-3xl md:text-4xl font-extrabold leading-tight mb-4"
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
              <div className="flex items-center" style={{ color: content.articleDateColor }}>
                <CalendarDaysIcon className="w-4 h-4 ml-1" />
                {article.date}
              </div>
              <div className="flex items-center" style={{ color: content.articleDateColor }}>
                <ClockIcon className="w-4 h-4 ml-1" />
                {article.readTime}
              </div>
              <div className="flex items-center" style={{ color: content.articleDateColor }}>
                <EyeIcon className="w-4 h-4 ml-1" />
                {article.views.toLocaleString("fa-IR")} بازدید
              </div>
              <div className="flex items-center" style={{ color: content.articleDateColor }}>
                <UserCircleIcon className="w-4 h-4 ml-1" />
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
              color: content.articleExcerptColor,
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
                    backgroundColor: content.tagBackgroundColor,
                    color: content.tagTextColor,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </article>

      {/* Related Articles */}
      {article.relatedArticles.length > 0 && (
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
              مقالات مرتبط
            </motion.h2>

            <div className="grid gap-8 md:grid-cols-2">
              {article.relatedArticles.map((relatedItem, index) => (
                <motion.article
                  key={relatedItem.id}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="relative h-48">
                    <img
                      src={relatedItem.image}
                      alt={relatedItem.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onLoad={() => {
                        // console.log("Related article image loaded successfully:", relatedItem.image);
                      }}
                      onError={(e) => {
                        console.error("Related article image failed to load:", relatedItem.image);
                        // Fallback to placeholder image
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/placeholder.jpg";
                      }}
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
                      style={{ color: content.articleDateColor }}
                    >
                      {relatedItem.date}
                    </div>

                    <h3
                      className="text-lg font-bold mb-2 line-clamp-2"
                      style={{ color: content.articleTitleColor }}
                    >
                      {relatedItem.title}
                    </h3>

                    <p
                      className="mb-4 line-clamp-2"
                      style={{ color: content.articleExcerptColor }}
                    >
                      {relatedItem.excerpt}
                    </p>

                    <Link
                      href={relatedItem.link}
                      className="font-medium inline-flex items-center hover:opacity-75 transition-opacity group"
                      style={{ color: content.readMoreColor }}
                    >
                      مطالعه مقاله
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
                href="/blog"
                className="inline-flex items-center px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-colors"
                style={{ backgroundColor: content.categoryBackgroundColor }}
              >
                مشاهده همه مقالات
                <ArrowLongRightIcon className="mr-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      <FooterSection />
    </div>
  );
}
