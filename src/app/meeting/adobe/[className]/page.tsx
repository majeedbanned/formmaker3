"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AdobeMeetingPage() {
  const params = useParams();
  const className = params.className;
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Here you would typically connect to the Adobe Connect API
    // For now, we're just simulating a loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">در حال اتصال به کلاس {className}...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-center mb-6">کلاس آنلاین Adobe Connect</h1>
        <h2 className="text-xl text-center mb-8">{className}</h2>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            این یک صفحه نمونه است. در نسخه نهایی، کاربر به صورت خودکار به جلسه Adobe Connect متصل خواهد شد.
          </p>
        </div>
        
        <div className="aspect-video bg-gray-200 rounded mb-6 flex items-center justify-center">
          <p className="text-gray-600">محل قرارگیری ویدیو کنفرانس</p>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            خروج از کلاس
          </button>
        </div>
      </div>
    </div>
  );
}