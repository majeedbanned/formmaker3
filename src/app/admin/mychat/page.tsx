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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 p-4 mb-2 rtl:text-right">
          سامانه گفتگو
        </h1>
        <ChatLayout user={user} />
      </div>
    </main>
  );
}
