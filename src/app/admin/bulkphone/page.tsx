"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BulkPhoneInsert from "./components/BulkPhoneInsert";

export default function BulkPhonePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Only school users can access this feature
    if (user.userType !== "school") {
      router.push("/admin/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">
            ثبت گروهی شماره تلفن دانش‌آموزان
          </h1>
          <p className="text-green-100 mt-2">
            ثبت سریع و آسان شماره تلفن والدین دانش‌آموزان
          </p>
        </div>

        <div className="p-6">
          <BulkPhoneInsert user={user} />
        </div>
      </div>
    </div>
  );
}
