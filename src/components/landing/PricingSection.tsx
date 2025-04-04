"use client";

import { motion } from "framer-motion";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

const plans = [
  {
    name: "پایه",
    price: { monthly: "۲۹۰,۰۰۰", annually: "۲,۵۰۰,۰۰۰" },
    description: "مناسب برای مدارس کوچک",
    features: [
      { title: "تا ۱۰۰ دانش‌آموز", included: true },
      { title: "مدیریت کلاس‌های درسی", included: true },
      { title: "ثبت نمرات و کارنامه", included: true },
      { title: "آزمون‌های آنلاین", included: true },
      { title: "ارتباط با والدین", included: true },
      { title: "تحلیل پیشرفته آموزشی", included: false },
      { title: "پشتیبانی اختصاصی", included: false },
      { title: "ماژول‌های تخصصی", included: false },
    ],
    cta: "ثبت‌نام",
    mostPopular: false,
  },
  {
    name: "استاندارد",
    price: { monthly: "۴۹۰,۰۰۰", annually: "۴,۸۰۰,۰۰۰" },
    description: "مناسب برای مدارس متوسط",
    features: [
      { title: "تا ۵۰۰ دانش‌آموز", included: true },
      { title: "مدیریت کلاس‌های درسی", included: true },
      { title: "ثبت نمرات و کارنامه", included: true },
      { title: "آزمون‌های آنلاین", included: true },
      { title: "ارتباط با والدین", included: true },
      { title: "تحلیل پیشرفته آموزشی", included: true },
      { title: "پشتیبانی اختصاصی", included: false },
      { title: "ماژول‌های تخصصی", included: false },
    ],
    cta: "ثبت‌نام",
    mostPopular: true,
  },
  {
    name: "حرفه‌ای",
    price: { monthly: "۹۹۰,۰۰۰", annually: "۹,۹۰۰,۰۰۰" },
    description: "مناسب برای مدارس بزرگ و مجتمع‌های آموزشی",
    features: [
      { title: "دانش‌آموزان نامحدود", included: true },
      { title: "مدیریت کلاس‌های درسی", included: true },
      { title: "ثبت نمرات و کارنامه", included: true },
      { title: "آزمون‌های آنلاین", included: true },
      { title: "ارتباط با والدین", included: true },
      { title: "تحلیل پیشرفته آموزشی", included: true },
      { title: "پشتیبانی اختصاصی", included: true },
      { title: "ماژول‌های تخصصی", included: true },
    ],
    cta: "ثبت‌نام",
    mostPopular: false,
  },
];

export default function PricingSection() {
  const [annual, setAnnual] = useState(true);

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
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">
            تعرفه‌ها
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            طرح متناسب با نیاز خود را انتخاب کنید
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            با گزینه‌های انعطاف‌پذیر ما، بسته مناسب مدرسه خود را پیدا کنید.
          </p>
        </motion.div>

        <div className="mt-12 sm:flex sm:justify-center sm:space-x-4 rtl:space-x-reverse">
          <fieldset className="flex items-center space-x-3 rtl:space-x-reverse bg-gray-100 p-1 rounded-full">
            <label
              className={`px-3 py-2 text-sm font-medium rounded-full cursor-pointer ${
                !annual ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              <input
                type="radio"
                name="billing-plan"
                value="monthly"
                className="sr-only"
                checked={!annual}
                onChange={() => setAnnual(false)}
              />
              ماهانه
            </label>
            <label
              className={`px-3 py-2 text-sm font-medium rounded-full cursor-pointer ${
                annual ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              <input
                type="radio"
                name="billing-plan"
                value="annually"
                className="sr-only"
                checked={annual}
                onChange={() => setAnnual(true)}
              />
              سالانه{" "}
              <span className="text-indigo-500 font-bold">(%۱۵ تخفیف)</span>
            </label>
          </fieldset>
        </div>

        <motion.div
          className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              className={`bg-white border rounded-lg shadow-sm divide-y divide-gray-200 ${
                plan.mostPopular ? "ring-2 ring-indigo-500" : ""
              }`}
              variants={item}
            >
              {plan.mostPopular && (
                <div className="absolute top-0 right-0 -mt-3 -mr-3 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full transform rotate-3">
                  محبوب‌ترین
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {annual ? plan.price.annually : plan.price.monthly}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    {" "}
                    تومان {annual ? "/ سالانه" : "/ ماهانه"}
                  </span>
                </p>
                <div className="mt-6">
                  <button
                    className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      plan.mostPopular
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-gray-800 hover:bg-gray-900"
                    } transition-colors duration-300`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
              <div className="px-6 pt-6 pb-8">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide">
                  امکانات شامل:
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex">
                      {feature.included ? (
                        <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                      ) : (
                        <XMarkIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />
                      )}
                      <span
                        className={`mr-3 text-sm ${
                          feature.included ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {feature.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-6 md:p-8 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-medium text-gray-900">
            نیاز به طرح اختصاصی دارید؟
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            اگر نیازهای خاصی دارید یا مجموعه‌ای از مدارس هستید، با ما تماس
            بگیرید تا راهکار متناسب با شرایط شما طراحی کنیم.
          </p>
          <a
            href="/contact"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-500 font-medium"
          >
            درخواست مشاوره رایگان &rarr;
          </a>
        </motion.div>
      </div>
    </section>
  );
}
