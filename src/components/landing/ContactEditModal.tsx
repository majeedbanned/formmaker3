"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  EnvelopeIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface ContactInfo {
  phone: string;
  phoneDesc: string;
  email: string;
  emailDesc: string;
  address: string;
  postalCode: string;
}

interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

interface ContactMessage {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface ContactData {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionDescription: string;
  contactInfo: ContactInfo;
  socialLinks: SocialLink[];
  formTitle: string;
  formDescription: string;
  isVisible: boolean;
  sectionTitleColor: string;
  sectionSubtitleColor: string;
  sectionDescriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  contactInfoTextColor: string;
  contactInfoIconColor: string;
  formBgColor: string;
  formTextColor: string;
  formButtonColor: string;
  formButtonTextColor: string;
}

interface ContactEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ContactData) => void;
  initialData: ContactData;
}

export default function ContactEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ContactEditModalProps) {
  const [formData, setFormData] = useState<ContactData>(initialData);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "appearance" | "messages">("content");
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      if (activeTab === "messages") {
        fetchContactMessages();
      }
    }
  }, [isOpen, initialData, activeTab]);

  const fetchContactMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await fetch("/api/admin/contact-messages", {
        headers: {
          "x-domain": window.location.hostname,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setContactMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching contact messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.hostname,
        },
        body: JSON.stringify({ isRead: true }),
      });
      setContactMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "x-domain": window.location.hostname,
        },
      });
      setContactMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving contact data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof ContactData | string,
    value: string | boolean
  ) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ContactData] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const addSocialLink = () => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: [
        ...prev.socialLinks,
        { name: "", url: "", icon: "" },
      ],
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  if (!isOpen) return null;  const tabs = [
    { id: "content", label: "محتوا", icon: DocumentTextIcon },
    { id: "appearance", label: "ظاهر", icon: PaintBrushIcon },
    { id: "messages", label: "پیام‌ها", icon: EnvelopeIcon },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              تنظیمات بخش تماس با ما
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 space-x-reverse px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 space-x-reverse ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <form onSubmit={handleSubmit} className="p-6">              {/* Visibility Toggle */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center space-x-3 space-x-reverse">
                  <div className="relative inline-block w-10 h-6">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) => handleInputChange("isVisible", e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`block w-10 h-6 rounded-full transition-colors ${
                        formData.isVisible
                          ? "bg-gradient-to-r from-green-400 to-blue-500"
                          : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`dot absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          formData.isVisible ? "transform translate-x-4" : ""
                        }`}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    نمایش این بخش در سایت
                  </span>
                </label>
              </div>

              {/* Content Tab */}
              {activeTab === "content" && (
                <div className="space-y-6">
                  {/* Section Content */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">محتوای بخش</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عنوان بخش
                      </label>
                      <input
                        type="text"
                        value={formData.sectionTitle}
                        onChange={(e) => handleInputChange("sectionTitle", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        زیرعنوان بخش
                      </label>
                      <input
                        type="text"
                        value={formData.sectionSubtitle}
                        onChange={(e) => handleInputChange("sectionSubtitle", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        توضیحات بخش
                      </label>
                      <textarea
                        value={formData.sectionDescription}
                        onChange={(e) => handleInputChange("sectionDescription", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">اطلاعات تماس</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          شماره تلفن
                        </label>
                        <input
                          type="text"
                          value={formData.contactInfo.phone}
                          onChange={(e) => handleInputChange("contactInfo.phone", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          توضیح تلفن
                        </label>
                        <input
                          type="text"
                          value={formData.contactInfo.phoneDesc}
                          onChange={(e) => handleInputChange("contactInfo.phoneDesc", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ایمیل
                        </label>
                        <input
                          type="email"
                          value={formData.contactInfo.email}
                          onChange={(e) => handleInputChange("contactInfo.email", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          توضیح ایمیل
                        </label>
                        <input
                          type="text"
                          value={formData.contactInfo.emailDesc}
                          onChange={(e) => handleInputChange("contactInfo.emailDesc", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          آدرس
                        </label>
                        <textarea
                          value={formData.contactInfo.address}
                          onChange={(e) => handleInputChange("contactInfo.address", e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          کد پستی
                        </label>
                        <input
                          type="text"
                          value={formData.contactInfo.postalCode}
                          onChange={(e) => handleInputChange("contactInfo.postalCode", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">شبکه‌های اجتماعی</h3>
                      <button
                        type="button"
                        onClick={addSocialLink}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PlusIcon className="h-4 w-4 ml-1" />
                        افزودن لینک
                      </button>
                    </div>
                    
                    {formData.socialLinks.map((link, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            نام
                          </label>
                          <input
                            type="text"
                            value={link.name}
                            onChange={(e) => updateSocialLink(index, "name", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            لینک
                          </label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SVG آیکون
                          </label>
                          <textarea
                            value={link.icon}
                            onChange={(e) => updateSocialLink(index, "icon", e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="کد SVG آیکون را اینجا قرار دهید..."
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeSocialLink(index)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Contact Form */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">فرم تماس</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عنوان فرم
                      </label>
                      <input
                        type="text"
                        value={formData.formTitle}
                        onChange={(e) => handleInputChange("formTitle", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        توضیحات فرم
                      </label>
                      <textarea
                        value={formData.formDescription}
                        onChange={(e) => handleInputChange("formDescription", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">تنظیمات ظاهری</h3>
                  
                  {/* Background Colors */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-800">رنگ‌های پس‌زمینه</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رنگ شروع گرادیان
                        </label>
                        <input
                          type="color"
                          value={formData.backgroundGradientFrom}
                          onChange={(e) => handleInputChange("backgroundGradientFrom", e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رنگ پایان گرادیان
                        </label>
                        <input
                          type="color"
                          value={formData.backgroundGradientTo}
                          onChange={(e) => handleInputChange("backgroundGradientTo", e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text Colors */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-800">رنگ‌های متن</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رنگ عنوان
                        </label>
                        <input
                          type="color"
                          value={formData.sectionTitleColor}
                          onChange={(e) => handleInputChange("sectionTitleColor", e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رنگ زیرعنوان
                        </label>
                        <input
                          type="color"
                          value={formData.sectionSubtitleColor}
                          onChange={(e) => handleInputChange("sectionSubtitleColor", e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رنگ توضیحات
                        </label>
                        <input
                          type="color"
                          value={formData.sectionDescriptionColor}
                          onChange={(e) => handleInputChange("sectionDescriptionColor", e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Colors */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-800">رنگ‌های اطلاعات تماس</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رنگ متن
                        </label>
                        <input
                          type="color"
                          value={formData.contactInfoTextColor}
                          onChange={(e) => handleInputChange("contactInfoTextColor", e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رنگ آیکون‌ها
                        </label>
                        <input
                          type="color"
                          value={formData.contactInfoIconColor}
                          onChange={(e) => handleInputChange("contactInfoIconColor", e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Colors */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-800">رنگ‌های فرم</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رنگ پس‌زمینه فرم
                        </label>
                        <input
                          type="color"
                          value={formData.formBgColor}
                          onChange={(e) => handleInputChange("formBgColor", e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رنگ متن فرم
                        </label>
                        <input
                          type="color"
                          value={formData.formTextColor}
                          onChange={(e) => handleInputChange("formTextColor", e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رنگ دکمه
                        </label>
                        <input
                          type="color"
                          value={formData.formButtonColor}
                          onChange={(e) => handleInputChange("formButtonColor", e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رنگ متن دکمه
                        </label>
                        <input
                          type="color"
                          value={formData.formButtonTextColor}
                          onChange={(e) => handleInputChange("formButtonTextColor", e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === "messages" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">پیام‌های دریافتی</h3>
                    <button
                      type="button"
                      onClick={fetchContactMessages}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      بروزرسانی
                    </button>
                  </div>                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : contactMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      هیچ پیامی دریافت نشده است.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contactMessages.map((message) => (
                        <div
                          key={message._id}
                          className={`p-4 border rounded-lg ${
                            message.isRead ? "bg-gray-50" : "bg-blue-50 border-blue-200"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 space-x-reverse mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {message.firstName} {message.lastName}
                                </h4>
                                <span className="text-sm text-gray-500">
                                  {new Date(message.createdAt).toLocaleDateString("fa-IR")}
                                </span>
                                {!message.isRead && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    جدید
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600 mb-3">
                                <p>📧 {message.email}</p>
                                {message.phone && <p>📞 {message.phone}</p>}
                              </div>
                              
                              <p className="text-gray-800">{message.message}</p>
                            </div>
                            
                            <div className="flex space-x-2 space-x-reverse">
                              {!message.isRead && (
                                <button
                                  type="button"
                                  onClick={() => markMessageAsRead(message._id!)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  علامت‌گذاری به عنوان خوانده شده
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteMessage(message._id!)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 space-x-reverse mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
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