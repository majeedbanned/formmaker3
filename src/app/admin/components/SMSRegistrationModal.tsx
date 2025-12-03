"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface SMSRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  register_personality: string;
  first_name: string;
  last_name: string;
  father: string;
  gender: string;
  username: string;
  password: string;
  password_repeat: string;
  parent: string;
  date: string;
  shenasname: string;
  melli_code: string;
  email: string;
  mobile: string;
  tel: string;
  fax: string;
  post_code: string;
  addr: string;
  referrer: string;
  package: string;
  reseller: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function SMSRegistrationModal({
  isOpen,
  onClose,
}: SMSRegistrationModalProps) {
  const [formData, setFormData] = useState<FormData>({
    register_personality: "حقیقی",
    first_name: "",
    last_name: "",
    father: "",
    gender: "مرد",
    username: "",
    password: "",
    password_repeat: "",
    parent: "majeedbanned",
    date: "",
    shenasname: "",
    melli_code: "",
    email: "",
    mobile: "",
    tel: "",
    fax: "",
    post_code: "",
    addr: "",
    referrer: "",
    package: "935",
    reseller: "نیست",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    username?: string;
    password?: string;
  } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "نام الزامی است";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "نام خانوادگی الزامی است";
    }
    if (!formData.father.trim()) {
      newErrors.father = "نام پدر الزامی است";
    }
    if (!formData.username.trim()) {
      newErrors.username = "نام کاربری الزامی است";
    }
    if (!formData.password) {
      newErrors.password = "رمز عبور الزامی است";
    } else if (formData.password.length < 8) {
      newErrors.password = "رمز عبور باید حداقل ۸ کاراکتر باشد";
    }
    if (formData.password !== formData.password_repeat) {
      newErrors.password_repeat = "رمز عبور و تکرار آن باید یکسان باشند";
    }
    if (!formData.date.trim()) {
      newErrors.date = "تاریخ تولد الزامی است";
    } else {
      // Validate date format (YYYY/MM/DD)
      const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
      if (!dateRegex.test(formData.date)) {
        newErrors.date = "فرمت تاریخ باید YYYY/MM/DD باشد (مثال: 1372/02/01)";
      }
    }
    if (!formData.shenasname.trim()) {
      newErrors.shenasname = "شماره شناسنامه الزامی است";
    }
    if (!formData.melli_code.trim()) {
      newErrors.melli_code = "کد ملی الزامی است";
    } else if (!/^\d{10}$/.test(formData.melli_code)) {
      newErrors.melli_code = "کد ملی باید ۱۰ رقم باشد";
    }
    if (!formData.email.trim()) {
      newErrors.email = "ایمیل الزامی است";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "فرمت ایمیل صحیح نیست";
      }
    }
    if (!formData.mobile.trim()) {
      newErrors.mobile = "شماره موبایل الزامی است";
    } else if (!/^09\d{9}$/.test(formData.mobile)) {
      newErrors.mobile = "شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد";
    }
    if (!formData.tel.trim()) {
      newErrors.tel = "شماره تلفن الزامی است";
    }
    if (!formData.fax.trim()) {
      newErrors.fax = "شماره فکس الزامی است";
    }
    if (!formData.post_code.trim()) {
      newErrors.post_code = "کد پستی الزامی است";
    }
    if (!formData.addr.trim()) {
      newErrors.addr = "آدرس الزامی است";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/sms/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // Check if the response indicates success (result code 0 means success)
      if (data.success && data.result === 0) {
        setResult({
          success: true,
          message: data.message || "ثبت‌نام کاربر با موفقیت انجام شده است.",
          username: formData.username,
          password: formData.password,
        });
        // Don't reset form - keep success message permanently visible
      } else {
        // Handle error response - show the message from server based on result code
        setResult({
          success: false,
          message: data.message || "خطا در ثبت‌نام. لطفاً اطلاعات را بررسی کنید.",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setResult({
        success: false,
        message: "خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Check for existing registration when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsChecking(true);
      setAlreadyRegistered(null);
      setResult(null);
      
      fetch("/api/admin/sms/check")
        .then((res) => res.json())
        .then((data) => {
          if (data.registered && data.username && data.password) {
            setAlreadyRegistered({
              username: data.username,
              password: data.password,
            });
          }
        })
        .catch((error) => {
          console.error("Error checking SMS registration:", error);
        })
        .finally(() => {
          setIsChecking(false);
        });
    }
  }, [isOpen]);

  const handleClose = () => {
    setResult(null);
    setErrors({});
    setAlreadyRegistered(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            ثبت‌نام SMS
          </DialogTitle>
          <DialogDescription className="text-center">
            فرم ثبت‌نام برای سرویس پیامک
          </DialogDescription>
        </DialogHeader>

        {isChecking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="mr-3 text-gray-600">در حال بررسی...</span>
          </div>
        ) : alreadyRegistered ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-lg bg-blue-50 border-2 border-blue-300"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="space-y-4">
                  <p className="text-blue-800 font-bold text-lg mb-3">
                    شما قبلاً ثبت‌نام کرده‌اید
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-blue-200 space-y-3">
                    <p className="text-gray-700 font-semibold">
                      برای ادامه، لطفاً به پنل مدیریت وارد شوید:
                    </p>
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        <span className="font-semibold">آدرس:</span>{" "}
                        <a
                          href="https://panel.idehpayam.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          https://panel.idehpayam.com
                        </a>
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">نام کاربری:</span>{" "}
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {alreadyRegistered.username}
                        </span>
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">رمز عبور:</span>{" "}
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {alreadyRegistered.password}
                        </span>
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        <span className="font-semibold">مراحل بعدی:</span>
                        <br />
                        ۱. وارد پنل شوید و مدارک لازم را آپلود کنید
                        <br />
                        ۲. حساب خود را شارژ کنید
                        <br />
                        ۳. پس از تأیید ادمین، می‌توانید پیامک ارسال کنید
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : result && result.success ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-lg bg-green-50 border-2 border-green-300"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="space-y-4">
                  <p className="text-green-800 font-bold text-lg mb-3">
                    {result.message}
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-green-200 space-y-3">
                    <p className="text-gray-700 font-semibold">
                      برای ادامه، لطفاً به پنل مدیریت وارد شوید:
                    </p>
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        <span className="font-semibold">آدرس:</span>{" "}
                        <a
                          href="https://panel.idehpayam.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          https://panel.idehpayam.com
                        </a>
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">نام کاربری:</span>{" "}
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {result.username}
                        </span>
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">رمز عبور:</span>{" "}
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {result.password}
                        </span>
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        <span className="font-semibold">مراحل بعدی:</span>
                        <br />
                        ۱. وارد پنل شوید و مدارک لازم را آپلود کنید
                        <br />
                        ۲. حساب خود را شارژ کنید
                        <br />
                        ۳. پس از تأیید ادمین، می‌توانید پیامک ارسال کنید
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {result && !result.success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-lg mb-4 bg-red-50 border border-red-200"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                  <p className="text-red-800">{result.message}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Register Personality */}
            <div>
              <label className="block text-sm font-medium mb-1">
                نوع شخصیت <span className="text-red-500">*</span>
              </label>
              <select
                name="register_personality"
                value={formData.register_personality}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="حقیقی">حقیقی</option>
                <option value="حقوقی">حقوقی</option>
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium mb-1">
                جنسیت <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="مرد">مرد</option>
                <option value="زن">زن</option>
              </select>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                نام <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.first_name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                نام خانوادگی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.last_name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
              )}
            </div>

            {/* Father */}
            <div>
              <label className="block text-sm font-medium mb-1">
                نام پدر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="father"
                value={formData.father}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.father ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.father && (
                <p className="text-red-500 text-xs mt-1">{errors.father}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1">
                نام کاربری <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.username ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1">
                رمز عبور <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Password Repeat */}
            <div>
              <label className="block text-sm font-medium mb-1">
                تکرار رمز عبور <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password_repeat"
                value={formData.password_repeat}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password_repeat ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.password_repeat && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password_repeat}
                </p>
              )}
            </div>

            {/* Parent - Hidden */}
            <input
              type="hidden"
              name="parent"
              value={formData.parent}
            />

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                تاریخ تولد <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="date"
                value={formData.date}
                onChange={handleChange}
                placeholder="1374/02/05"
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? "border-red-500" : "border-gray-300"
                }`}
              />
              <p className="text-gray-500 text-xs mt-1">
                فرمت تاریخ باید ۱۰ کاراکتر باشد مانند: 1374/02/05
              </p>
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>

            {/* Shenasname */}
            <div>
              <label className="block text-sm font-medium mb-1">
                شماره شناسنامه <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="shenasname"
                value={formData.shenasname}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.shenasname ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.shenasname && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.shenasname}
                </p>
              )}
            </div>

            {/* Melli Code */}
            <div>
              <label className="block text-sm font-medium mb-1">
                کد ملی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="melli_code"
                value={formData.melli_code}
                onChange={handleChange}
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.melli_code ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.melli_code && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.melli_code}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">
                ایمیل <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium mb-1">
                شماره موبایل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                maxLength={11}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.mobile ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.mobile && (
                <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
              )}
            </div>

            {/* Tel */}
            <div>
              <label className="block text-sm font-medium mb-1">
                شماره تلفن <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tel"
                value={formData.tel}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.tel ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.tel && (
                <p className="text-red-500 text-xs mt-1">{errors.tel}</p>
              )}
            </div>

            {/* Fax */}
            <div>
              <label className="block text-sm font-medium mb-1">
                شماره فکس <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fax"
                value={formData.fax}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fax ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.fax && (
                <p className="text-red-500 text-xs mt-1">{errors.fax}</p>
              )}
            </div>

            {/* Post Code */}
            <div>
              <label className="block text-sm font-medium mb-1">
                کد پستی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="post_code"
                value={formData.post_code}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.post_code ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.post_code && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.post_code}
                </p>
              )}
            </div>

            {/* Package - Hidden */}
            <input
              type="hidden"
              name="package"
              value={formData.package}
            />

            {/* Reseller - Hidden */}
            <input
              type="hidden"
              name="reseller"
              value={formData.reseller}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-1">
              آدرس <span className="text-red-500">*</span>
            </label>
            <textarea
              name="addr"
              value={formData.addr}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.addr ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.addr && (
              <p className="text-red-500 text-xs mt-1">{errors.addr}</p>
            )}
          </div>

          {/* Referrer */}
          <div>
            <label className="block text-sm font-medium mb-1">معرف</label>
            <input
              type="text"
              name="referrer"
              value={formData.referrer}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <DialogFooter>
            <motion.button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              انصراف
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                "ثبت‌نام"
              )}
            </motion.button>
          </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

