import React from "react";

const ChatLoadingState = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50"
      dir="rtl"
    >
      <div className="text-center p-8">
        {/* Loading Animation */}
        <div className="relative mb-8">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 rounded-full animate-pulse bg-blue-100 opacity-20"></div>
        </div>

        {/* Loading Text */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-800">
            در حال بارگذاری سامانه گفتگو
          </h2>
          <p className="text-gray-600">لطفاً صبر کنید...</p>
        </div>

        {/* Loading Dots Animation */}
        <div className="flex justify-center space-x-reverse space-x-1 mt-6">
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ChatLoadingState;
