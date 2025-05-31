"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  EnvelopeIcon,
  TrashIcon,
  StarIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUturnLeftIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  PlusIcon,
  ShareIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { getPersianDate } from "@/utils/dateUtils";

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
    readTime?: string;
    readPersianDate?: string;
    isFavorite?: boolean;
    createdAt: string;
  };
}

// Confirmation dialog component
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            تایید
          </button>
        </div>
      </div>
    </div>
  );
}

// Reply dialog component
function ReplyDialog({
  isOpen,
  onClose,
  onSend,
  originalMessage,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSend: (content: string, files: File[]) => void;
  originalMessage: Message | null;
}) {
  const [replyContent, setReplyContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...fileList]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setReplyContent("");
    setFiles([]);
  };

  if (!isOpen || !originalMessage) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            پاسخ به: {originalMessage.data.title}
          </h3>
          <button
            onClick={() => {
              clearForm();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm">
          <div className="font-bold mb-1">پیام اصلی:</div>
          <div className="line-clamp-3">
            {originalMessage.data.message.replace(/<[^>]*>/g, " ")}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="متن پاسخ خود را بنویسید..."
          className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />

        {/* File upload section */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200 flex items-center gap-1 text-sm"
            >
              <DocumentTextIcon className="h-4 w-4" />
              افزودن فایل
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="text-xs text-gray-500">
              {files.length > 0
                ? `${files.length} فایل انتخاب شده`
                : "حداکثر اندازه هر فایل: ۱۰ مگابایت"}
            </span>
          </div>

          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                    <span className="truncate max-w-xs">{file.name}</span>
                    <span className="text-gray-500 text-xs">
                      ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => {
              clearForm();
              onClose();
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            onClick={() => {
              if (replyContent.trim()) {
                onSend(replyContent, files);
                clearForm();
                onClose();
              }
            }}
            disabled={!replyContent.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            ارسال پاسخ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [messageType, setMessageType] = useState<"inbox" | "sent">("inbox");

  // Advanced features state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "sender" | "title" | "read">(
    "date"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">(
    "all"
  );
  const [attachmentFilter, setAttachmentFilter] = useState<
    "all" | "with" | "without"
  >("all");
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set()
  );
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(
    null
  );

  // State for dialogs
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);

  // Apply filters to messages
  useEffect(() => {
    let filtered = [...messages];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (msg) =>
          msg.data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.data.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.data.sendername
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          msg.data.receivercode
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Read status filter
    if (readFilter !== "all") {
      filtered = filtered.filter((msg) =>
        readFilter === "read" ? msg.data.isRead : !msg.data.isRead
      );
    }

    // Attachment filter
    if (attachmentFilter !== "all") {
      filtered = filtered.filter((msg) => {
        const hasAttachments = msg.data.files && msg.data.files.length > 0;
        return attachmentFilter === "with" ? hasAttachments : !hasAttachments;
      });
    }

    // Date filter
    if (dateFilter.from) {
      filtered = filtered.filter((msg) => {
        const msgDate = new Date(msg.data.createdAt);
        const fromDate = new Date(dateFilter.from);
        return msgDate >= fromDate;
      });
    }
    if (dateFilter.to) {
      filtered = filtered.filter((msg) => {
        const msgDate = new Date(msg.data.createdAt);
        const toDate = new Date(dateFilter.to);
        return msgDate <= toDate;
      });
    }

    // Starred filter
    if (showStarredOnly) {
      filtered = filtered.filter((msg) => msg.data.isFavorite);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "title":
          aVal = a.data.title;
          bVal = b.data.title;
          break;
        case "sender":
          aVal =
            messageType === "inbox" ? a.data.sendername : a.data.receivercode;
          bVal =
            messageType === "inbox" ? b.data.sendername : b.data.receivercode;
          break;
        case "read":
          aVal = a.data.isRead ? 1 : 0;
          bVal = b.data.isRead ? 1 : 0;
          break;
        default: // date
          aVal = new Date(a.data.createdAt).getTime();
          bVal = new Date(b.data.createdAt).getTime();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredMessages(filtered);
  }, [
    messages,
    searchQuery,
    readFilter,
    attachmentFilter,
    dateFilter,
    showStarredOnly,
    sortBy,
    sortOrder,
    messageType,
  ]);

  // Reset to page 1 when toggling starred filter or message type
  useEffect(() => {
    setPage(1);
  }, [showStarredOnly, messageType]);

  // Fetch messages
  const fetchMessages = async () => {
    if (!user?.username) return;

    setLoading(true);
    try {
      const endpoint =
        messageType === "inbox"
          ? `/api/messages/inbox?page=${page}&limit=${limit}&receivercode=${user.username}`
          : `/api/messages/sent?page=${page}&limit=${limit}&sendercode=${user.username}`;

      const response = await fetch(endpoint);
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
      // Get current time for read timestamp
      const now = new Date();
      const persianDate = getPersianDate();
      const readTime = now.toISOString();

      const response = await fetch("/api/messages/mark-as-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          readTime,
          readPersianDate: persianDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark message as read");
      }

      // Update local state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                data: {
                  ...msg.data,
                  isRead: true,
                  readTime,
                  readPersianDate: persianDate,
                },
              }
            : msg
        )
      );

      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage((prev) =>
          prev
            ? {
                ...prev,
                data: {
                  ...prev.data,
                  isRead: true,
                  readTime,
                  readPersianDate: persianDate,
                },
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

      // Removed toast notification for favorites
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      toast.error("خطا در بروزرسانی وضعیت نشان");
    }
  };

  // Prepare message for deletion with confirmation
  const confirmDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setShowDeleteConfirm(true);
  };

  // Delete message after confirmation
  const deleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const response = await fetch("/api/messages/delete-message", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: messageToDelete }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      // Update local state
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageToDelete)
      );

      if (selectedMessage && selectedMessage._id === messageToDelete) {
        setSelectedMessage(null);
        setViewMode("list");
      }

      toast.success("پیام با موفقیت حذف شد");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("خطا در حذف پیام");
    } finally {
      setMessageToDelete(null);
    }
  };

  // Reply to a message
  const sendReply = async (content: string, files: File[]) => {
    if (!selectedMessage || !user) return;

    try {
      // Create reply message object
      const replyMessage = {
        originalMessageId: selectedMessage._id,
        title: `پاسخ: ${selectedMessage.data.title}`,
        message: content.replace(/\n/g, "<br>"),
        receivercode: selectedMessage.data.sendercode,
        isRead: false,
        mailId: selectedMessage.data.mailId,
      };

      // If we have files, use FormData
      if (files.length > 0) {
        const formData = new FormData();
        formData.append("message", JSON.stringify(replyMessage));

        // Append each file
        files.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });

        const response = await fetch("/api/messages/reply", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to send reply");
        }
      } else {
        // No files, just send JSON
        const response = await fetch("/api/messages/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: replyMessage }),
        });

        if (!response.ok) {
          throw new Error("Failed to send reply");
        }
      }

      toast.success("پاسخ شما با موفقیت ارسال شد");

      // Refresh messages after sending reply
      fetchMessages();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("خطا در ارسال پاسخ");
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
  }, [user, authLoading, page, limit, messageType]);

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
          <div className="flex items-center gap-3">
            {messageType === "inbox" && (
              <button
                onClick={() => setShowReplyDialog(true)}
                className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                <ArrowUturnLeftIcon className="h-5 w-5" />
                <span>پاسخ</span>
              </button>
            )}
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
              onClick={() => confirmDeleteMessage(selectedMessage._id)}
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
            <span>
              {messageType === "inbox"
                ? `فرستنده: ${selectedMessage.data.sendername}`
                : `گیرنده: ${selectedMessage.data.receivercode}`}
            </span>
            <span>تاریخ: {selectedMessage.data.persiandate}</span>
          </div>
          {selectedMessage.data.readTime && (
            <div className="text-xs text-gray-500 mt-1">
              خوانده شده در: {selectedMessage.data.readPersianDate}
            </div>
          )}
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

    if (filteredMessages.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <EnvelopeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">
            {showStarredOnly
              ? "هیچ پیام نشان شده‌ای وجود ندارد."
              : messageType === "inbox"
              ? "هیچ پیامی وجود ندارد."
              : "هیچ پیام ارسالی وجود ندارد."}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {filteredMessages.map((message) => (
            <li key={message._id} className="hover:bg-gray-50">
              <div
                className="flex items-start px-4 py-4 sm:px-6 cursor-pointer"
                onClick={() => handleMessageSelect(message)}
              >
                {/* Bulk selection checkbox */}
                <div className="flex shrink-0 ml-2">
                  <input
                    type="checkbox"
                    checked={selectedMessages.has(message._id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      const newSelected = new Set(selectedMessages);
                      if (e.target.checked) {
                        newSelected.add(message._id);
                      } else {
                        newSelected.delete(message._id);
                      }
                      setSelectedMessages(newSelected);
                      setShowBulkActions(newSelected.size > 0);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                {/* Star icon on the right (first in RTL) */}
                <div className="flex shrink-0 ml-4">
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
                </div>

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
                      <span className="text-sm text-gray-500">
                        {message.data.persiandate}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 truncate">
                    {messageType === "inbox"
                      ? `فرستنده: ${message.data.sendername}`
                      : `گیرنده: ${message.data.receivercode}`}
                  </p>
                  {/* Show attachment details if message has files */}
                  {message.data.files && message.data.files.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>
                        {message.data.files.length === 1
                          ? "۱ فایل ضمیمه"
                          : `${message.data.files.length} فایل ضمیمه`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 ml-4 gap-2">
                  {/* Show attachment icon if message has files */}
                  {message.data.files && message.data.files.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
                      <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-blue-600 font-medium">
                        {message.data.files.length}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteMessage(message._id);
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
          <h1 className="text-2xl font-bold text-gray-900">
            {messageType === "inbox" ? "صندوق پیام‌ها" : "پیام‌های ارسالی"}
          </h1>
          <div className="flex gap-4 items-center">
            {/* Message type toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMessageType("inbox")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  messageType === "inbox"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                صندوق ورودی
              </button>
              <button
                onClick={() => setMessageType("sent")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  messageType === "sent"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                پیام‌های ارسالی
              </button>
            </div>

            {/* Filter for starred messages */}
            <button
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md border ${
                showStarredOnly
                  ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {showStarredOnly ? (
                <StarIconSolid className="h-5 w-5 text-yellow-500" />
              ) : (
                <StarIcon className="h-5 w-5" />
              )}
              <span>
                {showStarredOnly ? "همه پیام‌ها" : "پیام‌های نشان شده"}
              </span>
            </button>

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

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="جستجو در پیام‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500" />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field as "date" | "sender" | "title" | "read");
                  setSortOrder(order as "asc" | "desc");
                }}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date-desc">جدیدترین</option>
                <option value="date-asc">قدیمی‌ترین</option>
                <option value="title-asc">عنوان (الف-ی)</option>
                <option value="title-desc">عنوان (ی-الف)</option>
                <option value="sender-asc">
                  {messageType === "inbox"
                    ? "فرستنده (الف-ی)"
                    : "گیرنده (الف-ی)"}
                </option>
                <option value="sender-desc">
                  {messageType === "inbox"
                    ? "فرستنده (ی-الف)"
                    : "گیرنده (ی-الف)"}
                </option>
                <option value="read-asc">خوانده نشده اول</option>
                <option value="read-desc">خوانده شده اول</option>
              </select>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
                showAdvancedFilters
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FunnelIcon className="h-5 w-5" />
              فیلترهای پیشرفته
            </button>

            {/* Compose Message Button */}
            <button
              onClick={() => setShowComposeDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PencilSquareIcon className="h-5 w-5" />
              پیام جدید
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Read Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وضعیت خوانده شدن
                  </label>
                  <select
                    value={readFilter}
                    onChange={(e) =>
                      setReadFilter(e.target.value as "all" | "read" | "unread")
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">همه</option>
                    <option value="unread">خوانده نشده</option>
                    <option value="read">خوانده شده</option>
                  </select>
                </div>

                {/* Attachment Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    فایل ضمیمه
                  </label>
                  <select
                    value={attachmentFilter}
                    onChange={(e) =>
                      setAttachmentFilter(
                        e.target.value as "all" | "with" | "without"
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">همه</option>
                    <option value="with">دارای ضمیمه</option>
                    <option value="without">بدون ضمیمه</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    از تاریخ
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={dateFilter.from}
                      onChange={(e) =>
                        setDateFilter((prev) => ({
                          ...prev,
                          from: e.target.value,
                        }))
                      }
                      className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تا تاریخ
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={dateFilter.to}
                      onChange={(e) =>
                        setDateFilter((prev) => ({
                          ...prev,
                          to: e.target.value,
                        }))
                      }
                      className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setReadFilter("all");
                    setAttachmentFilter("all");
                    setDateFilter({ from: "", to: "" });
                    setSortBy("date");
                    setSortOrder("desc");
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  پاک کردن همه فیلترها
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Panel */}
        {showBulkActions && selectedMessages.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">
                {selectedMessages.size} پیام انتخاب شده
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    selectedMessages.forEach((id) => toggleFavorite(id));
                    setSelectedMessages(new Set());
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  نشان کردن همه
                </button>
                <button
                  onClick={() => {
                    selectedMessages.forEach((id) => confirmDeleteMessage(id));
                    setSelectedMessages(new Set());
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                >
                  حذف همه
                </button>
                <button
                  onClick={() => {
                    setSelectedMessages(new Set());
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                >
                  لغو انتخاب
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === "list" ? renderMessageList() : renderMessageDetail()}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={deleteMessage}
          title="حذف پیام"
          message="آیا از حذف این پیام اطمینان دارید؟ این عملیات قابل بازگشت نیست."
        />

        {/* Reply Dialog */}
        <ReplyDialog
          isOpen={showReplyDialog}
          onClose={() => setShowReplyDialog(false)}
          onSend={sendReply}
          originalMessage={selectedMessage}
        />

        {/* Compose Dialog */}
        {showComposeDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl"
              dir="rtl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">پیام جدید</h3>
                <button
                  onClick={() => setShowComposeDialog(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    گیرنده
                  </label>
                  <input
                    type="text"
                    placeholder="کد کاربری گیرنده..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    موضوع
                  </label>
                  <input
                    type="text"
                    placeholder="موضوع پیام..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    متن پیام
                  </label>
                  <textarea
                    rows={6}
                    placeholder="متن پیام خود را بنویسید..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowComposeDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button
                  onClick={() => {
                    setShowComposeDialog(false);
                    toast.success("پیام ارسال شد");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ارسال پیام
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
