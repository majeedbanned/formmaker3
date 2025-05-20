"use client";

import { useAuth } from "@/hooks/useAuth";
import AgendaView from "./components/AgendaView";

export default function AgendaPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100"></div>
          <div className="h-4 w-32 bg-blue-100 rounded"></div>
          <div className="text-sm text-gray-500">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">خطا در دسترسی</h2>
          <p className="text-gray-600">
            برای مشاهده این صفحه باید وارد سیستم شوید.
          </p>
        </div>
      </div>
    );
  }

  // Check if user has admin or teacher access
  if (user.userType !== "school" && user.userType !== "teacher") {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">خطا در دسترسی</h2>
          <p className="text-gray-600">
            شما دسترسی لازم برای مشاهده این صفحه را ندارید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <AgendaView
        schoolCode={user.schoolCode}
        userType={user.userType}
        teacherCode={user.username}
      />
    </div>
  );
}
