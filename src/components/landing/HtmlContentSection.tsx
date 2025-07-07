"use client";

import React, { useEffect, useRef, useState } from "react";
import { ModuleProps } from "@/types/modules";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import { CogIcon } from "@heroicons/react/24/outline";
import HtmlContentEditModal from "./HtmlContentEditModal";
import { toast } from "sonner";

interface HtmlContentConfig {
  html: string;
  css: string;
  javascript: string;
  title?: string;
  description?: string;
  isVisible?: boolean;
}

const HtmlContentSection: React.FC<ModuleProps> = ({
  moduleConfig,
  onSave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user, isAuthenticated } = usePublicAuth();
  const config = {
    html: "",
    css: "",
    javascript: "",
    title: "",
    description: "",
    isVisible: true,
    ...moduleConfig.config,
  } as HtmlContentConfig;

  // Check if user is school admin
  const isSchoolAdmin = isAuthenticated && user?.userType === "school";

  const { html, css, javascript, title, description, isVisible } = config;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Clear previous content
    container.innerHTML = "";

    // Create a wrapper div for the HTML content
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "html-content-wrapper";

    // Add the HTML content
    if (html) {
      contentWrapper.innerHTML = html;
    }

    // Add CSS styles
    if (css) {
      const styleElement = document.createElement("style");
      styleElement.textContent = css;
      container.appendChild(styleElement);
    }

    // Add the content wrapper
    container.appendChild(contentWrapper);

    // Execute JavaScript (with safety measures)
    if (javascript) {
      try {
        // Create a script element
        const scriptElement = document.createElement("script");
        scriptElement.textContent = `
          (function() {
            try {
              ${javascript}
            } catch (error) {
              console.error('Error in HTML content module JavaScript:', error);
            }
          })();
        `;
        container.appendChild(scriptElement);
      } catch (error) {
        console.error(
          "Error executing JavaScript in HTML content module:",
          error
        );
      }
    }

    // Cleanup function
    return () => {
      // Remove any event listeners or cleanup if needed
      const scripts = container.querySelectorAll("script");
      scripts.forEach((script) => script.remove());
    };
  }, [html, css, javascript]);

  const handleSaveConfig = (newConfig: HtmlContentConfig) => {
    // Close the modal
    setShowEditModal(false);

    // Call the parent's save handler if provided
    if (onSave) {
      onSave(moduleConfig.id, newConfig as unknown as Record<string, unknown>);
    }

    toast.success("تنظیمات با موفقیت ذخیره شد");
  };

  // Show admin placeholder if section is invisible
  if (!isVisible) {
    // Show nothing for regular users
    if (!isSchoolAdmin) {
      return null;
    }

    // Show admin placeholder with settings access
    return (
      <section
        className="relative bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300 py-8"
        dir="rtl"
      >
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <span className="text-4xl">📄</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              محتوای HTML غیرفعال است
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
              تنظیمات محتوای HTML
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <HtmlContentEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveConfig}
            initialData={config}
          />
        )}
      </section>
    );
  }

  return (
    <section className="html-content-section py-8 relative" dir="rtl">
      {/* Settings Icon for School Admins */}
      {isSchoolAdmin && (
        <button
          onClick={() => setShowEditModal(true)}
          className="absolute top-4 left-4 z-20 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 group"
          title="ویرایش محتوای HTML"
        >
          <CogIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
        </button>
      )}

      <div className="container mx-auto px-4">
        {/* Optional title and description */}
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
            {description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
        )}

        {/* HTML Content Container */}
        <div
          ref={containerRef}
          className="html-content-container"
          style={{
            width: "100%",
            minHeight: html || css || javascript ? "50px" : "auto",
          }}
        />

        {/* Empty state */}
        {!html && !css && !javascript && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-400 text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              محتوای HTML
            </h3>
            <p className="text-gray-500">
              محتوای سفارشی HTML، CSS و JavaScript در اینجا نمایش داده می‌شود
            </p>
            {isSchoolAdmin && (
              <button
                onClick={() => setShowEditModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <CogIcon className="h-5 w-5" />
                ویرایش محتوا
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <HtmlContentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveConfig}
          initialData={config}
        />
      )}
    </section>
  );
};

export default HtmlContentSection;
