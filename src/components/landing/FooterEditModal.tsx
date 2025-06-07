"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

interface SocialLink {
  name: string;
  url: string;
  icon: string; // SVG string
}

interface FooterLink {
  name: string;
  href: string;
}

interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

interface FooterData {
  // Company info
  companyName: string;
  companyDescription: string;
  logoText: string;

  // Links
  linkGroups: FooterLinkGroup[];

  // Newsletter
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterButtonText: string;
  newsletterPlaceholder: string;

  // Social links
  socialLinks: SocialLink[];

  // Copyright
  copyrightText: string;

  // Visibility
  isVisible: boolean;

  // Appearance
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  linkHoverColor: string;
  logoBackgroundColor: string;
  logoTextColor: string;
  buttonColor: string;
  buttonTextColor: string;
  inputBackgroundColor: string;
  inputTextColor: string;
  borderColor: string;
}

interface FooterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FooterData) => void;
  initialData: FooterData;
}

export default function FooterEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: FooterEditModalProps) {
  const [formData, setFormData] = useState<FooterData>(initialData);
  const [loading, setLoading] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "content" | "appearance" | "links"
  >("content");

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      const timer = setTimeout(() => setIsModalReady(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsModalReady(false);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalReady) {
        handleCloseClick();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isModalReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      handleCloseClick();
    } catch (error) {
      console.error("Error saving footer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseClick = () => {
    onClose();
  };

  const addLinkGroup = () => {
    setFormData({
      ...formData,
      linkGroups: [
        ...formData.linkGroups,
        { title: "", links: [{ name: "", href: "" }] },
      ],
    });
  };

  const removeLinkGroup = (groupIndex: number) => {
    setFormData({
      ...formData,
      linkGroups: formData.linkGroups.filter((_, i) => i !== groupIndex),
    });
  };

  const updateLinkGroup = (
    groupIndex: number,
    field: keyof FooterLinkGroup,
    value: any
  ) => {
    const newGroups = [...formData.linkGroups];
    newGroups[groupIndex] = { ...newGroups[groupIndex], [field]: value };
    setFormData({ ...formData, linkGroups: newGroups });
  };

  const addLinkToGroup = (groupIndex: number) => {
    const newGroups = [...formData.linkGroups];
    newGroups[groupIndex].links.push({ name: "", href: "" });
    setFormData({ ...formData, linkGroups: newGroups });
  };

  const removeLinkFromGroup = (groupIndex: number, linkIndex: number) => {
    const newGroups = [...formData.linkGroups];
    newGroups[groupIndex].links = newGroups[groupIndex].links.filter(
      (_, i) => i !== linkIndex
    );
    setFormData({ ...formData, linkGroups: newGroups });
  };

  const updateLink = (
    groupIndex: number,
    linkIndex: number,
    field: keyof FooterLink,
    value: string
  ) => {
    const newGroups = [...formData.linkGroups];
    newGroups[groupIndex].links[linkIndex] = {
      ...newGroups[groupIndex].links[linkIndex],
      [field]: value,
    };
    setFormData({ ...formData, linkGroups: newGroups });
  };

  const addSocialLink = () => {
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { name: "", url: "", icon: "" }],
    });
  };

  const removeSocialLink = (index: number) => {
    setFormData({
      ...formData,
      socialLinks: formData.socialLinks.filter((_, i) => i !== index),
    });
  };

  const updateSocialLink = (
    index: number,
    field: keyof SocialLink,
    value: string
  ) => {
    const newLinks = [...formData.socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, socialLinks: newLinks });
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "content", label: "محتوا", icon: DocumentTextIcon },
    { id: "appearance", label: "ظاهر", icon: PaintBrushIcon },
    { id: "links", label: "لینک‌ها", icon: LinkIcon },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      dir="rtl"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">ویرایش فوتر</h2>
            <button
              onClick={handleCloseClick}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-6 pb-0">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-reverse space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              {/* Visibility Toggle */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) =>
                      setFormData({ ...formData, isVisible: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    نمایش فوتر در صفحه
                  </span>
                </label>
              </div>

              {/* Content Tab */}
              {activeTab === "content" && (
                <div className="space-y-6">
                  {/* Company Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      اطلاعات شرکت
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          نام شرکت *
                        </label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              companyName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          متن لوگو
                        </label>
                        <input
                          type="text"
                          value={formData.logoText}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              logoText: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        توضیحات شرکت
                      </label>
                      <textarea
                        rows={3}
                        value={formData.companyDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            companyDescription: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Newsletter Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      خبرنامه
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          عنوان خبرنامه
                        </label>
                        <input
                          type="text"
                          value={formData.newsletterTitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              newsletterTitle: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          متن دکمه خبرنامه
                        </label>
                        <input
                          type="text"
                          value={formData.newsletterButtonText}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              newsletterButtonText: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        توضیحات خبرنامه
                      </label>
                      <textarea
                        rows={2}
                        value={formData.newsletterDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newsletterDescription: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        متن placeholder ایمیل
                      </label>
                      <input
                        type="text"
                        value={formData.newsletterPlaceholder}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newsletterPlaceholder: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Copyright */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      کپی‌رایت
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        متن کپی‌رایت
                      </label>
                      <input
                        type="text"
                        value={formData.copyrightText}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            copyrightText: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="© 2024 شرکت شما. تمامی حقوق محفوظ است."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  {/* Color Presets */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      قالب‌های رنگی
                    </h3>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            backgroundColor: "#111827",
                            textColor: "#FFFFFF",
                            linkColor: "#9CA3AF",
                            linkHoverColor: "#6366F1",
                            logoBackgroundColor: "#6366F1",
                            logoTextColor: "#FFFFFF",
                            buttonColor: "#6366F1",
                            buttonTextColor: "#FFFFFF",
                            inputBackgroundColor: "#1F2937",
                            inputTextColor: "#FFFFFF",
                            borderColor: "#374151",
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        تیره کلاسیک
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            backgroundColor: "#0F172A",
                            textColor: "#F1F5F9",
                            linkColor: "#94A3B8",
                            linkHoverColor: "#3B82F6",
                            logoBackgroundColor: "#3B82F6",
                            logoTextColor: "#FFFFFF",
                            buttonColor: "#3B82F6",
                            buttonTextColor: "#FFFFFF",
                            inputBackgroundColor: "#1E293B",
                            inputTextColor: "#F1F5F9",
                            borderColor: "#334155",
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        آبی تجاری
                      </button>
                    </div>
                  </div>

                  {/* Color Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Background Colors */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        رنگ‌های پس‌زمینه
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ پس‌زمینه اصلی
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.backgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  backgroundColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.backgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  backgroundColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ پس‌زمینه لوگو
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.logoBackgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  logoBackgroundColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.logoBackgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  logoBackgroundColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Text Colors */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        رنگ‌های متن
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ متن اصلی
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.textColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  textColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.textColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  textColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ لینک‌ها
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.linkColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  linkColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.linkColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  linkColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ لینک در حالت hover
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.linkHoverColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  linkHoverColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.linkHoverColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  linkHoverColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Button and Input Colors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        رنگ‌های دکمه
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ پس‌زمینه دکمه
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.buttonColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  buttonColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.buttonColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  buttonColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ متن دکمه
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.buttonTextColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  buttonTextColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.buttonTextColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  buttonTextColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        رنگ‌های فیلد ورودی
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ پس‌زمینه فیلد
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.inputBackgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  inputBackgroundColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.inputBackgroundColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  inputBackgroundColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رنگ متن فیلد
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.inputTextColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  inputTextColor: e.target.value,
                                })
                              }
                              className="w-12 h-10 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={formData.inputTextColor}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  inputTextColor: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Links Tab */}
              {activeTab === "links" && (
                <div className="space-y-6">
                  {/* Footer Link Groups */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        گروه‌های لینک
                      </h3>
                      <button
                        type="button"
                        onClick={addLinkGroup}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200"
                      >
                        <PlusIcon className="h-4 w-4" />
                        افزودن گروه
                      </button>
                    </div>

                    <div className="space-y-6">
                      {formData.linkGroups.map((group, groupIndex) => (
                        <div
                          key={groupIndex}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-medium text-gray-700">
                              گروه {groupIndex + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeLinkGroup(groupIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              عنوان گروه
                            </label>
                            <input
                              type="text"
                              value={group.title}
                              onChange={(e) =>
                                updateLinkGroup(
                                  groupIndex,
                                  "title",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-gray-700">
                                لینک‌ها
                              </label>
                              <button
                                type="button"
                                onClick={() => addLinkToGroup(groupIndex)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                + افزودن لینک
                              </button>
                            </div>

                            {group.links.map((link, linkIndex) => (
                              <div
                                key={linkIndex}
                                className="flex gap-2 items-center"
                              >
                                <input
                                  type="text"
                                  placeholder="نام لینک"
                                  value={link.name}
                                  onChange={(e) =>
                                    updateLink(
                                      groupIndex,
                                      linkIndex,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                <input
                                  type="text"
                                  placeholder="آدرس لینک"
                                  value={link.href}
                                  onChange={(e) =>
                                    updateLink(
                                      groupIndex,
                                      linkIndex,
                                      "href",
                                      e.target.value
                                    )
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeLinkFromGroup(groupIndex, linkIndex)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        لینک‌های اجتماعی
                      </h3>
                      <button
                        type="button"
                        onClick={addSocialLink}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200"
                      >
                        <PlusIcon className="h-4 w-4" />
                        افزودن لینک اجتماعی
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.socialLinks.map((social, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-md font-medium text-gray-700">
                              لینک {index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeSocialLink(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                نام شبکه اجتماعی
                              </label>
                              <input
                                type="text"
                                value={social.name}
                                onChange={(e) =>
                                  updateSocialLink(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Instagram"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                آدرس لینک
                              </label>
                              <input
                                type="url"
                                value={social.url}
                                onChange={(e) =>
                                  updateSocialLink(index, "url", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://instagram.com/yourpage"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              SVG آیکون
                            </label>
                            <textarea
                              rows={3}
                              value={social.icon}
                              onChange={(e) =>
                                updateSocialLink(index, "icon", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="<svg>...</svg>"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 space-x-reverse mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseClick}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  لغو
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
