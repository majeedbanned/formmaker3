import React from "react";

const ChatLoadingState = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-4 text-lg text-gray-600">در حال بارگذاری گفتگو...</p>
      </div>
    </div>
  );
};

export default ChatLoadingState;
