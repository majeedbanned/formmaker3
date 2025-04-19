import React, { useState, useRef, useEffect } from "react";
import { User, ChatMessage, Chatroom, FileAttachment } from "../types";
import { getSocket } from "../lib/socket";
import { uploadFile } from "../services/api";
import { toast } from "sonner";
import {
  PaperClipIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ChatWindowProps {
  user: User;
  selectedChatroom: Chatroom | null;
  messages: ChatMessage[];
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  user,
  selectedChatroom,
  messages,
  isLoading,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileAttachment, setFileAttachment] = useState<FileAttachment | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chatroom changes
  useEffect(() => {
    if (selectedChatroom && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedChatroom]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString("fa-IR")} ${date.toLocaleTimeString(
      "fa-IR",
      { hour: "2-digit", minute: "2-digit" }
    )}`;
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حداکثر حجم فایل 10 مگابایت است");
      e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      toast.info(`در حال آپلود فایل: ${file.name}`);
      console.log("Uploading file:", file.name, file.type, file.size);

      const { fileAttachment } = await uploadFile(file);
      console.log("File uploaded successfully:", fileAttachment);
      setFileAttachment(fileAttachment);
      toast.success("فایل با موفقیت آپلود شد");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(
        `خطا در آپلود فایل: ${
          error instanceof Error ? error.message : "خطای ناشناخته"
        }`
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearFileAttachment = () => {
    setFileAttachment(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      (!messageInput.trim() && !fileAttachment) ||
      !selectedChatroom ||
      isSending
    )
      return;

    setIsSending(true);

    const socket = getSocket();
    if (!socket) {
      console.error("Socket not connected");
      setIsSending(false);
      toast.error("خطا در اتصال به سرور گفتگو");
      return;
    }

    // Prepare message data
    const messageData = {
      chatroomId: selectedChatroom._id,
      content: messageInput.trim(),
      fileAttachment,
    };

    console.log("Sending message:", JSON.stringify(messageData, null, 2));

    socket.emit(
      "send-message",
      messageData,
      (response: {
        success: boolean;
        error?: string;
        message?: ChatMessage;
      }) => {
        setIsSending(false);

        if (response.success) {
          console.log("Message sent successfully:", response.message);
          setMessageInput("");
          setFileAttachment(null);
          // Focus input after sending
          inputRef.current?.focus();
        } else {
          console.error("Error sending message:", response.error);
          toast.error(response.error || "خطا در ارسال پیام");
        }
      }
    );
  };

  const isMyMessage = (senderId: string) => {
    return senderId === user.id;
  };

  const renderFileAttachment = (file: FileAttachment) => {
    if (file.isImage) {
      return (
        <div className="mt-2 relative">
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <img
              src={`${process.env.NEXT_PUBLIC_CHAT_SERVER_URL}${file.url}`}
              alt={file.originalName}
              className="max-w-full max-h-48 object-contain"
            />
          </div>
          <div className="mt-1 text-xs text-gray-500 flex justify-between">
            <span>{file.originalName}</span>
            <span>{formatFileSize(file.size)}</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
          <div className="flex items-center">
            <DocumentIcon className="h-8 w-8 text-blue-500 mr-2" />
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium truncate">
                {file.originalName}
              </div>
              <div className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </div>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_CHAT_SERVER_URL}${file.url}`}
              download={file.originalName}
              className="ml-2 p-1 text-blue-500 hover:text-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      );
    }
  };

  if (!selectedChatroom) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-md">
        <div className="text-center p-8">
          <div className="mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-blue-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">
            برای شروع گفتگو، یک اتاق را از لیست انتخاب کنید
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
      {/* Chat header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-l from-blue-50 to-white">
        <h2 className="text-lg font-bold text-gray-800 text-right">
          {selectedChatroom.data.chatroomName}
        </h2>
        <p className="text-sm text-gray-500 text-right">
          کد گفتگو: {selectedChatroom.data.chatroomCode}
        </p>
      </div>

      {/* Messages area - improved to ensure it takes remaining height */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0"
        dir="rtl"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-gray-200 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
              />
            </svg>
            <p className="text-gray-500">
              هنوز پیامی در این گفتگو ارسال نشده است
            </p>
            <p className="text-gray-400 text-sm mt-2">
              اولین پیام را ارسال کنید
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${
                  isMyMessage(message.sender.id)
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 shadow-sm ${
                    isMyMessage(message.sender.id)
                      ? "bg-blue-500 text-white rounded-tl-none"
                      : "bg-white text-gray-800 rounded-tr-none border border-gray-200"
                  }`}
                >
                  {!isMyMessage(message.sender.id) && (
                    <div className="font-medium text-sm mb-1 text-left text-blue-600">
                      {message.sender.name}
                    </div>
                  )}
                  <div className="text-right whitespace-pre-wrap">
                    {message.content}
                  </div>

                  {/* File attachment */}
                  {message.fileAttachment &&
                    renderFileAttachment(message.fileAttachment)}

                  <div
                    className={`text-xs mt-1 flex ${
                      isMyMessage(message.sender.id)
                        ? "text-blue-100 justify-end"
                        : "text-gray-500 justify-start"
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* File attachment preview */}
      {fileAttachment && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse rtl">
              {fileAttachment.isImage ? (
                <PhotoIcon className="h-5 w-5 text-blue-500" />
              ) : (
                <DocumentIcon className="h-5 w-5 text-blue-500" />
              )}
              <div
                className="text-sm text-gray-900 truncate max-w-[240px]"
                dir="rtl"
              >
                {fileAttachment.originalName}
              </div>
              <div className="text-xs text-gray-500">
                {formatFileSize(fileAttachment.size)}
              </div>
            </div>
            <button
              onClick={clearFileAttachment}
              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="حذف فایل"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex flex-col">
          <div className="flex">
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-500 text-white rounded-l-md flex items-center justify-center min-w-[80px] ${
                isSending || (!messageInput.trim() && !fileAttachment)
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-600"
              }`}
              disabled={isSending || (!messageInput.trim() && !fileAttachment)}
            >
              {isSending ? (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-1 transform rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                  ارسال
                </span>
              )}
            </button>
            <input
              type="text"
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 p-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              disabled={isSending}
              dir="rtl"
            />
            <button
              type="button"
              onClick={handleOpenFileDialog}
              className={`p-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md text-gray-600 hover:bg-gray-200 ${
                isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-500 border-t-transparent"></div>
              ) : (
                <PaperClipIcon className="h-5 w-5" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            حداکثر حجم فایل: 10 مگابایت
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
