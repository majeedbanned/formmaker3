"use client";

import { motion } from "framer-motion";
import {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ChartPieIcon,
  UserGroupIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    name: "مدیریت کلاس‌ها",
    description:
      "کلاس‌ها، دروس و دانش‌آموزان را به آسانی مدیریت کنید. از تقویم درسی تا ارائه تکالیف، همه در یک پلتفرم.",
    icon: BookOpenIcon,
  },
  {
    name: "ارزیابی و آزمون‌ها",
    description:
      "آزمون‌های آنلاین ایجاد کنید، نمرات را ثبت کنید و نتایج را به صورت نمودارهای تحلیلی مشاهده کنید.",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    name: "ارتباط با والدین",
    description:
      "ارتباط موثر با والدین از طریق پیام‌رسان داخلی، گزارش‌دهی خودکار و اطلاع‌رسانی وضعیت تحصیلی.",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: "داشبورد تحلیلی",
    description:
      "داشبوردهای تحلیلی پیشرفته برای بررسی پیشرفت دانش‌آموزان، عملکرد کلاسی و روند آموزشی.",
    icon: ChartPieIcon,
  },
  {
    name: "مدیریت کاربران",
    description:
      "تعریف سطوح دسترسی مختلف برای معلمان، مدیران، دانش‌آموزان و والدین با امکان شخصی‌سازی.",
    icon: UserGroupIcon,
  },
  {
    name: "برنامه‌ریزی تحصیلی",
    description:
      "برنامه‌ریزی دروس، امتحانات و رویدادهای آموزشی با تقویم هوشمند و یادآوری‌های خودکار.",
    icon: CalendarIcon,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">
            ویژگی‌ها
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            تمام آنچه برای مدیریت آموزشی نیاز دارید
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            پارسا موز با مجموعه‌ای از ابزارهای کارآمد، فرآیند آموزش و یادگیری را
            برای همه ذینفعان تسهیل می‌کند.
          </p>
        </motion.div>

        <motion.div
          className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.name}
              className="relative p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300"
              variants={item}
            >
              <div>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {feature.name}
                </h3>
                <p className="mt-2 text-base text-gray-500">
                  {feature.description}
                </p>
              </div>
              <div
                className="absolute inset-0 rounded-lg pointer-events-none border-2 border-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(79,70,229,0.2) 0%, rgba(0,0,0,0) 50%, rgba(79,70,229,0.2) 100%) border-box",
                }}
              ></div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
