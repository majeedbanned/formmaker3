"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import StudentTimeline from "./components/StudentTimeline";
import { Loader2 } from "lucide-react";

export default function DailyTimelinePage() {
  const { user, isLoading, error } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user authentication is complete
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4" />
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center text-red-500">
          <p>خطا در بارگذاری اطلاعات: {error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <p>لطفا وارد شوید.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          تایم لاین روزانه
        </h1>
        <StudentTimeline user={user} />
      </div>
    </main>
  );
}
