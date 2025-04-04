"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowLongRightIcon } from "@heroicons/react/24/outline";

const news = [
  {
    id: 1,
    title: "برگزاری همایش فناوری آموزشی در تهران",
    excerpt:
      "همایش سالانه فناوری آموزشی با حضور مدیران مدارس برتر کشور در تهران برگزار شد.",
    date: "۲ مهر ۱۴۰۳",
    category: "رویدادها",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
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
  },
];

export default function NewsSection() {
  return (
    <section id="news" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">
            آخرین اخبار
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            تازه‌ترین رویدادها و اخبار
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            از آخرین تحولات، رویدادها و بروزرسانی‌های پارسا موز مطلع شوید.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item, index) => (
            <motion.div
              key={item.id}
              className="bg-white rounded-lg overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="relative h-48 w-full">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-0 right-0 m-4 bg-indigo-600 text-white text-xs font-medium py-1 px-2 rounded">
                  {item.category}
                </div>
              </div>
              <div className="p-6">
                <div className="text-xs text-gray-500 mb-2">{item.date}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-4">{item.excerpt}</p>
                <Link
                  href={`/news/${item.id}`}
                  className="text-indigo-600 font-medium inline-flex items-center hover:text-indigo-500 transition-colors"
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
            href="/news"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition duration-300 ease-in-out"
          >
            مشاهده همه اخبار
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
