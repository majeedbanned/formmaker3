"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

const teachers = [
  {
    id: 1,
    name: "دکتر علی محمدی",
    role: "مدیر آموزشی",
    bio: "دارای دکترای مدیریت آموزشی از دانشگاه تهران با بیش از ۱۵ سال سابقه مدیریت در مدارس و موسسات آموزشی.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    subjects: ["مدیریت آموزشی", "برنامه‌ریزی درسی"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "a.mohammadi@parsamooz.ir",
    },
  },
  {
    id: 2,
    name: "دکتر سارا کریمی",
    role: "متخصص برنامه‌ریزی درسی",
    bio: "فارغ‌التحصیل دانشگاه شهید بهشتی در رشته برنامه‌ریزی آموزشی، با تجربه طراحی برنامه‌های درسی نوآورانه برای مدارس پیشرو.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    subjects: ["طراحی برنامه درسی", "ارزشیابی آموزشی"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "s.karimi@parsamooz.ir",
    },
  },
  {
    id: 3,
    name: "مهندس امیر حسینی",
    role: "مشاور فناوری آموزشی",
    bio: "کارشناس ارشد فناوری اطلاعات با تخصص در کاربرد فناوری در آموزش و پیاده‌سازی سیستم‌های مدیریت یادگیری.",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    subjects: ["فناوری آموزشی", "یادگیری الکترونیک"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "a.hosseini@parsamooz.ir",
    },
  },
  {
    id: 4,
    name: "دکتر زهرا احمدی",
    role: "متخصص روانشناسی تربیتی",
    bio: "دکترای روانشناسی تربیتی با تمرکز بر روش‌های نوین آموزش و یادگیری مبتنی بر رویکردهای شناختی.",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    subjects: ["روانشناسی تربیتی", "مشاوره تحصیلی"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "z.ahmadi@parsamooz.ir",
    },
  },
  {
    id: 5,
    name: "دکتر محمد رضایی",
    role: "متخصص ارزیابی آموزشی",
    bio: "متخصص در طراحی و اجرای سیستم‌های ارزیابی عملکرد تحصیلی و توسعه ابزارهای سنجش پیشرفت دانش‌آموزان.",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    subjects: ["سنجش و ارزیابی", "آمار آموزشی"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "m.rezaei@parsamooz.ir",
    },
  },
  {
    id: 6,
    name: "مهندس نرگس کاظمی",
    role: "طراح تجربه کاربری آموزشی",
    bio: "متخصص در طراحی تجربه کاربری برای سیستم‌های آموزشی با تمرکز بر افزایش تعامل و بهبود یادگیری از طریق رابط کاربری.",
    avatar: "https://randomuser.me/api/portraits/women/79.jpg",
    subjects: ["طراحی تجربه کاربری", "آموزش تعاملی"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "n.kazemi@parsamooz.ir",
    },
  },
];

export default function TeachersSection() {
  return (
    <section id="teachers" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">
            تیم آموزشی
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            با متخصصان ما آشنا شوید
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            تیمی از بهترین متخصصان آموزشی و مشاوران تحصیلی در پارسا موز به ارائه
            خدمات می‌پردازند.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher, index) => (
            <motion.div
              key={teacher.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="p-6">
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-50 mb-4">
                    <Image
                      src={teacher.avatar}
                      alt={teacher.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {teacher.name}
                  </h3>
                  <p className="text-indigo-600 font-medium">{teacher.role}</p>
                </div>

                <p className="mt-4 text-gray-600 text-center">{teacher.bio}</p>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center justify-center">
                    <AcademicCapIcon className="w-4 h-4 ml-1" /> تخصص‌ها
                  </h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {teacher.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-center space-x-3 rtl:space-x-reverse">
                  <a
                    href={teacher.social.linkedin}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a
                    href={teacher.social.twitter}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a
                    href={`mailto:${teacher.social.email}`}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </a>
                </div>
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
          <a
            href="/team"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium"
          >
            مشاهده همه اساتید و متخصصین
            <svg
              className="ml-2 h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
