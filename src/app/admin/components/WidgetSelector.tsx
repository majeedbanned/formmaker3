"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import {
  X,
  FileText,
  Calendar,
  Users,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
} from "lucide-react";

interface WidgetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AvailableWidget {
  type: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  available: boolean;
}

const AVAILABLE_WIDGETS: AvailableWidget[] = [
  {
    type: "SurveyWidget",
    name: "نظرسنجی‌ها",
    description: "مشاهده و شرکت در نظرسنجی‌های فعال",
    icon: FileText,
    color: "bg-blue-500",
    available: true,
  },
  {
    type: "BirthdateWidget",
    name: "تولدها",
    description: "تبریک تولد به دانش‌آموزان و همکاران",
    icon: Calendar,
    color: "bg-pink-500",
    available: true,
  },
  {
    type: "StudentsSearchWidget",
    name: "جستجوی دانش‌آموزان",
    description: "جستجو و مشاهده دانش‌آموزان",
    icon: Users,
    color: "bg-green-500",
    available: true,
  },
  {
    type: "FormsWidget",
    name: "فرم‌های من",
    description: "مشاهده و مدیریت فرم‌ها",
    icon: FileText,
    color: "bg-indigo-500",
    available: true,
  },
  {
    type: "AnalyticsWidget",
    name: "آمار و تحلیل",
    description: "نمودارها و گزارش‌های آماری",
    icon: BarChart3,
    color: "bg-purple-500",
    available: false,
  },
  {
    type: "MessagesWidget",
    name: "پیام‌ها",
    description: "پیام‌های دریافتی و ارسالی",
    icon: MessageSquare,
    color: "bg-orange-500",
    available: false,
  },
  {
    type: "NotificationsWidget",
    name: "اعلان‌ها",
    description: "اعلان‌ها و یادآوری‌ها",
    icon: Bell,
    color: "bg-red-500",
    available: false,
  },
  {
    type: "SettingsWidget",
    name: "تنظیمات",
    description: "تنظیمات سریع سیستم",
    icon: Settings,
    color: "bg-gray-500",
    available: false,
  },
];

function DraggableWidgetItem({ widget }: { widget: AvailableWidget }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `widget-${widget.type}`,
      data: {
        type: "new-widget",
        widgetType: widget.type,
      },
      disabled: !widget.available,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const IconComponent = widget.icon;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        p-4 rounded-lg border-2 transition-all duration-200 cursor-grab active:cursor-grabbing
        ${
          widget.available
            ? "border-gray-200 hover:border-blue-300 hover:shadow-lg bg-white"
            : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
        }
        ${isDragging ? "opacity-50 scale-110 shadow-2xl z-50" : ""}
      `}
      whileHover={widget.available ? { scale: 1.02 } : {}}
      whileTap={widget.available ? { scale: 0.98 } : {}}
    >
      <div className="flex items-start space-x-3 space-x-reverse">
        <div
          className={`
          p-2 rounded-lg text-white flex-shrink-0
          ${widget.color}
        `}
        >
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`
            font-medium text-sm mb-1
            ${widget.available ? "text-gray-900" : "text-gray-500"}
          `}
          >
            {widget.name}
          </h3>
          <p
            className={`
            text-xs leading-relaxed
            ${widget.available ? "text-gray-600" : "text-gray-400"}
          `}
          >
            {widget.description}
          </p>
          {!widget.available && (
            <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
              به زودی
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function WidgetSelector({ isOpen, onClose }: WidgetSelectorProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  ویجت‌های موجود
                </h2>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5 text-gray-600" />
                </motion.button>
              </div>
              <p className="text-sm text-gray-600">
                ویجت‌ها را بکشید و در داشبورد خود قرار دهید
              </p>
            </div>

            {/* Widget List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {AVAILABLE_WIDGETS.map((widget, index) => (
                <motion.div
                  key={widget.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DraggableWidgetItem widget={widget} />
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                برای اضافه کردن ویجت، آن را بکشید و در داشبورد رها کنید
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
