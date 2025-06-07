"use client";

import { motion } from "framer-motion";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import ContactEditModal from "./ContactEditModal";

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

export default function ContactSection() {
  const { user, isAuthenticated } = usePublicAuth();
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState<null | "success" | "error">(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  // Check if user is school admin
  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = async () => {
    try {
      const response = await fetch("/api/admin/contact");
      const data = await response.json();
      if (data.success) {
        setContactData(data.contact);
      }
    } catch (error) {
      console.error("Error fetching contact data:", error);
      // Set default data if fetch fails
      setContactData({
        sectionTitle: "ما آماده پاسخگویی به سوالات شما هستیم",
        sectionSubtitle: "تماس با ما",
        sectionDescription:
          "برای کسب اطلاعات بیشتر، درخواست دمو یا مشاوره با ما در تماس باشید.",
        contactInfo: {
          phone: "۰۲۱-۸۸۸۸۷۷۷۷",
          phoneDesc: "دوشنبه تا پنجشنبه (۸ صبح تا ۵ بعدازظهر)",
          email: "info@parsamooz.ir",
          emailDesc: "برای دریافت پاسخ سریع با ما تماس بگیرید",
          address: "تهران، خیابان ولیعصر، برج پارسا، طبقه ۱۲",
          postalCode: "۱۴۵۶۷۸۹۳۰۲",
        },
        socialLinks: [
          {
            name: "Instagram",
            url: "#",
            icon: "M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
          },
          {
            name: "Twitter",
            url: "#",
            icon: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84",
          },
          {
            name: "LinkedIn",
            url: "#",
            icon: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
          },
        ],
        formTitle: "ارسال پیام",
        formDescription:
          "فرم زیر را تکمیل کنید تا کارشناسان ما در اسرع وقت با شما تماس بگیرند.",
        isVisible: true,
        sectionTitleColor: "#FFFFFF",
        sectionSubtitleColor: "#A855F7",
        sectionDescriptionColor: "#D1D5DB",
        backgroundGradientFrom: "#111827",
        backgroundGradientTo: "#111827",
        contactInfoTextColor: "#D1D5DB",
        contactInfoIconColor: "#A855F7",
        formBgColor: "#FFFFFF",
        formTextColor: "#111827",
        formButtonColor: "#4F46E5",
        formButtonTextColor: "#FFFFFF",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async (data: ContactData) => {
    try {
      const response = await fetch("/api/admin/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        setContactData(data);
        setShowEditModal(false);
        await fetchContactData();
      } else {
        console.error("Failed to save contact data:", result);
        alert("خطا در ذخیره اطلاعات: " + (result.error || "خطای نامشخص"));
      }
    } catch (error) {
      console.error("Error saving contact data:", error);
      alert("خطا در ذخیره اطلاعات");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        message: formData.get("message") as string,
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.hostname,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setFormStatus("success");
        e.currentTarget.reset(); // Reset form fields
      } else {
        setFormStatus("error");
        console.error("Form submission error:", result.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormStatus("error");
    } finally {
      setSubmitting(false);

      // Clear status message after 5 seconds
      setTimeout(() => {
        setFormStatus(null);
      }, 5000);
    }
  };

  if (loading || !contactData) {
    return (
      <section className="py-24 bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-300">
            در حال بارگذاری...
          </p>
        </div>
      </section>
    );
  }

  // Show admin placeholder if contact section is invisible
  if (!contactData.isVisible) {
    if (!isSchoolAdmin) {
      return null;
    }

    return (
      <section
        className="relative bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <span className="text-4xl">👁️‍🗨️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              بخش تماس با ما غیرفعال است
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
              تنظیمات بخش تماس با ما
            </button>
          </div>
        </div>

        {showEditModal && (
          <ContactEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveContact}
            initialData={contactData}
          />
        )}
      </section>
    );
  }

  return (
    <section
      id="contact"
      className="py-24 relative"
      dir="rtl"
      style={{
        background: `linear-gradient(to bottom, ${contactData.backgroundGradientFrom}, ${contactData.backgroundGradientTo})`,
      }}
    >
      {/* Settings Icon for School Admins */}
      {isSchoolAdmin && (
        <button
          onClick={() => setShowEditModal(true)}
          className="absolute top-4 left-4 z-20 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 group"
          title="ویرایش بخش تماس با ما"
        >
          <CogIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-base font-semibold tracking-wide uppercase"
            style={{ color: contactData.sectionSubtitleColor }}
          >
            {contactData.sectionSubtitle}
          </h2>
          <p
            className="mt-2 text-3xl font-extrabold sm:text-4xl"
            style={{ color: contactData.sectionTitleColor }}
          >
            {contactData.sectionTitle}
          </p>
          <p
            className="mt-4 max-w-2xl text-xl mx-auto"
            style={{ color: contactData.sectionDescriptionColor }}
          >
            {contactData.sectionDescription}
          </p>
        </motion.div>

        <div className="mt-16 lg:mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3
                className="text-lg font-medium"
                style={{ color: contactData.contactInfoTextColor }}
              >
                اطلاعات تماس
              </h3>
              <p
                className="mt-3 text-base"
                style={{ color: contactData.contactInfoTextColor }}
              >
                کارشناسان ما در روزهای کاری از ساعت ۸ صبح تا ۵ بعدازظهر آماده
                پاسخگویی به سوالات شما هستند.
              </p>

              <ul className="mt-6 space-y-6">
                {contactData.contactInfo.phone && (
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <PhoneIcon
                        className="h-6 w-6"
                        style={{ color: contactData.contactInfoIconColor }}
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className="mr-3 text-base"
                      style={{ color: contactData.contactInfoTextColor }}
                    >
                      <p>{contactData.contactInfo.phone}</p>
                      {contactData.contactInfo.phoneDesc && (
                        <p className="mt-1">
                          {contactData.contactInfo.phoneDesc}
                        </p>
                      )}
                    </div>
                  </li>
                )}

                {contactData.contactInfo.email && (
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <EnvelopeIcon
                        className="h-6 w-6"
                        style={{ color: contactData.contactInfoIconColor }}
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className="mr-3 text-base"
                      style={{ color: contactData.contactInfoTextColor }}
                    >
                      <p>{contactData.contactInfo.email}</p>
                      {contactData.contactInfo.emailDesc && (
                        <p className="mt-1">
                          {contactData.contactInfo.emailDesc}
                        </p>
                      )}
                    </div>
                  </li>
                )}

                {contactData.contactInfo.address && (
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <MapPinIcon
                        className="h-6 w-6"
                        style={{ color: contactData.contactInfoIconColor }}
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className="mr-3 text-base"
                      style={{ color: contactData.contactInfoTextColor }}
                    >
                      <p>{contactData.contactInfo.address}</p>
                      {contactData.contactInfo.postalCode && (
                        <p className="mt-1">
                          کد پستی: {contactData.contactInfo.postalCode}
                        </p>
                      )}
                    </div>
                  </li>
                )}
              </ul>

              <div className="mt-8 flex space-x-6 rtl:space-x-reverse">
                {contactData.socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    className="transition-colors hover:opacity-80"
                    style={{ color: contactData.contactInfoIconColor }}
                  >
                    <span className="sr-only">{link.name}</span>
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d={link.icon}
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl shadow-xl overflow-hidden p-6 sm:p-10"
              style={{ backgroundColor: contactData.formBgColor }}
            >
              <h3
                className="text-lg font-medium"
                style={{ color: contactData.formTextColor }}
              >
                {contactData.formTitle}
              </h3>
              <p className="mt-1" style={{ color: contactData.formTextColor }}>
                {contactData.formDescription}
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4"
              >
                <div>
                  <label
                    htmlFor="first-name"
                    className="block text-sm font-medium text-gray-900"
                  >
                    نام
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="firstName"
                      id="first-name"
                      required
                      className="py-3 px-4 block w-full shadow-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="last-name"
                    className="block text-sm font-medium text-gray-900"
                  >
                    نام خانوادگی
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="lastName"
                      id="last-name"
                      required
                      className="py-3 px-4 block w-full shadow-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-900"
                  >
                    ایمیل
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="py-3 px-4 block w-full shadow-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-900"
                  >
                    شماره تماس
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      className="py-3 px-4 block w-full shadow-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-900"
                  >
                    پیام
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      className="py-3 px-4 block w-full shadow-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        required
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="mr-3">
                      <label
                        htmlFor="terms"
                        className="font-medium text-gray-700"
                      >
                        با{" "}
                        <a
                          href="#"
                          className="text-indigo-600 hover:text-indigo-500"
                        >
                          قوانین حریم خصوصی
                        </a>{" "}
                        موافقم
                      </label>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      submitting ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                    style={{
                      backgroundColor: contactData.formButtonColor,
                      color: contactData.formButtonTextColor,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    {submitting ? "در حال ارسال..." : "ارسال پیام"}
                  </button>
                </div>

                {formStatus && (
                  <div
                    className={`sm:col-span-2 rounded-md p-4 ${
                      formStatus === "success" ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        {formStatus === "success" ? (
                          <svg
                            className="h-5 w-5 text-green-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="mr-3">
                        <p
                          className={
                            formStatus === "success"
                              ? "text-green-800"
                              : "text-red-800"
                          }
                        >
                          {formStatus === "success"
                            ? "پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت."
                            : "متأسفانه در ارسال پیام مشکلی پیش آمد. لطفاً دوباره تلاش کنید."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && contactData && (
        <ContactEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveContact}
          initialData={contactData}
        />
      )}
    </section>
  );
}
