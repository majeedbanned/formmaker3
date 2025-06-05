"use client";
import { useAuth } from "@/hooks/useAuth";
import { SurveyWidget } from "../components/widgets";

export default function Dashboard() {
  const { user, isLoading, error, logout, isAuthenticated, hasPermission } =
    useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">خطا: {error}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">لطفاً وارد شوید</p>
        </div>
      </div>
    );
  }

  // Check permissions based on system name
  const canViewSchools = hasPermission("attendance", "view");
  const canEditSchools = hasPermission("attendance", "edit");
  const canDeleteSchools = hasPermission("attendance", "delete");
  const canCreateSchools = hasPermission("attendance", "list");

  // Check permissions for other systems based on user type
  const canManageTeachers = hasPermission("attendance", "groupDelete");
  const canManageStudents = hasPermission("attendance", "show");
  const canManageClasses = hasPermission("attendance", "search");

  console.log(user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6" dir="rtl">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                خوش آمدید، {user.name}!
              </h1>
              <p className="text-gray-600 text-lg">
                {user.userType === "student"
                  ? "به پنل دانش‌آموزی خود خوش آمدید"
                  : user.userType === "teacher"
                  ? "به پنل آموزشی خود خوش آمدید"
                  : "به پنل مدیریتی خود خوش آمدید"}
              </p>
            </div>
            <div className="text-left">
              <div className="text-sm text-gray-500 mb-1">مدرسه</div>
              <div className="font-semibold text-gray-800">
                {user.schoolCode}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
              <p className="text-blue-600 font-medium text-sm">نوع کاربر</p>
              <p className="text-blue-800 font-bold text-lg">{user.userType}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
              <p className="text-green-600 font-medium text-sm">نام کاربری</p>
              <p className="text-green-800 font-bold text-lg">
                {user.username}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
              <p className="text-purple-600 font-medium text-sm">نقش</p>
              <p className="text-purple-800 font-bold text-lg">{user.role}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
              <p className="text-orange-600 font-medium text-sm">نام</p>
              <p className="text-orange-800 font-bold text-lg">{user.name}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Survey Widget - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <SurveyWidget />
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={logout}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
          >
            خروج از حساب
          </button>
        </div>
      </div>
    </div>
  );
}
