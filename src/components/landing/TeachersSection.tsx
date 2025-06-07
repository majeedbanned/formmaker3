"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { AcademicCapIcon, CogIcon } from "@heroicons/react/24/outline";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import TeachersEditModal from "@/components/modals/TeachersEditModal";

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

export default function TeachersSection() {
  const { isAuthenticated, user } = usePublicAuth();
  const [content, setContent] = useState<TeachersContent>(
    defaultTeachersContent
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

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

  const handleSave = async (updatedContent: TeachersContent) => {
    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedContent),
      });

      const data = await response.json();

      if (data.success) {
        setContent(updatedContent);
        toast.success("تغییرات با موفقیت ذخیره شد");
      } else {
        toast.error("خطا در ذخیره تغییرات");
      }
    } catch (error) {
      console.error("Error saving teachers content:", error);
      toast.error("خطا در ذخیره تغییرات");
    }
  };

  if (isLoading) {
    return (
      <section id="teachers" className="py-24 bg-gray-50" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-80 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 animate-pulse"
              >
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                </div>
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-center gap-2 mb-4">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="flex justify-center gap-3">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If not visible and not admin, return null
  if (!content.isVisible && !isSchoolAdmin) {
    return null;
  }

  // Admin placeholder when content is hidden
  if (!content.isVisible && isSchoolAdmin) {
    return (
      <section
        id="teachers"
        className="py-24 relative"
        style={{ backgroundColor: content.backgroundColor }}
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-2 border-dashed border-yellow-400 bg-yellow-50/50 rounded-lg p-12 text-center">
            <CogIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              بخش تیم آموزشی (مخفی)
            </h3>
            <p className="text-yellow-700 mb-4">
              این بخش در حالت مخفی قرار دارد و برای بازدیدکنندگان نمایش داده
              نمی‌شود.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
            >
              تنظیمات بخش
            </button>
          </div>
        </div>
        <TeachersEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          currentContent={content}
        />
      </section>
    );
  }

  return (
    <section
      id="teachers"
      className="py-24 relative"
      style={{ backgroundColor: content.backgroundColor }}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Settings Button */}
        {isSchoolAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all z-10"
            title="تنظیمات بخش تیم آموزشی"
          >
            <CogIcon className="w-5 h-5" />
          </button>
        )}

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-base font-semibold tracking-wide uppercase"
            style={{ color: content.titleColor }}
          >
            {content.title}
          </h2>
          <p
            className="mt-2 text-3xl font-extrabold sm:text-4xl"
            style={{ color: content.subtitleColor }}
          >
            {content.subtitle}
          </p>
          <p
            className="mt-4 max-w-2xl text-xl mx-auto"
            style={{ color: content.descriptionColor }}
          >
            {content.description}
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {content.teachers.map((teacher, index) => (
            <motion.div
              key={teacher.id}
              className="rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              style={{ backgroundColor: content.cardBackgroundColor }}
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
                  <h3
                    className="text-xl font-bold"
                    style={{ color: content.nameColor }}
                  >
                    {teacher.name}
                  </h3>
                  <p
                    className="font-medium"
                    style={{ color: content.roleColor }}
                  >
                    {teacher.role}
                  </p>
                </div>

                <p
                  className="mt-4 text-center"
                  style={{ color: content.bioColor }}
                >
                  {teacher.bio}
                </p>

                <div className="mt-6">
                  <h4
                    className="text-sm font-semibold mb-2 flex items-center justify-center"
                    style={{ color: content.nameColor }}
                  >
                    <AcademicCapIcon className="w-4 h-4 mr-1" /> تخصص‌ها
                  </h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {teacher.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="inline-block text-xs font-medium px-2.5 py-0.5 rounded"
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

                <div className="mt-6 flex justify-center space-x-3 rtl:space-x-reverse">
                  <a
                    href={teacher.social.linkedin}
                    className="transition-colors"
                    style={
                      {
                        color: content.socialIconColor,
                        "--hover-color": content.socialIconHoverColor,
                      } as React.CSSProperties
                    }
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color =
                        content.socialIconHoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = content.socialIconColor;
                    }}
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
                    className="transition-colors"
                    style={{ color: content.socialIconColor }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color =
                        content.socialIconHoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = content.socialIconColor;
                    }}
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
                    className="transition-colors"
                    style={{ color: content.socialIconColor }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color =
                        content.socialIconHoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = content.socialIconColor;
                    }}
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
            href={content.linkUrl}
            className="inline-flex items-center font-medium"
            style={{ color: content.linkColor }}
          >
            {content.linkText}
            <svg
              className="mr-2 h-5 w-5"
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

      <TeachersEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        currentContent={content}
      />
    </section>
  );
}
