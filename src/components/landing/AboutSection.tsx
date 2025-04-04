"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

const stats = [
  { id: 1, name: "سال تجربه", value: "+10" },
  { id: 2, name: "مدارس", value: "+250" },
  { id: 3, name: "دانش‌آموزان", value: "+45K" },
  { id: 4, name: "رضایت مشتریان", value: "98%" },
];

const benefits = [
  "بهبود ارتباط بین معلمان، دانش‌آموزان و والدین",
  "صرفه‌جویی در زمان با اتوماسیون فرآیندهای اداری",
  "تحلیل و گزارش‌گیری جامع از عملکرد آموزشی",
  "دسترسی آسان به اطلاعات از هر دستگاه و هر مکان",
  "پشتیبانی فنی ۲۴/۷ و بروزرسانی‌های منظم",
];

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              درباره پارسا موز
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              پارسا موز با هدف ارتقای کیفیت آموزش و تسهیل فرآیندهای مدیریتی
              مدارس ایجاد شده است. تیم ما متشکل از متخصصان آموزشی و مهندسان
              نرم‌افزار، راهکاری جامع برای نیازهای آموزشی امروز طراحی کرده‌اند.
            </p>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900">
                مزایای استفاده
              </h3>
              <ul className="mt-4 space-y-3">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    className="flex"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <CheckCircleIcon className="h-6 w-6 text-green-500 ml-2" />
                    <span className="text-gray-600">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            className="mt-10 lg:mt-0 relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative h-80 lg:h-96 overflow-hidden rounded-lg shadow-xl">
              <Image
                src="/images/about-team.jpg"
                alt="Our team at work"
                fill
                className="object-cover"
                style={{ objectFit: "cover" }}
              />

              {/* Decorative elements */}
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-indigo-600 rounded-full opacity-20"></div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-600 rounded-full opacity-20"></div>
            </div>

            {/* Stats */}
            <motion.dl
              className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.id}
                  className="bg-white px-4 py-5 shadow rounded-lg overflow-hidden sm:p-6 text-center"
                >
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
