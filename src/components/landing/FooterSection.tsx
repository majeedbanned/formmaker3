"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import { CogIcon } from "@heroicons/react/24/outline";
import FooterEditModal from "./FooterEditModal";

interface SocialLink {
  name: string;
  url: string;
  icon: string;
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
  companyName: string;
  companyDescription: string;
  logoText: string;
  linkGroups: FooterLinkGroup[];
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterButtonText: string;
  newsletterPlaceholder: string;
  socialLinks: SocialLink[];
  copyrightText: string;
  isVisible: boolean;
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

export default function FooterSection() {
  const { user, isAuthenticated } = usePublicAuth();
  const [footerData, setFooterData] = useState<FooterData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      const response = await fetch("/api/admin/footer");
      const data = await response.json();
      if (data.success) {
        setFooterData(data.footer);
      }
    } catch (error) {
      console.error("Error fetching footer data:", error);
      // Set default data if fetch fails
      setFooterData({
        companyName: "پارساموز",
        logoText: "پ",
        companyDescription:
          "با سامانه پارساموز، مدیریت آموزشی مدرسه خود را به سطح جدیدی ارتقا دهید. ما اینجا هستیم تا تجربه کاربری بی‌نظیری را برای شما فراهم کنیم.",
        linkGroups: [
          {
            title: "محصولات",
            links: [
              { name: "مدیریت کلاس‌ها", href: "#" },
              { name: "فرم‌های سفارشی", href: "#" },
              { name: "گزارش‌گیری", href: "#" },
              { name: "پنل مدیران", href: "#" },
            ],
          },
          {
            title: "شرکت",
            links: [
              { name: "درباره ما", href: "#about" },
              { name: "تیم ما", href: "#" },
              { name: "فرصت‌های شغلی", href: "#" },
              { name: "اخبار", href: "#" },
            ],
          },
          {
            title: "پشتیبانی",
            links: [
              { name: "مرکز راهنما", href: "#" },
              { name: "تماس با ما", href: "#contact" },
              { name: "حریم خصوصی", href: "#" },
              { name: "شرایط استفاده", href: "#" },
            ],
          },
        ],
        newsletterTitle: "خبرنامه",
        newsletterDescription:
          "برای دریافت آخرین اخبار و بروزرسانی‌ها در خبرنامه ما عضو شوید.",
        newsletterButtonText: "عضویت",
        newsletterPlaceholder: "ایمیل خود را وارد کنید",
        socialLinks: [
          {
            name: "Instagram",
            url: "#",
            icon: `<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>`,
          },
          {
            name: "Twitter",
            url: "#",
            icon: `<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>`,
          },
          {
            name: "LinkedIn",
            url: "#",
            icon: `<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>`,
          },
        ],
        copyrightText: `© ${new Date().getFullYear()} پارساموز. تمامی حقوق محفوظ است.`,
        isVisible: true,
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
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFooter = async (data: FooterData) => {
    try {
      const response = await fetch("/api/admin/footer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setFooterData(data);
        setShowEditModal(false);
        await fetchFooterData();
      } else {
        console.error("Failed to save footer data:", result);
        alert("خطا در ذخیره اطلاعات: " + (result.error || "خطای نامشخص"));
      }
    } catch (error) {
      console.error("Error saving footer data:", error);
      alert("خطا در ذخیره اطلاعات");
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    // console.log("Newsletter subscription:", email);
    setEmail("");
    alert("با تشکر! ایمیل شما ثبت شد.");
  };

  if (loading || !footerData) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-4 text-sm text-gray-400">در حال بارگذاری...</p>
          </div>
        </div>
      </footer>
    );
  }

  // Show admin placeholder if footer is invisible
  if (!footerData.isVisible) {
    if (!isSchoolAdmin) {
      return null;
    }

    return (
      <footer
        className="relative bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <span className="text-4xl">👁️‍🗨️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              فوتر غیرفعال است
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              این بخش برای بازدیدکنندگان نمایش داده نمی‌شود. برای فعال کردن آن
              روی دکمه تنظیمات کلیک کنید.
            </p>
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <CogIcon className="h-5 w-5" />
              تنظیمات فوتر
            </button>
          </div>
        </div>

        {showEditModal && (
          <FooterEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveFooter}
            initialData={footerData}
          />
        )}
      </footer>
    );
  }

  return (
    <footer
      className="relative"
      style={{
        backgroundColor: footerData.backgroundColor,
        color: footerData.textColor,
      }}
      dir="rtl"
    >
      {/* Settings Icon for School Admins */}
      {isSchoolAdmin && (
        <button
          onClick={() => setShowEditModal(true)}
          className="absolute top-4 left-4 z-20 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 group"
          title="ویرایش فوتر"
        >
          <CogIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          <motion.div
            className="md:col-span-2 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/">
              <div className="flex items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: footerData.logoBackgroundColor }}
                >
                  <span
                    className="font-bold text-lg"
                    style={{ color: footerData.logoTextColor }}
                  >
                    {footerData.logoText}
                  </span>
                </div>
                <span
                  className="mr-2 text-xl font-bold"
                  style={{ color: footerData.textColor }}
                >
                  {footerData.companyName}
                </span>
              </div>
            </Link>
            <p className="text-sm" style={{ color: footerData.linkColor }}>
              {footerData.companyDescription}
            </p>
            <div className="flex space-x-4 rtl:space-x-reverse">
              {footerData.socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  className="transition-colors"
                  style={{ color: footerData.linkColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = footerData.linkHoverColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = footerData.linkColor;
                  }}
                >
                  <span className="sr-only">{social.name}</span>
                  <div dangerouslySetInnerHTML={{ __html: social.icon }} />
                </a>
              ))}
            </div>
          </motion.div>

          {footerData.linkGroups.map((group, groupIdx) => (
            <motion.div
              key={group.title}
              className="md:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * (groupIdx + 1) }}
            >
              <h3
                className="text-sm font-semibold tracking-wider uppercase"
                style={{ color: footerData.textColor }}
              >
                {group.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-base transition-colors"
                      style={{ color: footerData.linkColor }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = footerData.linkHoverColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = footerData.linkColor;
                      }}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          <motion.div
            className="md:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: footerData.textColor }}
            >
              {footerData.newsletterTitle}
            </h3>
            <p
              className="mt-4 text-base"
              style={{ color: footerData.linkColor }}
            >
              {footerData.newsletterDescription}
            </p>
            <form className="mt-4 sm:flex" onSubmit={handleNewsletterSubmit}>
              <input
                aria-label="Email for newsletter"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none min-w-0 w-full border rounded-md py-2 px-4 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{
                  backgroundColor: footerData.inputBackgroundColor,
                  color: footerData.inputTextColor,
                  borderColor: footerData.borderColor,
                }}
                placeholder={footerData.newsletterPlaceholder}
              />
              <div className="mt-3 rounded-md sm:mt-0 sm:mr-3 sm:flex-shrink-0">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center border border-transparent rounded-md py-2 px-4 text-base font-medium focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  style={{
                    backgroundColor: footerData.buttonColor,
                    color: footerData.buttonTextColor,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  {footerData.newsletterButtonText}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        <motion.div
          className="mt-12 pt-8 text-sm text-center"
          style={{
            borderTop: `1px solid ${footerData.borderColor}`,
            color: footerData.linkColor,
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p>{footerData.copyrightText}</p>
        </motion.div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <FooterEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveFooter}
          initialData={footerData}
        />
      )}
    </footer>
  );
}
