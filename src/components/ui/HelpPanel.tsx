import React, { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: HelpSection[];
  className?: string;
}

export default function HelpPanel({
  isOpen,
  onClose,
  title,
  sections,
  className = "",
}: HelpPanelProps) {
  const [activeSection, setActiveSection] = useState<string>(
    sections[0]?.id || ""
  );
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const activeContent = sections.find(
    (section) => section.id === activeSection
  );

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${className}`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Book className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">راهنمای استفاده از صفحه</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex h-[calc(100vh-88px)]">
          {/* Sidebar Navigation */}
          <div className="w-80 border-l border-gray-200 bg-gray-50/50">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-right p-3 rounded-lg transition-all duration-200 flex items-center gap-3 group ${
                        isActive
                          ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                          : "hover:bg-white hover:shadow-sm text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`p-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-blue-200 text-blue-700"
                              : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm leading-tight">
                          {section.title}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            isActive
                              ? "bg-blue-200 text-blue-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden" dir="rtl">
            <ScrollArea className="h-full">
              <div className="p-6">
                {activeContent && (
                  <div className="space-y-6">
                    {/* Section Header */}
                    <div
                      className="flex items-center gap-3 pb-4 border-b border-gray-200"
                      dir="rtl"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <activeContent.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 text-right">
                        {activeContent.title}
                      </h3>
                    </div>

                    {/* Section Content */}
                    <div
                      className="prose prose-sm max-w-none text-right"
                      dir="rtl"
                      style={{ direction: "rtl" }}
                    >
                      {activeContent.content}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const currentIndex = sections.findIndex(
                  (s) => s.id === activeSection
                );
                if (currentIndex > 0) {
                  setActiveSection(sections[currentIndex - 1].id);
                }
              }}
              disabled={sections.findIndex((s) => s.id === activeSection) === 0}
              className="flex items-center gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              قبلی
            </Button>

            <div className="text-sm text-gray-500">
              {sections.findIndex((s) => s.id === activeSection) + 1} از{" "}
              {sections.length}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const currentIndex = sections.findIndex(
                  (s) => s.id === activeSection
                );
                if (currentIndex < sections.length - 1) {
                  setActiveSection(sections[currentIndex + 1].id);
                }
              }}
              disabled={
                sections.findIndex((s) => s.id === activeSection) ===
                sections.length - 1
              }
              className="flex items-center gap-2"
            >
              بعدی
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
