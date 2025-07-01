"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  AcademicCapIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import LandingNavbar from "@/components/landing/LandingNavbar";

interface Teacher {
  id: number;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  subjects: string[];
  social: {
    linkedin: string;
    twitter: string;
    email: string;
  };
}

interface TeachersContent {
  title: string;
  subtitle: string;
  description: string;
  teachers: Teacher[];
  linkText: string;
  linkUrl: string;
  isVisible: boolean;
  backgroundColor: string;
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  cardBackgroundColor: string;
  nameColor: string;
  roleColor: string;
  bioColor: string;
  subjectsBackgroundColor: string;
  subjectsTextColor: string;
  socialIconColor: string;
  socialIconHoverColor: string;
  linkColor: string;
}

const defaultTeachersContent: TeachersContent = {
  title: "تیم آموزشی",
  subtitle: "با متخصصان ما آشنا شوید",
  description:
    "تیمی از بهترین متخصصان آموزشی و مشاوران تحصیلی در پارسا موز به ارائه خدمات می‌پردازند.",
  teachers: [
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
  ],
  linkText: "مشاهده همه اساتید و متخصصین",
  linkUrl: "/team",
  isVisible: true,
  backgroundColor: "#F9FAFB",
  titleColor: "#4F46E5",
  subtitleColor: "#111827",
  descriptionColor: "#6B7280",
  cardBackgroundColor: "#FFFFFF",
  nameColor: "#111827",
  roleColor: "#4F46E5",
  bioColor: "#6B7280",
  subjectsBackgroundColor: "#EEF2FF",
  subjectsTextColor: "#4F46E5",
  socialIconColor: "#9CA3AF",
  socialIconHoverColor: "#4F46E5",
  linkColor: "#4F46E5",
};

export default function TeamPage() {
  const [content, setContent] = useState<TeachersContent>(
    defaultTeachersContent
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeachersContent();
  }, []);

  const fetchTeachersContent = async () => {
    try {
      const response = await fetch("/api/admin/teachers");
      const data = await response.json();

      if (data.success) {
        setContent(data.teachers);
      } else {
        setContent(defaultTeachersContent);
      }
    } catch (error) {
      console.error("Error fetching teachers content:", error);
      setContent(defaultTeachersContent);
    } finally {
      setIsLoading(false);
    }
  };

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

            {/* Teachers Grid Skeleton */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(9)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-8 animate-pulse"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-40 h-40 bg-gray-200 rounded-full mb-6"></div>
                    <div className="h-7 bg-gray-200 rounded w-32 mb-3"></div>
                    <div className="h-5 bg-gray-200 rounded w-40 mb-6"></div>
                  </div>
                  <div className="h-20 bg-gray-200 rounded mb-6"></div>
                  <div className="flex justify-center gap-2 mb-6">
                    <div className="h-7 bg-gray-200 rounded w-20"></div>
                    <div className="h-7 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="flex justify-center gap-4">
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
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
                <span className="text-gray-900 font-medium">تیم آموزشی</span>
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
        </div>
      </section>

      {/* Teachers Grid */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {content.teachers.map((teacher, index) => (
              <motion.div
                key={teacher.id}
                className="rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ backgroundColor: content.cardBackgroundColor }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="p-8">
                  {/* Avatar and Basic Info */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-indigo-100 mb-6 shadow-lg">
                      <Image
                        src={teacher.avatar}
                        alt={teacher.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3
                      className="text-2xl font-bold text-center mb-2"
                      style={{ color: content.nameColor }}
                    >
                      {teacher.name}
                    </h3>
                    <p
                      className="text-lg font-medium text-center"
                      style={{ color: content.roleColor }}
                    >
                      {teacher.role}
                    </p>
                  </div>

                  {/* Bio */}
                  <div className="mb-6">
                    <p
                      className="text-center leading-relaxed"
                      style={{ color: content.bioColor }}
                    >
                      {teacher.bio}
                    </p>
                  </div>

                  {/* Subjects */}
                  <div className="mb-6">
                    <h4
                      className="text-sm font-semibold mb-3 flex items-center justify-center"
                      style={{ color: content.nameColor }}
                    >
                      <AcademicCapIcon className="w-4 h-4 ml-2" />
                      تخصص‌ها
                    </h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {teacher.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="inline-block text-sm font-medium px-3 py-1.5 rounded-full"
                          style={{
                            backgroundColor: content.subjectsBackgroundColor,
                            color: content.subjectsTextColor,
                          }}
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex justify-center space-x-4 rtl:space-x-reverse">
                    <a
                      href={teacher.social.linkedin}
                      className="p-2 rounded-full border transition-all duration-200 hover:scale-110"
                      style={{
                        color: content.socialIconColor,
                        borderColor: content.socialIconColor + "30",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color =
                          content.socialIconHoverColor;
                        e.currentTarget.style.borderColor =
                          content.socialIconHoverColor;
                        e.currentTarget.style.backgroundColor =
                          content.socialIconHoverColor + "10";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = content.socialIconColor;
                        e.currentTarget.style.borderColor =
                          content.socialIconColor + "30";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      title="LinkedIn"
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
                      className="p-2 rounded-full border transition-all duration-200 hover:scale-110"
                      style={{
                        color: content.socialIconColor,
                        borderColor: content.socialIconColor + "30",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color =
                          content.socialIconHoverColor;
                        e.currentTarget.style.borderColor =
                          content.socialIconHoverColor;
                        e.currentTarget.style.backgroundColor =
                          content.socialIconHoverColor + "10";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = content.socialIconColor;
                        e.currentTarget.style.borderColor =
                          content.socialIconColor + "30";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      title="Twitter"
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
                      className="p-2 rounded-full border transition-all duration-200 hover:scale-110"
                      style={{
                        color: content.socialIconColor,
                        borderColor: content.socialIconColor + "30",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color =
                          content.socialIconHoverColor;
                        e.currentTarget.style.borderColor =
                          content.socialIconHoverColor;
                        e.currentTarget.style.backgroundColor =
                          content.socialIconHoverColor + "10";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = content.socialIconColor;
                        e.currentTarget.style.borderColor =
                          content.socialIconColor + "30";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      title="ایمیل"
                    >
                      <EnvelopeIcon className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                آیا علاقه‌مند به همکاری با ما هستید؟
              </h3>
              <p className="text-gray-600 mb-6">
                اگر تجربه و تخصص آموزشی دارید و می‌خواهید بخشی از تیم ما باشید،
                از طریق راه‌های ارتباطی با ما در تماس باشید.
              </p>
              <Link
                href="/#contact"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-colors hover:scale-105 transform duration-200"
                style={{
                  backgroundColor: content.linkColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    content.socialIconHoverColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = content.linkColor;
                }}
              >
                تماس با ما
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
