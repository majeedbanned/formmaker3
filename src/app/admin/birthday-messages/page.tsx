"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  CakeIcon,
  HeartIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import moment from "moment-jalaali";

interface BirthdayMessage {
  _id: string;
  senderCode: string;
  senderName: string;
  senderType: "student" | "teacher" | "school";
  recipientCode: string;
  recipientName: string;
  recipientType: "student" | "teacher";
  message: string;
  messageType: string;
  schoolCode: string;
  isRead: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  readAt?: string;
}

export default function BirthdayMessagesPage() {
  const { user, isLoading, error: authError, isAuthenticated } = useAuth();
  const [receivedMessages, setReceivedMessages] = useState<BirthdayMessage[]>(
    []
  );
  const [sentMessages, setSentMessages] = useState<BirthdayMessage[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>("");

  // Fetch received messages
  const fetchReceivedMessages = useCallback(async () => {
    try {
      const response = await fetch("/api/birthday-messages/received", {
        headers: {
          "x-domain": window.location.host,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReceivedMessages(data.messages);
      } else {
        throw new Error(data.error || "خطا در بارگیری پیام‌های دریافتی");
      }
    } catch (err) {
      console.error("Error fetching received messages:", err);
      setError(err instanceof Error ? err.message : "خطا در بارگیری پیام‌ها");
    }
  }, []);

  // Fetch sent messages
  const fetchSentMessages = useCallback(async () => {
    try {
      const response = await fetch("/api/birthday-messages/sent", {
        headers: {
          "x-domain": window.location.host,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSentMessages(data.messages);
      } else {
        throw new Error(data.error || "خطا در بارگیری پیام‌های ارسالی");
      }
    } catch (err) {
      console.error("Error fetching sent messages:", err);
      setError(err instanceof Error ? err.message : "خطا در بارگیری پیام‌ها");
    }
  }, []);

  // Handle edit message
  const handleEditMessage = useCallback(
    async (messageId: string, newMessage: string) => {
      try {
        const response = await fetch("/api/birthday-messages/edit", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            messageId: messageId,
            newMessage: newMessage,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Update the message in sent messages
          setSentMessages((prev) =>
            prev.map((msg) =>
              msg._id === messageId
                ? {
                    ...msg,
                    message: newMessage,
                    isEdited: true,
                    editedAt: new Date().toISOString(),
                  }
                : msg
            )
          );
          setEditingMessage(null);
          setEditedText("");
          alert("پیام با موفقیت ویرایش شد!");
        } else {
          throw new Error(data.error || "خطا در ویرایش پیام");
        }
      } catch (err) {
        console.error("Error editing message:", err);
        alert(err instanceof Error ? err.message : "خطا در ویرایش پیام");
      }
    },
    []
  );

  // Start editing
  const startEdit = useCallback((message: BirthdayMessage) => {
    setEditingMessage(message._id);
    setEditedText(message.message);
  }, []);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingMessage(null);
    setEditedText("");
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    const date = moment(dateString);
    return date.format("jYYYY/jMM/jDD - HH:mm");
  }, []);

  // Get user type icon
  const getUserTypeIcon = useCallback(
    (type: "student" | "teacher" | "school") => {
      switch (type) {
        case "teacher":
          return <UserIcon className="h-4 w-4 text-blue-600" />;
        case "school":
          return <UserIcon className="h-4 w-4 text-purple-600" />;
        default:
          return <UserIcon className="h-4 w-4 text-green-600" />;
      }
    },
    []
  );

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user) return;

      setLoading(true);
      try {
        if (activeTab === "received") {
          await fetchReceivedMessages();
        } else {
          await fetchSentMessages();
        }
      } catch (err) {
        setError("خطا در بارگیری اطلاعات");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    activeTab,
    isAuthenticated,
    user,
    fetchReceivedMessages,
    fetchSentMessages,
  ]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">خطا: {authError}</p>
        </div>
      </div>
    );
  }

  const currentMessages =
    activeTab === "received" ? receivedMessages : sentMessages;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50"
      dir="rtl"
    >
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <CakeIcon className="h-8 w-8 text-pink-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                پیام‌های تولد
              </h1>
              <p className="text-gray-600">
                مدیریت پیام‌های تولد ارسالی و دریافتی
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 space-x-reverse">
            <button
              onClick={() => setActiveTab("received")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "received"
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              پیام‌های دریافتی ({receivedMessages.length})
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "sent"
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              پیام‌های ارسالی ({sentMessages.length})
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-pink-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600">در حال بارگیری پیام‌ها...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : currentMessages.length === 0 ? (
            <div className="text-center py-12">
              <HeartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {activeTab === "received"
                  ? "پیام تولد دریافتی وجود ندارد"
                  : "پیام تولد ارسالی وجود ندارد"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentMessages.map((message) => (
                <div
                  key={message._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-pink-25 to-purple-25"
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      {getUserTypeIcon(
                        activeTab === "received"
                          ? message.senderType
                          : message.recipientType
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {activeTab === "received"
                            ? `از: ${message.senderName}`
                            : `به: ${message.recipientName}`}
                        </p>
                        <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500">
                          <CalendarDaysIcon className="h-3 w-3" />
                          <span>{formatDate(message.createdAt)}</span>
                          {message.isEdited && (
                            <span className="text-orange-600">
                              (ویرایش شده)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit button for sent messages */}
                    {activeTab === "sent" && (
                      <button
                        onClick={() => startEdit(message)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="ویرایش پیام"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Message Content */}
                  {editingMessage === message._id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        rows={3}
                        placeholder="پیام جدید را وارد کنید..."
                      />
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() =>
                            handleEditMessage(message._id, editedText)
                          }
                          disabled={!editedText.trim()}
                          className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <CheckIcon className="h-4 w-4" />
                          <span>ذخیره</span>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          <span>انصراف</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-lg border-r-4 border-pink-500">
                      <p className="text-gray-800 leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
