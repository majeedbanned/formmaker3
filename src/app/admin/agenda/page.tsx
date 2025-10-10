"use client";

import { useAuth } from "@/hooks/useAuth";
import AgendaView from "./components/AgendaView";
import { useState, useEffect } from "react";

export default function AgendaPage() {
  const { user, isLoading } = useAuth();
  const [isAdminTeacher, setIsAdminTeacher] = useState(false);

  // Check if teacher has adminAccess
  useEffect(() => {
    const checkTeacherAdminAccess = async () => {
      if (!user || user.userType !== "teacher" || !user.username) {
        setIsAdminTeacher(false);
        return;
      }

      try {
        const response = await fetch(`/api/teachers?schoolCode=${user.schoolCode}`);
        if (!response.ok) {
          console.error("Failed to fetch teacher data");
          setIsAdminTeacher(false);
          return;
        }

        const teachers = await response.json();
        const currentTeacher = teachers.find(
          (t: any) => t.data?.teacherCode === user.username
        );

        if (currentTeacher?.data?.adminAccess === true) {
          setIsAdminTeacher(true);
        } else {
          setIsAdminTeacher(false);
        }
      } catch (err) {
        console.error("Error checking teacher admin access:", err);
        setIsAdminTeacher(false);
      }
    };

    checkTeacherAdminAccess();
  }, [user]);

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
  // if (
  //   user.userType !== "school" &&
  //   user.userType !== "teacher" &&
  //   user.userType !== "student"
  // ) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center" dir="rtl">
  //       <div className="text-center p-6 bg-white rounded-lg shadow-md">
  //         <h2 className="text-xl font-bold text-red-600 mb-2">خطا در دسترسی</h2>
  //         <p className="text-gray-600">
  //           شما دسترسی لازم برای مشاهده این صفحه را ندارید.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <AgendaView
        schoolCode={user.schoolCode}
        userType={user.userType}
        teacherCode={user.username}
        isAdminTeacher={isAdminTeacher}
      />
    </div>
  );
}
