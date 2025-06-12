"use client";

import PageHeader from "./PageHeader";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  BookOpenIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const PageHeaderDemo = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            نمونه‌های PageHeader
          </h1>
          <p className="text-gray-600">
            مثال‌های مختلف استفاده از کامپوننت PageHeader
          </p>
        </div>

        {/* Default Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            حالت پیش‌فرض
          </h2>
          <PageHeader title="عنوان صفحه" />
        </div>

        {/* Header with Icon */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">با آیکون</h2>
          <PageHeader
            title="مدیریت دانش‌آموزان"
            icon={<UserGroupIcon className="w-6 h-6" />}
          />
        </div>

        {/* Header with Icon and Subtitle */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            با آیکون و زیرنویس
          </h2>
          <PageHeader
            title="گزارش‌ها و آمار"
            subtitle="مشاهده آمار و گزارش‌های جامع سیستم"
            icon={<ChartBarIcon className="w-6 h-6" />}
          />
        </div>

        {/* Header with Gradient */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            با پس‌زمینه گرادیان
          </h2>
          <PageHeader
            title="تنظیمات سیستم"
            subtitle="پیکربندی و تنظیمات عمومی"
            icon={<CogIcon className="w-6 h-6" />}
            gradient={true}
          />
        </div>

        {/* Small Size Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            اندازه کوچک
          </h2>
          <PageHeader
            title="کتابخانه"
            subtitle="مدیریت منابع آموزشی"
            icon={<BookOpenIcon className="w-6 h-6" />}
            size="sm"
          />
        </div>

        {/* Large Size Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            اندازه بزرگ
          </h2>
          <PageHeader
            title="برنامه زمانی"
            subtitle="مدیریت برنامه کلاسی و جلسات"
            icon={<CalendarIcon className="w-6 h-6" />}
            size="lg"
            gradient={true}
          />
        </div>

        {/* Complete Example - Similar to Teachers Page */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            مثال کامل (مشابه صفحه معلمان)
          </h2>
          <PageHeader
            title="تعریف معلمان مدرسه"
            subtitle="مدیریت اطلاعات معلمان مدرسه"
            icon={<AcademicCapIcon className="w-6 h-6" />}
            gradient={true}
          />
        </div>
      </div>
    </div>
  );
};

export default PageHeaderDemo;
