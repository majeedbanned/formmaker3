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
  }, []);

  const fetchNavItems = async () => {
    try {
      const response = await fetch("/api/admin/navigation");
      const data = await response.json();
      if (data.success) {
        const items = data.items || [];
        const organizedItems = organizeNavItems(items);
        setNavItems(organizedItems);
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

  const organizeNavItems = (items: NavItem[]) => {
    const activeItems = items.filter((item) => item.isActive);
    console.log("Active items count:", activeItems.length);

    const mainItems = activeItems.filter(
      (item) => !item.parent && item.type === "main"
    );
    console.log("Main items:", mainItems);

    const dropdownItems = activeItems.filter(
      (item) => item.parent && item.type === "dropdown"
    );
    console.log("Dropdown items:", dropdownItems);

    const result = mainItems
      .map((item) => ({
        ...item,
        children: dropdownItems.filter((child) => child.parent === item._id),
      }))
      .sort((a, b) => a.order - b.order);

    console.log("Final organized result:", result);
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">پ</span>
                  </div>
                  <span className="mr-2 text-xl font-bold text-gray-900">
                    پارسا‌موز
                  </span>
                </div>
              </Link>
            </div>
            <div className="hidden md:flex items-center">
              <div className="animate-pulse bg-gray-200 h-4 w-96 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

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
            {mainNavLinks.map((link) =>
              // If item has children, render as dropdown
              link.children && link.children.length > 0 ? (
                <div key={link._id} className="relative">
                  <button
                    className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                      scrolled
                        ? "text-gray-900 hover:text-indigo-600"
                        : "text-indigo-300 hover:text-indigo-500"
                    }`}
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === link._id ? null : link._id
                      )
                    }
                  >
                    {link.name}
                    <ChevronDownIcon
                      className={`mr-1 h-4 w-4 transition-transform ${
                        activeDropdown === link._id ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {activeDropdown === link._id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-10"
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {link.children.map((child) => (
                        <a
                          key={child._id}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                          onClick={() => setActiveDropdown(null)}
                        >
                          {child.name}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </div>
              ) : (
                // Regular link without dropdown
                <a
                  key={link._id}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    scrolled
                      ? "text-gray-900 hover:text-indigo-600"
                      : "text-indigo-300 hover:text-indigo-500"
                  }`}
                >
                  {link.name}
                </a>
              )
            )}

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
                  : "text-indigo-300 hover:text-indigo-500"
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
                key={link._id}
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
