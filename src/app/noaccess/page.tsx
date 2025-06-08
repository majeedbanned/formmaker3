"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldXIcon, ArrowLeftIcon } from "lucide-react";

export default function NoAccessPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push("/admin/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <ShieldXIcon className="mx-auto h-24 w-24 text-red-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            دسترسی محدود
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            شما به این صفحه دسترسی ندارید. لطفاً با مدیر سیستم تماس بگیرید.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            بازگشت
          </Button>

          <Button onClick={handleGoHome} className="w-full">
            صفحه اصلی
          </Button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          اگر فکر می‌کنید این خطا اشتباه است، لطفاً با پشتیبانی تماس بگیرید.
        </div>
      </div>
    </div>
  );
}
