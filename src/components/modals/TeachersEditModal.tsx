"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  TrashIcon,
  AcademicCapIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

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

interface TeachersEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: TeachersContent) => void;
  currentContent: TeachersContent;
}

const colorPresets = [
  {
    name: "آبی",
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
  },
  {
    name: "سبز",
    backgroundColor: "#F0FDF4",
    titleColor: "#059669",
    subtitleColor: "#111827",
    descriptionColor: "#6B7280",
    cardBackgroundColor: "#FFFFFF",
    nameColor: "#111827",
    roleColor: "#059669",
    bioColor: "#6B7280",
    subjectsBackgroundColor: "#DCFCE7",
    subjectsTextColor: "#059669",
    socialIconColor: "#9CA3AF",
    socialIconHoverColor: "#059669",
    linkColor: "#059669",
  },
  {
    name: "قرمز",
    backgroundColor: "#FEF2F2",
    titleColor: "#DC2626",
    subtitleColor: "#111827",
    descriptionColor: "#6B7280",
    cardBackgroundColor: "#FFFFFF",
    nameColor: "#111827",
    roleColor: "#DC2626",
    bioColor: "#6B7280",
    subjectsBackgroundColor: "#FEE2E2",
    subjectsTextColor: "#DC2626",
    socialIconColor: "#9CA3AF",
    socialIconHoverColor: "#DC2626",
    linkColor: "#DC2626",
  },
  {
    name: "بنفش",
    backgroundColor: "#FAF5FF",
    titleColor: "#7C3AED",
    subtitleColor: "#111827",
    descriptionColor: "#6B7280",
    cardBackgroundColor: "#FFFFFF",
    nameColor: "#111827",
    roleColor: "#7C3AED",
    bioColor: "#6B7280",
    subjectsBackgroundColor: "#EDE9FE",
    subjectsTextColor: "#7C3AED",
    socialIconColor: "#9CA3AF",
    socialIconHoverColor: "#7C3AED",
    linkColor: "#7C3AED",
  },
];

export default function TeachersEditModal({
  isOpen,
  onClose,
  onSave,
  currentContent,
}: TeachersEditModalProps) {
  const [activeTab, setActiveTab] = useState("content");
  const [content, setContent] = useState<TeachersContent>(currentContent);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setContent(currentContent);
  }, [currentContent]);

  const handleSave = () => {
    if (
      !content.title.trim() ||
      !content.subtitle.trim() ||
      !content.description.trim()
    ) {
      toast.error("لطفا تمام فیلدهای ضروری را پر کنید");
      return;
    }

    onSave(content);
    onClose();
  };

  const handleAddTeacher = () => {
    const newTeacher: Teacher = {
      id: Date.now(),
      name: "",
      role: "",
      bio: "",
      avatar: "",
      subjects: [],
      social: {
        linkedin: "#",
        twitter: "#",
        email: "",
      },
    };
    setContent({
      ...content,
      teachers: [...content.teachers, newTeacher],
    });
  };

  const handleDeleteTeacher = (id: number) => {
    setContent({
      ...content,
      teachers: content.teachers.filter((teacher) => teacher.id !== id),
    });
  };

  const handleTeacherUpdate = (
    id: number,
    updatedTeacher: Partial<Teacher>
  ) => {
    setContent({
      ...content,
      teachers: content.teachers.map((teacher) =>
        teacher.id === id ? { ...teacher, ...updatedTeacher } : teacher
      ),
    });
  };

  const handleSubjectAdd = (teacherId: number, subject: string) => {
    if (!subject.trim()) return;

    const teacher = content.teachers.find((t) => t.id === teacherId);
    if (teacher && !teacher.subjects.includes(subject)) {
      handleTeacherUpdate(teacherId, {
        subjects: [...teacher.subjects, subject],
      });
    }
  };

  const handleSubjectRemove = (teacherId: number, subject: string) => {
    const teacher = content.teachers.find((t) => t.id === teacherId);
    if (teacher) {
      handleTeacherUpdate(teacherId, {
        subjects: teacher.subjects.filter((s) => s !== subject),
      });
    }
  };

  const handleImageUpload = async (teacherId: number, file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/teacher-images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data && data.success) {
        handleTeacherUpdate(teacherId, { avatar: data.url });
        toast.success("تصویر با موفقیت آپلود شد");
      } else {
        toast.error(data.message || "خطا در آپلود تصویر");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("خطا در آپلود تصویر");
    } finally {
      setIsUploading(false);
    }
  };

  const applyColorPreset = (preset: (typeof colorPresets)[0]) => {
    setContent({
      ...content,
      ...preset,
    });
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "content", label: "محتوا" },
    { id: "teachers", label: "اساتید" },
    { id: "appearance", label: "ظاهر" },
    { id: "links", label: "لینک‌ها" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir="rtl"
    >
      <motion.div
        className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              ویرایش بخش تیم آموزشی
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === tab.id
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  محتوای بخش
                </h3>
                <button
                  onClick={() =>
                    setContent({ ...content, isVisible: !content.isVisible })
                  }
                  className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-md ${
                    content.isVisible
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {content.isVisible ? (
                    <EyeIcon className="w-4 h-4" />
                  ) : (
                    <EyeSlashIcon className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {content.isVisible ? "نمایش" : "مخفی"}
                  </span>
                </button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان بالا
                  </label>
                  <input
                    type="text"
                    value={content.title}
                    onChange={(e) =>
                      setContent({ ...content, title: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="تیم آموزشی"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان اصلی
                  </label>
                  <input
                    type="text"
                    value={content.subtitle}
                    onChange={(e) =>
                      setContent({ ...content, subtitle: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="با متخصصان ما آشنا شوید"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={content.description}
                    onChange={(e) =>
                      setContent({ ...content, description: e.target.value })
                    }
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="تیمی از بهترین متخصصان آموزشی..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Teachers Tab */}
          {activeTab === "teachers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  مدیریت اساتید
                </h3>
                <button
                  onClick={handleAddTeacher}
                  className="flex items-center space-x-2 rtl:space-x-reverse bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>افزودن استاد</span>
                </button>
              </div>

              <div className="space-y-6">
                {content.teachers.map((teacher, index) => (
                  <div
                    key={teacher.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        استاد {index + 1}
                      </h4>
                      <button
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          نام
                        </label>
                        <input
                          type="text"
                          value={teacher.name}
                          onChange={(e) =>
                            handleTeacherUpdate(teacher.id, {
                              name: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="نام استاد"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          نقش
                        </label>
                        <input
                          type="text"
                          value={teacher.role}
                          onChange={(e) =>
                            handleTeacherUpdate(teacher.id, {
                              role: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="مدیر آموزشی"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        بیوگرافی
                      </label>
                      <textarea
                        value={teacher.bio}
                        onChange={(e) =>
                          handleTeacherUpdate(teacher.id, {
                            bio: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="بیوگرافی استاد..."
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تصویر استاد
                      </label>
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        {teacher.avatar && (
                          <img
                            src={teacher.avatar}
                            alt={teacher.name}
                            className="w-16 h-16 rounded-full object-cover border"
                            onError={(e) => {
                              console.error("Failed to load teacher avatar preview:", teacher.avatar);
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(teacher.id, file);
                              }
                            }}
                            className="hidden"
                            id={`teacher-image-${teacher.id}`}
                          />
                          <label
                            htmlFor={`teacher-image-${teacher.id}`}
                            className="cursor-pointer inline-flex items-center space-x-2 rtl:space-x-reverse bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm"
                          >
                            <PhotoIcon className="w-4 h-4" />
                            <span>
                              {isUploading ? "در حال آپلود..." : "انتخاب تصویر"}
                            </span>
                          </label>
                        </div>
                      </div>
                      <input
                        type="url"
                        value={teacher.avatar}
                        onChange={(e) =>
                          handleTeacherUpdate(teacher.id, {
                            avatar: e.target.value,
                          })
                        }
                        className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="یا لینک تصویر را وارد کنید"
                      />
                    </div>

                    {/* Subjects */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تخصص‌ها
                      </label>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {teacher.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="inline-flex items-center bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded"
                            >
                              {subject}
                              <button
                                onClick={() =>
                                  handleSubjectRemove(teacher.id, subject)
                                }
                                className="mr-1 text-indigo-600 hover:text-indigo-800"
                              >
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          <input
                            type="text"
                            placeholder="تخصص جدید"
                            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                const input = e.target as HTMLInputElement;
                                handleSubjectAdd(teacher.id, input.value);
                                input.value = "";
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = (e.target as HTMLButtonElement)
                                .previousElementSibling as HTMLInputElement;
                              handleSubjectAdd(teacher.id, input.value);
                              input.value = "";
                            }}
                            className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        شبکه‌های اجتماعی
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={teacher.social.email}
                          onChange={(e) =>
                            handleTeacherUpdate(teacher.id, {
                              social: {
                                ...teacher.social,
                                email: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="ایمیل"
                        />
                        <input
                          type="text"
                          value={teacher.social.linkedin}
                          onChange={(e) =>
                            handleTeacherUpdate(teacher.id, {
                              social: {
                                ...teacher.social,
                                linkedin: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="LinkedIn"
                        />
                        <input
                          type="text"
                          value={teacher.social.twitter}
                          onChange={(e) =>
                            handleTeacherUpdate(teacher.id, {
                              social: {
                                ...teacher.social,
                                twitter: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Twitter"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                تنظیمات ظاهری
              </h3>

              {/* Color Presets */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  طرح‌های رنگی آماده
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyColorPreset(preset)}
                      className="p-3 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.titleColor }}
                        />
                        <span className="text-sm font-medium">
                          {preset.name}
                        </span>
                      </div>
                      <div className="flex space-x-1 rtl:space-x-reverse">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: preset.backgroundColor }}
                        />
                        <div
                          className="w-3 h-3 rounded"
                          style={{
                            backgroundColor: preset.cardBackgroundColor,
                          }}
                        />
                        <div
                          className="w-3 h-3 rounded"
                          style={{
                            backgroundColor: preset.subjectsBackgroundColor,
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Colors */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  رنگ‌های پس‌زمینه
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      پس‌زمینه بخش
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.backgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            backgroundColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.backgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            backgroundColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      پس‌زمینه کارت‌ها
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.cardBackgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            cardBackgroundColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.cardBackgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            cardBackgroundColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Colors */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  رنگ‌های متن
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      عنوان بالا
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.titleColor}
                        onChange={(e) =>
                          setContent({ ...content, titleColor: e.target.value })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.titleColor}
                        onChange={(e) =>
                          setContent({ ...content, titleColor: e.target.value })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      عنوان اصلی
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.subtitleColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            subtitleColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.subtitleColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            subtitleColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      توضیحات
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.descriptionColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            descriptionColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.descriptionColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            descriptionColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      نام استاد
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.nameColor}
                        onChange={(e) =>
                          setContent({ ...content, nameColor: e.target.value })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.nameColor}
                        onChange={(e) =>
                          setContent({ ...content, nameColor: e.target.value })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      نقش استاد
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.roleColor}
                        onChange={(e) =>
                          setContent({ ...content, roleColor: e.target.value })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.roleColor}
                        onChange={(e) =>
                          setContent({ ...content, roleColor: e.target.value })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      بیوگرافی
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.bioColor}
                        onChange={(e) =>
                          setContent({ ...content, bioColor: e.target.value })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.bioColor}
                        onChange={(e) =>
                          setContent({ ...content, bioColor: e.target.value })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Colors */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  رنگ‌های تخصص‌ها
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      پس‌زمینه تخصص‌ها
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.subjectsBackgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            subjectsBackgroundColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.subjectsBackgroundColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            subjectsBackgroundColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      متن تخصص‌ها
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.subjectsTextColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            subjectsTextColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.subjectsTextColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            subjectsTextColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Icon Colors */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  رنگ‌های آیکون‌های اجتماعی
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      رنگ عادی
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.socialIconColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            socialIconColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.socialIconColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            socialIconColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      رنگ هاور
                    </label>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={content.socialIconHoverColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            socialIconHoverColor: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={content.socialIconHoverColor}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            socialIconHoverColor: e.target.value,
                          })
                        }
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Links Tab */}
          {activeTab === "links" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                تنظیمات لینک
              </h3>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    متن لینک
                  </label>
                  <input
                    type="text"
                    value={content.linkText}
                    onChange={(e) =>
                      setContent({ ...content, linkText: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="مشاهده همه اساتید و متخصصین"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL لینک
                  </label>
                  <input
                    type="text"
                    value={content.linkUrl}
                    onChange={(e) =>
                      setContent({ ...content, linkUrl: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="/team"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رنگ لینک
                  </label>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <input
                      type="color"
                      value={content.linkColor}
                      onChange={(e) =>
                        setContent({ ...content, linkColor: e.target.value })
                      }
                      className="w-10 h-10 rounded border"
                    />
                    <input
                      type="text"
                      value={content.linkColor}
                      onChange={(e) =>
                        setContent({ ...content, linkColor: e.target.value })
                      }
                      className="flex-1 p-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 rtl:space-x-reverse p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            ذخیره تغییرات
          </button>
        </div>
      </motion.div>
    </div>
  );
}
