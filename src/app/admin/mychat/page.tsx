"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import ChatLayout from "./components/ChatLayout";
import ChatLoadingState from "./components/ChatLoadingState";

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoadingState />}>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const { user, isLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      setIsInitialized(true);
    }
  }, [isLoading, user]);

  if (isLoading || !isInitialized) {
    return <ChatLoadingState />;
  }

  if (!user) {
    return <ChatLoadingState />;
  }

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  سامانه گفتگو
                </h1>
                <p className="text-sm text-gray-600">خوش آمدید، {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-2">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                آنلاین
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {user?.name?.charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Layout */}
        <ChatLayout user={user} />
      </div>
    </main>
  );
}
