"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function BBBMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const className = decodeURIComponent(params.className as string);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      toast.error("لطفاً ابتدا وارد شوید");
      router.push("/login");
      return;
    }

    const joinMeeting = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch class details
        const classResponse = await fetch("/api/data/onlineclasses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            filter: {
              "data.onlineClassName": className,
              "data.schoolCode": user.schoolCode,
            },
          }),
        });

        if (!classResponse.ok) {
          throw new Error("کلاس مورد نظر یافت نشد");
        }

        const classData = await classResponse.json();
        if (!classData || classData.length === 0) {
          throw new Error("کلاس مورد نظر یافت نشد");
        }

        const classInfo = classData[0];
        const classCode = classInfo.data.onlineClassCode;

        // Get user's full name
        let fullName = user.username;
        if (user.userType === "student") {
          fullName = `${user.studentName || ""} ${user.studentFamily || ""}`.trim();
        } else if (user.userType === "teacher") {
          fullName = `${user.teacherName || ""} ${user.teacherFamily || ""}`.trim();
        } else if (user.userType === "school") {
          fullName = user.schoolName || user.username;
        }

        // Request to join/create meeting
        const joinResponse = await fetch("/api/bbb/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            classCode,
            className,
            userName: fullName || user.username,
            userType: user.userType,
            userId: user.username,
            schoolCode: user.schoolCode,
          }),
        });

        const joinData = await joinResponse.json();

        if (!joinResponse.ok || !joinData.success) {
          throw new Error(joinData.error || "خطا در اتصال به کلاس");
        }

        setJoinUrl(joinData.joinUrl);

        // Show appropriate message
        if (joinData.isNewMeeting) {
          toast.success("کلاس جدید ایجاد شد، در حال انتقال...");
        } else {
          toast.success("در حال اتصال به کلاس...");
        }

        // Redirect to BBB meeting
        window.location.href = joinData.joinUrl;

      } catch (err) {
        console.error("Error joining meeting:", err);
        const errorMessage = err instanceof Error ? err.message : "خطا در اتصال به کلاس";
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
      }
    };

    joinMeeting();
  }, [user, className, router]);

  if (loading && !error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-xl max-w-md">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            در حال اتصال به کلاس
          </h2>
          <p className="text-lg text-gray-600 mb-4">{className}</p>
          <div className="flex items-center justify-center space-x-reverse space-x-2 text-sm text-gray-500">
            <div className="animate-pulse">●</div>
            <span>لطفاً صبر کنید</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-xl max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">خطا در اتصال</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              تلاش مجدد
            </button>
            <button
              onClick={() => router.push("/admin/myclass")}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This state should not be reached as we redirect, but keep it as fallback
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
      <div className="text-center bg-white p-8 rounded-xl shadow-xl max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">در حال انتقال...</h2>
        <p className="text-gray-600 mb-4">
          اگر به صورت خودکار منتقل نشدید، روی دکمه زیر کلیک کنید
        </p>
        {joinUrl && (
          <a
            href={joinUrl}
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ورود به کلاس
          </a>
        )}
      </div>
    </div>
  );
}
