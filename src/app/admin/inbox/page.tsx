"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  EnvelopeIcon,
  TrashIcon,
  StarIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { toast } from "sonner";

// Message interface
interface Message {
  _id: string;
  data: {
    mailId: string;
    sendername: string;
    sendercode: string;
    title: string;
    persiandate: string;
    message: string;
    receivercode: string;
    files: string[];
    isRead: boolean;
    isFavorite?: boolean;
    createdAt: string;
  };
}

export default function InboxPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");

  // Fetch messages
  const fetchMessages = async () => {
    if (!user?.username) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/messages/inbox?page=${page}&limit=${limit}&receivercode=${user.username}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("خطا در دریافت پیام‌ها");
    } finally {
      setLoading(false);
    }
  };

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch("/api/messages/mark-as-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark message as read");
      }

      // Update local state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId
            ? { ...msg, data: { ...msg.data, isRead: true } }
            : msg
        )
      );

      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage((prev) =>
          prev
            ? {
                ...prev,
                data: { ...prev.data, isRead: true },
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (messageId: string) => {
    const message = messages.find((msg) => msg._id === messageId);
    if (!message) return;

    const currentStatus = message.data.isFavorite || false;

    try {
      const response = await fetch("/api/messages/toggle-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, isFavorite: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update favorite status");
      }

      // Update local state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId
            ? { ...msg, data: { ...msg.data, isFavorite: !currentStatus } }
            : msg
        )
      );

      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage((prev) =>
          prev
            ? {
                ...prev,
                data: { ...prev.data, isFavorite: !currentStatus },
              }
            : null
        );
      }

      toast.success(
        currentStatus
          ? "پیام از نشان‌شده‌ها حذف شد"
          : "پیام به نشان‌شده‌ها اضافه شد"
      );
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      toast.error("خطا در بروزرسانی وضعیت نشان");
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch("/api/messages/delete-message", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      // Update local state
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );

      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage(null);
        setViewMode("list");
      }

      toast.success("پیام با موفقیت حذف شد");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("خطا در حذف پیام");
    }
  };

  // Handle message selection
  const handleMessageSelect = async (message: Message) => {
    setSelectedMessage(message);
    setViewMode("detail");

    // Mark as read if not already read
    if (!message.data.isRead) {
      await markAsRead(message._id);
    }
  };

  // Handle pagination
  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // Effect for initial load and page changes
  useEffect(() => {
    if (!authLoading && user) {
      fetchMessages();
    }
  }, [user, authLoading, page, limit]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Render message detail view
  const renderMessageDetail = () => {
    if (!selectedMessage) return null;

    return (
      <div
        className="bg-white rounded-lg shadow-md p-6 mb-4 text-right"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setViewMode("list")}
            className="text-blue-500 flex items-center gap-1"
          >
            <ChevronRightIcon className="h-5 w-5" />
            بازگشت به لیست
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(selectedMessage._id)}
              className="text-yellow-500 hover:text-yellow-600"
            >
              {selectedMessage.data.isFavorite ? (
                <StarIconSolid className="h-6 w-6" />
              ) : (
                <StarIcon className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={() => deleteMessage(selectedMessage._id)}
              className="text-red-500 hover:text-red-600"
            >
              <TrashIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedMessage.data.title}
          </h2>
          <div className="flex justify-between text-gray-600 mt-2">
            <span>فرستنده: {selectedMessage.data.sendername}</span>
            <span>تاریخ: {selectedMessage.data.persiandate}</span>
          </div>
        </div>

        <div className="mb-6">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedMessage.data.message }}
          />
        </div>

        {selectedMessage.data.files &&
          selectedMessage.data.files.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-bold text-lg mb-2">فایل‌های پیوست:</h3>
              <ul className="space-y-2">
                {selectedMessage.data.files.map((file, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      دانلود فایل {idx + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    );
  };

  // Render message list
  const renderMessageList = () => {
    if (loading) {
      return (
        <div className="flex justify-center my-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <EnvelopeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">هیچ پیامی وجود ندارد.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {messages.map((message) => (
            <li key={message._id} className="hover:bg-gray-50">
              <div
                className="flex items-start px-4 py-4 sm:px-6 cursor-pointer"
                onClick={() => handleMessageSelect(message)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between">
                    <h3
                      className={`text-base ${
                        !message.data.isRead
                          ? "font-bold"
                          : "font-medium text-gray-400"
                      } `}
                    >
                      {message.data.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {message.data.isFavorite && (
                        <StarIconSolid className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="text-sm text-gray-500">
                        {message.data.persiandate}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 truncate">
                    {message.data.sendername}
                  </p>
                </div>
                <div className="flex shrink-0 ml-4 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(message._id);
                    }}
                    className="text-gray-400 hover:text-yellow-500"
                  >
                    {message.data.isFavorite ? (
                      <StarIconSolid className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <StarIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(message._id);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                قبلی
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                بعدی
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  صفحه <span className="font-medium">{page}</span> از{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">قبلی</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => goToPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          page === pageNum
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        } text-sm font-medium`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">بعدی</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">صندوق پیام‌ها</h1>
          <div className="flex gap-4">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value={10}>10 پیام در هر صفحه</option>
              <option value={25}>25 پیام در هر صفحه</option>
              <option value={50}>50 پیام در هر صفحه</option>
            </select>
          </div>
        </div>

        {viewMode === "list" ? renderMessageList() : renderMessageDetail()}
      </div>
    </main>
  );
}
