import React, { useState, useRef, useEffect } from "react";
import {
  User,
  ChatMessage,
  Chatroom,
  FileAttachment,
  Reaction,
  ReferencedMessage,
} from "../types";
import { getSocket } from "../lib/socket";
import { uploadFile } from "../services/api";
import { toast } from "sonner";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  PaperClipIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  FaceSmileIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  CheckIcon,
  FaceSmileIcon as FaceSmileOutline,
  ArrowUturnLeftIcon,
  XCircleIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

// Array of popular emoji for quick reactions
const POPULAR_EMOJIS = ["👍", "❤️", "😂", "😍", "😮", "😢", "👏", "🔥"];

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const messageMenuRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<
    string | null
  >(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<ReferencedMessage | null>(null);

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

  // Click outside emoji picker handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close message menu when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        messageMenuRef.current &&
        !messageMenuRef.current.contains(event.target as Node)
      ) {
        setMessageMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus on the edit textarea when entering edit mode
  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
      // Place cursor at end of text
      const textLength = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(textLength, textLength);
    }
  }, [editingMessageId]);

  // Close reaction picker when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(event.target as Node)
      ) {
        setReactionPickerMessageId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus input when starting to reply
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
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
      replyTo: replyingTo,
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
          setReplyingTo(null); // Clear reply state after sending
          // Focus input after sending
          inputRef.current?.focus();
        } else {
          console.error("Error sending message:", response.error);
          toast.error(response.error || "خطا در ارسال پیام");
        }
      }
    );
  };

  const openImagePreview = (imageUrl: string, alt: string) => {
    setPreviewImage({ url: imageUrl, alt });
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const renderFileAttachment = (file: FileAttachment) => {
    const fullImageUrl = `${process.env.NEXT_PUBLIC_CHAT_SERVER_URL}${file.url}`;

    if (file.isImage) {
      return (
        <div className="mt-2 relative">
          <div
            className="relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
            onClick={() => openImagePreview(fullImageUrl, file.originalName)}
          >
            <img
              src={fullImageUrl}
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
              href={fullImageUrl}
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

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedChatroom || isDeletingMessage) return;

    setIsDeletingMessage(true);
    setMessageMenuOpen(null);

    const socket = getSocket();
    if (!socket) {
      console.error("Socket not connected");
      setIsDeletingMessage(false);
      toast.error("خطا در اتصال به سرور گفتگو");
      return;
    }

    socket.emit(
      "delete-message",
      {
        messageId,
        chatroomId: selectedChatroom._id,
      },
      (response: { success: boolean; error?: string }) => {
        setIsDeletingMessage(false);

        if (response.success) {
          toast.success("پیام با موفقیت حذف شد");
        } else {
          console.error("Error deleting message:", response.error);
          toast.error(response.error || "خطا در حذف پیام");
        }
      }
    );
  };

  const toggleMessageMenu = (messageId: string) => {
    if (messageMenuOpen === messageId) {
      setMessageMenuOpen(null);
    } else {
      setMessageMenuOpen(messageId);
    }
  };

  const startEditingMessage = (message: ChatMessage) => {
    setEditingMessageId(message._id);
    setEditedContent(message.content);
    setMessageMenuOpen(null);
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditedContent("");
  };

  const handleEditMessage = async () => {
    if (
      !selectedChatroom ||
      !editingMessageId ||
      isEditingMessage ||
      !editedContent.trim()
    ) {
      return;
    }

    setIsEditingMessage(true);

    const socket = getSocket();
    if (!socket) {
      console.error("Socket not connected");
      setIsEditingMessage(false);
      toast.error("خطا در اتصال به سرور گفتگو");
      return;
    }

    socket.emit(
      "edit-message",
      {
        messageId: editingMessageId,
        chatroomId: selectedChatroom._id,
        newContent: editedContent.trim(),
      },
      (response: {
        success: boolean;
        error?: string;
        updatedMessage?: ChatMessage;
      }) => {
        setIsEditingMessage(false);

        if (response.success) {
          toast.success("پیام با موفقیت ویرایش شد");
          setEditingMessageId(null);
          setEditedContent("");
        } else {
          console.error("Error editing message:", response.error);
          toast.error(response.error || "خطا در ویرایش پیام");
        }
      }
    );
  };

  const handleReactionClick = (messageId: string) => {
    if (reactionPickerMessageId === messageId) {
      setReactionPickerMessageId(null);
    } else {
      setReactionPickerMessageId(messageId);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!selectedChatroom) return;

    const socket = getSocket();
    if (!socket) {
      console.error("Socket not connected");
      toast.error("خطا در اتصال به سرور گفتگو");
      return;
    }

    // Check if the user is toggling their existing reaction (to remove it)
    const message = messages.find((m) => m._id === messageId);
    let isRemovingReaction = false;

    if (message?.reactions) {
      const existingReaction = Object.values(message.reactions).find(
        (reaction) => reaction.users.some((u) => u.id === user.id)
      );

      if (existingReaction && existingReaction.emoji === emoji) {
        isRemovingReaction = true;
      }
    }

    socket.emit(
      "toggle-reaction",
      {
        messageId,
        chatroomId: selectedChatroom._id,
        emoji: isRemovingReaction ? "" : emoji, // Send empty string to only remove, without adding
      },
      (response: {
        success: boolean;
        error?: string;
        reactions?: Record<string, Reaction>;
      }) => {
        if (!response.success) {
          console.error("Error toggling reaction:", response.error);
          toast.error("خطا در ثبت واکنش");
        }
        // Always close the reaction picker after selecting an emoji
        setReactionPickerMessageId(null);
      }
    );
  };

  const handleQuickReaction = (messageId: string, emoji: string) => {
    toggleReaction(messageId, emoji);
  };

  const handleEmojiReactionSelect = (
    messageId: string,
    emojiData: EmojiClickData
  ) => {
    toggleReaction(messageId, emojiData.emoji);
  };

  const getUsersWhoReacted = (reaction: Reaction) => {
    return reaction.users.map((user) => user.name).join("، ");
  };

  const getUserReaction = (message: ChatMessage): string | null => {
    if (!message.reactions) return null;

    const userReaction = Object.values(message.reactions).find((reaction) =>
      reaction.users.some((u) => u.id === user.id)
    );

    return userReaction ? userReaction.emoji : null;
  };

  const renderReactions = (message: ChatMessage) => {
    if (!message.reactions || Object.keys(message.reactions).length === 0)
      return null;

    // Get the current user's reaction for this message - we use this to determine styling
    const userReaction = getUserReaction(message);

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.values(message.reactions).map((reaction) => {
          // Determine if this is the user's current reaction
          const isUserCurrentReaction = userReaction === reaction.emoji;

          return (
            <button
              key={reaction.emoji}
              onClick={() => toggleReaction(message._id, reaction.emoji)}
              className={`emoji-reaction-btn px-1 rounded-full 
                ${
                  isUserCurrentReaction
                    ? "bg-blue-100 border-blue-300"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              title={getUsersWhoReacted(reaction)}
            >
              <span className="emoji mr-1">{reaction.emoji}</span>
              <span className="text-xs">{reaction.users.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const startReplyingToMessage = (message: ChatMessage) => {
    setReplyingTo({
      id: message._id,
      content: message.content,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
      },
      hasAttachment: !!message.fileAttachment,
    });
    setMessageMenuOpen(null);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Function to render a reply reference
  const renderReplyReference = (replyTo: ReferencedMessage) => {
    // Find the original message if it exists in our messages array
    const originalMessage = messages.find((m) => m._id === replyTo.id);

    // Use either the live message content or the saved reply content
    const content = originalMessage ? originalMessage.content : replyTo.content;
    const isDeleted = !originalMessage && replyTo.id;

    return (
      <div className="border-r-2 border-blue-400 pr-2 mb-2 text-xs">
        <div className="text-blue-600 font-medium mb-1">
          {isDeleted ? "پیام حذف شده" : `پاسخ به ${replyTo.sender.name}`}
        </div>
        <div className="text-gray-600 truncate">
          {isDeleted
            ? "این پیام دیگر در دسترس نیست"
            : content.length > 50
            ? content.substring(0, 50) + "..."
            : content}
          {replyTo.hasAttachment && (
            <span className="ml-1 text-gray-500">
              <PaperClipIcon className="inline-block h-3 w-3" /> فایل پیوست
            </span>
          )}
        </div>
      </div>
    );
  };

  if (!selectedChatroom) {
    return (
      <div className="h-full flex items-center justify-center overflow-hidden">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            آماده برای گفتگو
          </h3>
          <p className="text-gray-600 text-base">
            برای شروع گفتگو، یک اتاق را از لیست انتخاب کنید
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" dir="rtl">
      {/* Add a style tag for emoji reactions */}
      <style jsx>{`
        .emoji-reaction-btn {
          display: inline-flex;
          align-items: center;
          transition: all 0.2s;
          border: 1px solid rgba(0, 0, 0, 0.05);
          font-size: 0.85rem;
        }

        .emoji-reaction-btn .emoji {
          font-size: 1.1rem;
        }

        .emoji-reaction-btn:hover {
          transform: scale(1.05);
        }
      `}</style>

      {/* Chat header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center space-x-reverse space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {selectedChatroom.data.chatroomName}
            </h2>
            <p className="text-xs text-gray-500">
              کد گفتگو: {selectedChatroom.data.chatroomCode}
            </p>
          </div>
        </div>
      </div>

      {/* Messages area - improved to ensure it takes remaining height */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white min-h-0"
        dir="rtl"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-500">در حال بارگذاری پیام‌ها...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              گفتگو آغاز نشده
            </h3>
            <p className="text-gray-500 mb-1">
              هنوز پیامی در این گفتگو ارسال نشده است
            </p>
            <p className="text-gray-400 text-sm">
              اولین پیام را ارسال کنید و گفتگو را آغاز نمایید
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isMyMessage = message.sender.id === user.id;

              return (
                <div
                  key={message._id}
                  className={`flex ${
                    isMyMessage ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`relative max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                      isMyMessage
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-sm"
                        : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                    }`}
                  >
                    {!isMyMessage && (
                      <div className="font-medium text-sm mb-2 text-blue-600">
                        {message.sender.name}
                      </div>
                    )}

                    {/* Show reply reference if this message is a reply */}
                    {message.replyTo && (
                      <div className={isMyMessage ? "text-blue-100" : ""}>
                        {renderReplyReference(message.replyTo)}
                      </div>
                    )}

                    {editingMessageId === message._id ? (
                      // Editing mode
                      <div className="flex flex-col">
                        <textarea
                          ref={editInputRef}
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full p-2 mb-2 rounded text-gray-800 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-right"
                          dir="rtl"
                          rows={3}
                        />
                        <div className="flex justify-between">
                          <button
                            onClick={cancelEditingMessage}
                            className="px-2 py-1 bg-gray-200 text-gray-800 rounded"
                            disabled={isEditingMessage}
                          >
                            انصراف
                          </button>
                          <button
                            onClick={handleEditMessage}
                            className={`px-2 py-1 bg-blue-600 text-white rounded flex items-center ${
                              isEditingMessage || !editedContent.trim()
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-blue-700"
                            }`}
                            disabled={isEditingMessage || !editedContent.trim()}
                          >
                            {isEditingMessage ? (
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-1"></div>
                            ) : (
                              <CheckIcon className="h-4 w-4 ml-1" />
                            )}
                            ذخیره
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Normal display mode
                      <div className="text-right whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}

                    {/* File attachment */}
                    {message.fileAttachment &&
                      renderFileAttachment(message.fileAttachment)}

                    {/* Message reactions */}
                    {renderReactions(message)}

                    <div
                      className={`text-xs mt-1 flex items-center ${
                        isMyMessage
                          ? "text-blue-100 justify-between"
                          : "text-gray-500 justify-between"
                      }`}
                    >
                      <div className="flex items-center">
                        <span>{formatTimestamp(message.timestamp)}</span>
                        {message.edited && (
                          <span className="ml-1">(ویرایش شده)</span>
                        )}
                      </div>

                      {/* Message actions */}
                      {!editingMessageId && (
                        <div className="flex">
                          {/* Reply button */}
                          <button
                            onClick={() => startReplyingToMessage(message)}
                            className={`ml-1 p-1 rounded-full ${
                              isMyMessage
                                ? "hover:bg-blue-400 transition-colors"
                                : "hover:bg-gray-200 transition-colors text-gray-600"
                            }`}
                          >
                            <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
                          </button>

                          {/* Reaction button */}
                          <div className="relative">
                            <button
                              onClick={() => handleReactionClick(message._id)}
                              className={`ml-1 p-1 rounded-full ${
                                isMyMessage
                                  ? "hover:bg-blue-400 transition-colors"
                                  : "hover:bg-gray-200 transition-colors text-gray-600"
                              } ${
                                reactionPickerMessageId === message._id
                                  ? isMyMessage
                                    ? "bg-blue-400"
                                    : "bg-gray-200"
                                  : ""
                              }`}
                            >
                              <FaceSmileOutline className="h-4 w-4" />
                            </button>

                            {/* Emoji reaction picker */}
                            {reactionPickerMessageId === message._id && (
                              <div
                                ref={reactionPickerRef}
                                className="absolute bottom-6 right-0 bg-white shadow-lg rounded-md p-2 z-30"
                              >
                                <div className="flex flex-wrap gap-1 mb-2 max-w-[200px]">
                                  {POPULAR_EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() =>
                                        handleQuickReaction(message._id, emoji)
                                      }
                                      className="p-1 hover:bg-gray-100 rounded text-lg"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                                <div className="border-t border-gray-200 pt-2">
                                  <EmojiPicker
                                    onEmojiClick={(emojiData) =>
                                      handleEmojiReactionSelect(
                                        message._id,
                                        emojiData
                                      )
                                    }
                                    width={250}
                                    height={350}
                                    lazyLoadEmojis
                                    searchDisabled
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Message menu (edit, delete) - only for own messages */}
                          {isMyMessage && (
                            <div className="relative">
                              <button
                                onClick={() => toggleMessageMenu(message._id)}
                                className={`ml-1 p-1 rounded-full hover:bg-blue-400 transition-colors ${
                                  messageMenuOpen === message._id
                                    ? "bg-blue-400"
                                    : ""
                                }`}
                              >
                                <EllipsisHorizontalIcon className="h-4 w-4" />
                              </button>

                              {messageMenuOpen === message._id && (
                                <div
                                  ref={messageMenuRef}
                                  className="absolute bottom-6 left-0 bg-white shadow-lg rounded-md py-1 text-gray-800 min-w-[120px] z-20"
                                >
                                  <button
                                    onClick={() => startEditingMessage(message)}
                                    className="w-full text-right flex items-center px-3 py-2 hover:bg-gray-100 text-blue-600"
                                  >
                                    <PencilIcon className="h-4 w-4 ml-2" />
                                    <span>ویرایش پیام</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteMessage(message._id)
                                    }
                                    disabled={isDeletingMessage}
                                    className="w-full text-right flex items-center px-3 py-2 hover:bg-gray-100 text-red-600"
                                  >
                                    <TrashIcon className="h-4 w-4 ml-2" />
                                    <span>حذف پیام</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply preview */}
      {replyingTo && (
        <div className="border-t border-gray-100 p-4 bg-gradient-to-l from-blue-50 to-indigo-50 flex justify-between items-center">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
              <ArrowUturnLeftIcon className="h-4 w-4 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-blue-700 mb-1">
                پاسخ به {replyingTo.sender.name}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {replyingTo.content.length > 60
                  ? replyingTo.content.substring(0, 60) + "..."
                  : replyingTo.content}
                {replyingTo.hasAttachment && (
                  <span className="mr-2 text-gray-500">
                    <PaperClipIcon className="inline-block h-3 w-3" /> فایل
                    پیوست
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={cancelReply}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
            title="لغو پاسخ"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* File attachment preview */}
      {fileAttachment && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-l from-gray-50 to-white">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 space-x-reverse rtl overflow-hidden">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  fileAttachment.isImage
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {fileAttachment.isImage ? (
                  <PhotoIcon className="h-5 w-5" />
                ) : (
                  <DocumentIcon className="h-5 w-5" />
                )}
              </div>
              <div className="overflow-hidden">
                <div
                  className="text-sm font-medium text-gray-900 truncate max-w-[200px]"
                  dir="rtl"
                >
                  {fileAttachment.originalName}
                </div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(fileAttachment.size)}
                </div>
              </div>
            </div>
            <button
              onClick={clearFileAttachment}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
              title="حذف فایل"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex flex-col">
          <div className="flex relative rounded-lg border border-gray-200 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <button
              type="submit"
              className={`px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center min-w-[100px] transition-all duration-200 ${
                isSending || (!messageInput.trim() && !fileAttachment)
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-blue-600 hover:to-blue-700 hover:shadow-md"
              }`}
              disabled={isSending || (!messageInput.trim() && !fileAttachment)}
            >
              {isSending ? (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <span className="flex items-center font-medium">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2 transform rotate-180"
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
              placeholder={
                replyingTo ? "پاسخ خود را بنویسید..." : "پیام خود را بنویسید..."
              }
              className="flex-1 p-3 border-0 focus:outline-none text-right bg-white placeholder-gray-400"
              disabled={isSending}
              dir="rtl"
            />
            <button
              type="button"
              onClick={handleOpenFileDialog}
              className={`p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 ${
                isUploading ? "opacity-50 cursor-not-allowed bg-gray-50" : ""
              }`}
              disabled={isUploading}
              title="پیوست فایل"
            >
              {isUploading ? (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
              ) : (
                <PaperClipIcon className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 ${
                showEmojiPicker ? "bg-blue-50 text-blue-600" : ""
              }`}
              disabled={isSending}
              title="افزودن ایموجی"
            >
              <FaceSmileIcon
                className={`h-5 w-5 ${showEmojiPicker ? "text-blue-600" : ""}`}
              />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
            />
          </div>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-16 right-4 z-10 shadow-xl rounded-xl border border-gray-200 bg-white overflow-hidden"
              style={{ direction: "ltr" }}
            >
              <div className="absolute bottom-[-8px] right-[20px] w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                searchDisabled
                skinTonesDisabled
                width={300}
                height={360}
                lazyLoadEmojis
              />
            </div>
          )}

          <div className="text-xs text-gray-500 mt-3 text-right flex items-center">
            <svg
              className="w-4 h-4 ml-1 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            حداکثر حجم فایل: 10 مگابایت
          </div>
        </form>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImagePreview}
        >
          <div
            className="max-w-4xl max-h-screen overflow-auto bg-white rounded-lg p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2 p-2">
              <h3 className="text-lg font-medium">{previewImage.alt}</h3>
              <button
                onClick={closeImagePreview}
                className="p-1 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center justify-center max-h-[70vh]">
              <img
                src={previewImage.url}
                alt={previewImage.alt}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="mt-4 flex justify-center">
              <a
                href={previewImage.url}
                download
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                دانلود تصویر
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
