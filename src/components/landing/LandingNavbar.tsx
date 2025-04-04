"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showDesktopDropdown, setShowDesktopDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const mainNavLinks = [
    { name: "خانه", href: "#" },
    { name: "ویژگی‌ها", href: "#features" },
    { name: "درباره ما", href: "#about" },
    { name: "تعرفه‌ها", href: "#pricing" },
    { name: "تماس با ما", href: "#contact" },
  ];

  const dropdownNavLinks = [
    { name: "تیم آموزشی", href: "#teachers" },
    { name: "گالری", href: "#gallery" },
    { name: "اخبار", href: "#news" },
    { name: "مقالات", href: "#articles" },
    { name: "اپلیکیشن", href: "#app" },
    { name: "نظرات", href: "#testimonials" },
  ];

  const allNavLinks = [...mainNavLinks, ...dropdownNavLinks];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center`}
                >
                  <span className="text-white font-bold text-lg">پ</span>
                </div>
                <span
                  className={`mr-2 text-xl font-bold ${
                    scrolled ? "text-gray-900" : "text-white"
                  }`}
                >
                  پارسا‌موز
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
            {mainNavLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  scrolled
                    ? "text-gray-900 hover:text-indigo-600"
                    : "text-white hover:text-indigo-300"
                }`}
              >
                {link.name}
              </a>
            ))}

            {/* Dropdown menu */}
            <div className="relative">
              <button
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                  scrolled
                    ? "text-gray-900 hover:text-indigo-600"
                    : "text-white hover:text-indigo-300"
                }`}
                onClick={() => setShowDesktopDropdown(!showDesktopDropdown)}
              >
                بیشتر
                <ChevronDownIcon
                  className={`mr-1 h-4 w-4 transition-transform ${
                    showDesktopDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showDesktopDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-10"
                  onMouseLeave={() => setShowDesktopDropdown(false)}
                >
                  {dropdownNavLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                      onClick={() => setShowDesktopDropdown(false)}
                    >
                      {link.name}
                    </a>
                  ))}
                </motion.div>
              )}
            </div>

            <a
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 ml-4"
            >
              ورود
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                scrolled
                  ? "text-gray-900 hover:text-indigo-600"
                  : "text-white hover:text-indigo-300"
              }`}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden bg-white"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 max-h-[80vh] overflow-y-auto">
            {allNavLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-indigo-50 hover:text-indigo-600"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <a
              href="/login"
              className="block px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 text-center mt-4"
              onClick={() => setIsOpen(false)}
            >
              ورود
            </a>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
