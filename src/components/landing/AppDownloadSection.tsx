"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
} from "@heroicons/react/24/outline";

export default function AppDownloadSection() {
  return (
    <section id="app" className="py-24 bg-indigo-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">
              اپلیکیشن موبایل
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              پارسا موز را همیشه همراه داشته باشید
            </p>
            <p className="mt-4 text-lg text-gray-600">
              با استفاده از اپلیکیشن موبایل پارسا موز، در هر زمان و مکان به
              سیستم مدیریت آموزشی خود دسترسی داشته باشید. مدیریت کلاس‌ها، پیگیری
              پیشرفت دانش‌آموزان و ارتباط با والدین را از طریق گوشی هوشمند خود
              انجام دهید.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <DevicePhoneMobileIcon
                      className="h-6 w-6"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="mr-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    رابط کاربری ساده و زیبا
                  </h3>
                  <p className="mt-1 text-gray-600">
                    طراحی شده برای استفاده آسان و سریع توسط معلمان، مدیران،
                    والدین و دانش‌آموزان.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <DeviceTabletIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
                <div className="mr-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    سازگار با همه دستگاه‌ها
                  </h3>
                  <p className="mt-1 text-gray-600">
                    قابل استفاده بر روی گوشی‌های اندروید، آیفون و تبلت‌ها با
                    تجربه کاربری یکسان.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <motion.a
                href="#"
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src="https://cdn-icons-png.flaticon.com/512/732/732208.png"
                  alt="App Store"
                  width={24}
                  height={24}
                  className="ml-2"
                />
                دانلود از App Store
              </motion.a>

              <motion.a
                href="#"
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-black hover:bg-gray-800"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src="https://cdn-icons-png.flaticon.com/512/6124/6124997.png"
                  alt="Google Play"
                  width={24}
                  height={24}
                  className="ml-2"
                />
                دانلود از Google Play
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            className="mt-10 lg:mt-0 relative"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative mx-auto w-full max-w-md">
              {/* Phone frame */}
              <div className="relative z-10 overflow-hidden rounded-[2.5rem] border-4 border-gray-800 bg-gray-800 shadow-lg">
                <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-lg"></div>
                <div className="absolute top-2 inset-x-0 flex justify-center">
                  <div className="h-2 w-16 rounded-full bg-gray-700"></div>
                </div>

                {/* App screenshots carousel */}
                <div className="aspect-[9/19] overflow-hidden">
                  <div className="h-full w-full relative">
                    <Image
                      src="https://i.ibb.co/TLGBkg6/mobile-app-screen1.png"
                      alt="App Screenshot"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Home button */}
                <div className="absolute bottom-1 inset-x-0 flex justify-center">
                  <div className="h-4 w-4 rounded-full border-2 border-gray-600"></div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-5 h-40 w-40 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-8 left-10 h-40 w-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
