"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-indigo-50 to-white overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 right-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-40 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-7xl mx-auto pt-20 pb-16 px-4 sm:pt-24 sm:pb-24 sm:px-6 lg:pt-32 lg:pb-28 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <motion.div
            className="text-center lg:text-left lg:w-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="block text-indigo-600">پارسا موز</span>
              <span className="block">سیستم مدیریت آموزش</span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              سیستم مدیریت آموزش، راهکاری جامع برای مدارس و موسسات آموزشی. با
              پارسا موز، آسان‌تر تدریس کنید، عملکرد دانش آموزان را رصد کنید و
              ارتباط موثرتری با والدین داشته باشید.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Link href="/signup" className="w-full sm:w-auto">
                <button className="w-full px-8 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-1">
                  شروع رایگان
                </button>
              </Link>
              <Link href="/demo" className="w-full sm:w-auto">
                <button className="w-full px-8 py-3 text-base font-medium text-indigo-700 bg-white border border-indigo-600 rounded-md shadow-sm hover:bg-indigo-50 transition duration-300 ease-in-out transform hover:-translate-y-1">
                  نمایش دمو
                </button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-10 lg:mt-0 lg:w-1/2 lg:pl-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <div className="relative w-full h-64 md:h-80 lg:h-96">
              <Image
                src="/images/hero-dashboard.png"
                alt="Dashboard Preview"
                fill
                className="object-cover rounded-lg shadow-2xl"
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-5 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 1.2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
