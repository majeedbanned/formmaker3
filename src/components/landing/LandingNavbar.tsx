"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  _id: string;
  name: string;
  href: string;
  type: "main" | "dropdown";
  isActive: boolean;
  order: number;
  parent?: string;
  children?: NavItem[];
}

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState<string>("مدرسه من");

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

  useEffect(() => {
    fetchNavItems();
    fetchSchoolName();
  }, []);

  const fetchNavItems = async () => {
    try {
      const response = await fetch("/api/admin/navigation");
      const data = await response.json();
      if (data.success) {
        const items = data.items || [];

        // If no items exist in the database (collection doesn't exist or is empty),
        // use default navigation items
        if (items.length === 0) {
          // console.log(
          //   "No navigation items found in database, using default items"
          // );
          setNavItems(getDefaultNavItems());
        } else {
          const organizedItems = organizeNavItems(items);
          setNavItems(organizedItems);
        }
      } else {
        console.error("Navigation API returned error:", data.error);
        setNavItems(getDefaultNavItems());
      }
    } catch (error) {
      console.error("Error fetching navigation items:", error);
      // Fallback to default nav items if API fails
      setNavItems(getDefaultNavItems());
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolName = async () => {
    try {
      const response = await fetch("/api/schools/name", {
        headers: { "x-domain": window.location.host },
      });
      const data = await response.json();
      if (data.success && data.schoolName) {
        setSchoolName(data.schoolName);
      }
    } catch (error) {
      console.error("Error fetching school name:", error);
      // Keep default "مدرسه من" if fetch fails
    }
  };

  const organizeNavItems = (items: NavItem[]) => {
    const activeItems = items.filter((item) => item.isActive);
    // console.log("Active items count:", activeItems.length);

    const mainItems = activeItems.filter(
      (item) => !item.parent && item.type === "main"
    );
    // console.log("Main items:", mainItems);

    const dropdownItems = activeItems.filter(
      (item) => item.parent && item.type === "dropdown"
    );
    // console.log("Dropdown items:", dropdownItems);

    const result = mainItems
      .map((item) => ({
        ...item,
        children: dropdownItems.filter((child) => child.parent === item._id),
      }))
      .sort((a, b) => a.order - b.order);

    // console.log("Final organized result:", result);
    return result;
  };

  const getDefaultNavItems = () => {
    // Fallback navigation items
    return [
      {
        _id: "1",
        name: "خانه",
        href: "#",
        type: "main" as const,
        isActive: true,
        order: 1,
      },
      {
        _id: "2",
        name: "ویژگی‌ها",
        href: "#features",
        type: "main" as const,
        isActive: true,
        order: 2,
      },
      {
        _id: "3",
        name: "درباره ما",
        href: "#about",
        type: "main" as const,
        isActive: true,
        order: 3,
      },
      {
        _id: "4",
        name: "تعرفه‌ها",
        href: "#pricing",
        type: "main" as const,
        isActive: true,
        order: 4,
      },
      {
        _id: "5",
        name: "تماس با ما",
        href: "#contact",
        type: "main" as const,
        isActive: true,
        order: 5,
      },
      {
        _id: "6",
        name: "بیشتر",
        href: "#",
        type: "main" as const,
        isActive: true,
        order: 6,
        children: [
          {
            _id: "7",
            name: "تیم آموزشی",
            href: "#teachers",
            type: "dropdown" as const,
            isActive: true,
            order: 1,
            parent: "6",
          },
          {
            _id: "8",
            name: "گالری",
            href: "#gallery",
            type: "dropdown" as const,
            isActive: true,
            order: 2,
            parent: "6",
          },
          {
            _id: "9",
            name: "اخبار",
            href: "#news",
            type: "dropdown" as const,
            isActive: true,
            order: 3,
            parent: "6",
          },
          {
            _id: "10",
            name: "مقالات",
            href: "#articles",
            type: "dropdown" as const,
            isActive: true,
            order: 4,
            parent: "6",
          },
          {
            _id: "11",
            name: "اپلیکیشن",
            href: "#app",
            type: "dropdown" as const,
            isActive: true,
            order: 5,
            parent: "6",
          },
          {
            _id: "12",
            name: "نظرات",
            href: "#testimonials",
            type: "dropdown" as const,
            isActive: true,
            order: 6,
            parent: "6",
          },
        ],
      },
    ];
  };

  // All main navigation items (both with and without children)
  const mainNavLinks = navItems.filter((item) => item.type === "main");

  // All dropdown items for mobile menu
  const allDropdownItems = navItems.reduce((acc: NavItem[], item) => {
    if (item.children && item.children.length > 0) {
      return [...acc, ...item.children];
    }
    return acc;
  }, []);

  // All nav links for mobile menu
  const allNavLinks = [...mainNavLinks, ...allDropdownItems];

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl shadow-xl border-b border-white/20 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <div className="w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
                  </div>
                  <div className="mr-3 bg-gray-200 h-6 w-24 rounded-lg animate-pulse"></div>
                </div>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 h-8 w-16 rounded-xl animate-pulse"
                ></div>
              ))}
              <div className="bg-gradient-to-r from-indigo-200 to-purple-200 h-10 w-16 rounded-2xl animate-pulse ml-4"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-xl border-b border-white/20 py-2"
          : "bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-sm py-4"
      }`}
    >
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-0 right-1/4 w-24 h-24 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1000ms" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <motion.div
                className="flex items-center group"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    scrolled
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg"
                      : "bg-gradient-to-r from-indigo-400 to-purple-500 shadow-xl"
                  }`}
                  whileHover={{
                    rotate: [0, -10, 10, 0],
                    scale: 1.1,
                    transition: { duration: 0.5 },
                  }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-50 blur-md group-hover:opacity-80 transition-opacity duration-300" />

                  <span className="relative text-white font-bold text-xl filter drop-shadow-sm">
                    پ
                  </span>

                  {/* Floating particles */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse opacity-70" />
                  <div
                    className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full animate-pulse opacity-70"
                    style={{ animationDelay: "500ms" }}
                  />
                </motion.div>

                <motion.span
                  className={`mr-3 text-lg font-bold transition-all duration-300 ${
                    scrolled
                      ? "text-transparent bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text"
                      : "text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {schoolName}
                </motion.span>
              </motion.div>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
            {mainNavLinks.map((link) =>
              // If item has children, render as dropdown
              link.children && link.children.length > 0 ? (
                <div key={link._id} className="relative">
                  <motion.button
                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center rounded-xl hover:bg-white/10 backdrop-blur-sm ${
                      scrolled
                        ? "text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/80"
                        : "text-indigo-600 hover:text-indigo-700"
                    }`}
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === link._id ? null : link._id
                      )
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Hover background effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />

                    <span className="relative z-10">{link.name}</span>
                    <ChevronDownIcon
                      className={`relative z-10 mr-1 h-4 w-4 transition-transform duration-300 ${
                        activeDropdown === link._id ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  {activeDropdown === link._id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 py-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-10"
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {/* Dropdown glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-50 blur-xl" />

                      {link.children.map((child, index) => (
                        <motion.a
                          key={child._id}
                          href={child.href}
                          className="relative block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 transition-all duration-200 rounded-lg mx-2"
                          onClick={() => setActiveDropdown(null)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                        >
                          {child.name}
                        </motion.a>
                      ))}
                    </motion.div>
                  )}
                </div>
              ) : (
                // Regular link without dropdown
                <motion.a
                  key={link._id}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl hover:bg-white/10 backdrop-blur-sm ${
                    scrolled
                      ? "text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/80"
                      : "text-indigo-600 hover:text-indigo-700"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Hover background effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />

                  <span className="relative z-10">{link.name}</span>
                </motion.a>
              )
            )}

            <motion.a
              href="/login"
              className="relative inline-flex items-center justify-center px-6 py-2.5 border border-transparent rounded-2xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 ml-4 transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-50 blur-lg group-hover:opacity-100 transition-opacity duration-300" />

              {/* Animated background */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />

              <span className="relative z-10 filter drop-shadow-sm">ورود</span>

              {/* Floating particle */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse opacity-70" />
            </motion.a>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <motion.button
              type="button"
              className={`relative inline-flex items-center justify-center p-3 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                scrolled
                  ? "text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/80"
                  : "text-indigo-600 hover:text-indigo-700 hover:bg-white/10"
              }`}
              onClick={() => setIsOpen(!isOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Hover background effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />

              <motion.div
                className="relative z-10"
                initial={false}
                animate={isOpen ? "open" : "closed"}
              >
                {isOpen ? (
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ rotate: 180 }}
                    animate={{ rotate: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  </motion.div>
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="md:hidden bg-white/95 backdrop-blur-xl border-t border-white/20"
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/5" />

          <div className="relative px-4 pt-4 pb-6 space-y-2 sm:px-6 max-h-[80vh] overflow-y-auto">
            {allNavLinks.map((link, index) => (
              <motion.a
                key={link._id}
                href={link.href}
                className="block px-4 py-3 rounded-2xl text-base font-medium text-gray-900 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 transition-all duration-300"
                onClick={() => setIsOpen(false)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                {link.name}
              </motion.a>
            ))}

            <motion.a
              href="/login"
              className="relative block px-4 py-3 rounded-2xl text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-center mt-6 shadow-lg transition-all duration-300"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: allNavLinks.length * 0.1 + 0.2,
                duration: 0.3,
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-50 blur-lg" />

              <span className="relative z-10 filter drop-shadow-sm">ورود</span>

              {/* Floating particle */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse opacity-70" />
            </motion.a>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
