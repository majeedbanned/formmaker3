"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarIcon,
  UserCircleIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/24/outline";

const articles = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
    title: "تحلیل داده‌های آموزشی و کاربرد آن در بهبود عملکرد دانش‌آموزان",
    excerpt:
      "چگونه می‌توان از تحلیل داده‌های آموزشی برای شناسایی نقاط ضعف و قوت دانش‌آموزان استفاده کرد و برنامه آموزشی را بهبود بخشید؟",
    date: "۱۰ تیر ۱۴۰۳",
    author: "دکتر امیر حسینی",
    readTime: "۷ دقیقه",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    tags: ["تحلیل داده", "عملکرد تحصیلی"],
  },
];

export default function ArticlesSection() {
  return (
    <section id="articles" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">
            مقالات
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            آخرین مطالب آموزشی
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            با مطالعه مقالات کارشناسان ما، در مسیر بهبود و توسعه آموزش قدم
            بردارید.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {articles.slice(0, 4).map((article, index) => (
            <motion.article
              key={article.id}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
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
                    />
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/blog/${article.id}`}
                    className="text-indigo-600 font-medium inline-flex items-center hover:text-indigo-500 transition-colors"
                  >
                    مطالعه مقاله
                    <ArrowLongRightIcon className="mr-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.article>
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
            href="/blog"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition duration-300 ease-in-out"
          >
            مشاهده همه مقالات
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
