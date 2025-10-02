"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import {
  FiSend,
  FiTrash,
  FiUserCheck,
  FiSearch,
  FiMessageSquare,
  FiUsers,
} from "react-icons/fi";

// Chat message type
interface ChatMessage {
  _id: string;
  content: string;
  chatroomId?: string;
  sender: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  timestamp: string;
  read: boolean;
  readBy?: Array<{
    userId: string;
    timestamp: string;
  }>;
}

// User type for chat users
interface ChatUser {
  id: string;
  name: string;
  role?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export default function FloatingChatAdmin() {
  const { user, isLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"users" | "all">("users");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingMessageIds = useRef<Set<string>>(new Set());

  // Filter out duplicate messages
  const uniqueMessages = useMemo(() => {
    const seen = new Set();
    return messages.filter((msg) => {
      const duplicate = seen.has(msg._id);
      seen.add(msg._id);
      return !duplicate;
    });
  }, [messages]);

  // Group messages by user
  const userMessages = useMemo(() => {
    // Skip the admin's own messages when grouping by user
    const nonAdminMessages = uniqueMessages.filter(
      (msg) => msg.sender.role !== "admin"
    );

    // Create a map of users and their messages
    const userMap = new Map<string, ChatUser>();

    // Process all messages to build user list with last message info
    nonAdminMessages.forEach((msg) => {
      const senderId = msg.sender.id;

      if (!userMap.has(senderId)) {
        userMap.set(senderId, {
          id: senderId,
          name: msg.sender.name,
          role: msg.sender.role,
          lastMessage: msg.content,
          lastMessageTime: msg.timestamp,
          unreadCount: msg.read ? 0 : 1,
        });
      } else {
        const user = userMap.get(senderId)!;
        // Update last message if this message is newer
        const msgTime = new Date(msg.timestamp).getTime();
        const lastMsgTime = user.lastMessageTime
          ? new Date(user.lastMessageTime).getTime()
          : 0;

        if (msgTime > lastMsgTime) {
          user.lastMessage = msg.content;
          user.lastMessageTime = msg.timestamp;
        }

        // Update unread count
        if (!msg.read) {
          user.unreadCount += 1;
        }
      }
    });

    // Convert to array and sort by last message time (most recent first)
    return Array.from(userMap.values()).sort((a, b) => {
      const timeA = a.lastMessageTime
        ? new Date(a.lastMessageTime).getTime()
        : 0;
      const timeB = b.lastMessageTime
        ? new Date(b.lastMessageTime).getTime()
        : 0;
      return timeB - timeA;
    });
  }, [uniqueMessages]);

  // Filter user list based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return userMessages;

    const term = searchTerm.toLowerCase();
    return userMessages.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        (user.lastMessage && user.lastMessage.toLowerCase().includes(term))
    );
  }, [userMessages, searchTerm]);

  // Get filtered messages for the selected user
  const filteredMessages = useMemo(() => {
    if (viewMode === "all") return uniqueMessages;

    if (!selectedUser) return [];

    return uniqueMessages.filter(
      (msg) =>
        msg.sender.id === selectedUser.id ||
        (msg.sender.id === user?.id &&
          msg.content.includes(`@${selectedUser.name}`))
    );
  }, [uniqueMessages, selectedUser, viewMode, user?.id]);

  // Function to get auth token
  const getAuthToken = async () => {
    try {
      const response = await fetch("/api/auth/token");
      if (!response.ok) {
        throw new Error("Failed to fetch token");
      }
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error("Error fetching token:", error);
      return null;
    }
  };

  // Initialize chat
  useEffect(() => {
    if (isLoading || !user) return;

    let mounted = true;
    const initializeChat = async () => {
      const token = await getAuthToken();
      if (!token || !mounted) {
        toast.error("خطا در دریافت توکن احراز هویت");
        return;
      }

      // Chat server URL
      const CHAT_SERVER_URL =
        process.env.NEXT_PUBLIC_CHAT_SERVER_URL || "http://localhost:3001";

      // Initialize socket
      const socketInstance = io(CHAT_SERVER_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
      });

      socketInstance.on("connect", () => {
        if (!mounted) return;
        setIsConnected(true);

        // Join the floating chat room
        socketInstance.emit(
          "join-room",
          "floating-chat",
          (response: { success: boolean; messages?: ChatMessage[] }) => {
            if (!mounted) return;
            if (response.success && response.messages) {
              setMessages(response.messages);
              // Clear the pending messages set when loading initial messages
              pendingMessageIds.current.clear();
            }
          }
        );
      });

      socketInstance.on("disconnect", () => {
        if (!mounted) return;
        setIsConnected(false);
        console.log("Socket disconnected");
      });

      socketInstance.on("new-message", (message: ChatMessage) => {
        if (!mounted) return;

        if (pendingMessageIds.current.has(message._id)) {
          pendingMessageIds.current.delete(message._id);
          return;
        }

        setMessages((prev) => {
          if (prev.some((msg) => msg._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
      });

      socketInstance.on("message-deleted", (data: { messageId: string }) => {
        if (!mounted) return;
        setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
      });

      // Listen for message read status updates
      socketInstance.on(
        "messages-read",
        (data: { userId: string; messageIds: string[] }) => {
          if (!mounted) return;

          // Update the read status of messages
          setMessages((prev) =>
            prev.map((msg) =>
              data.messageIds.includes(msg._id) ? { ...msg, read: true } : msg
            )
          );
        }
      );

      setSocket(socketInstance);
      fetchMessages(token);

      return () => {
        socketInstance.disconnect();
      };
    };

    initializeChat();

    return () => {
      mounted = false;
    };
  }, [isLoading, user]);

  // Add an effect to update the selected user when messages change
  useEffect(() => {
    if (selectedUser) {
      // Calculate new unread count
      const unreadCount = messages.filter(
        (msg) => msg.sender.id === selectedUser.id && !msg.read
      ).length;

      // Only update if the unread count has changed
      if (unreadCount !== selectedUser.unreadCount) {
        setSelectedUser({
          ...selectedUser,
          unreadCount,
        });
      }
    }
  }, [messages, selectedUser]);

  // Scroll to bottom when filtered messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredMessages]);

  // Fetch messages from API
  const fetchMessages = async (token: string) => {
    try {
      const response = await fetch("/api/floating-chat/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
          pendingMessageIds.current.clear();
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket || !isConnected || !user) return;

    let finalMessage = message.trim();

    // If in user mode and a user is selected, prepend @username to the message
    if (viewMode === "users" && selectedUser) {
      finalMessage = `@${selectedUser.name}: ${finalMessage}`;
      // finalMessage = ` ${finalMessage}`;
    }

    // Send message
    socket.emit(
      "send-message",
      {
        chatroomId: "floating-chat",
        content: finalMessage,
        fileAttachment: null,
        replyTo: null,
      },
      (response: { success: boolean; message?: ChatMessage }) => {
        if (response.success) {
          setMessage("");

          if (response.message) {
            pendingMessageIds.current.add(response.message._id);

            setMessages((prev) => {
              if (prev.some((msg) => msg._id === response.message!._id)) {
                return prev;
              }
              return [...prev, response.message!];
            });
          }
        } else {
          toast.error("خطا در ارسال پیام");
        }
      }
    );
  };

  // Handle deleting a message
  const handleDeleteMessage = (messageId: string) => {
    if (!socket || !isConnected) return;

    socket.emit(
      "delete-floating-message",
      { messageId },
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          toast.success("پیام با موفقیت حذف شد");
          setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        } else {
          toast.error(response.error || "خطا در حذف پیام");
        }
      }
    );
  };

  // Mark all messages as read
  const markAllAsRead = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/floating-chat/mark-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("تمام پیام‌ها به عنوان خوانده شده علامت گذاری شدند");
        // Update local state to mark all messages as read
        setMessages((prev) => prev.map((msg) => ({ ...msg, read: true })));
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
      toast.error("خطا در بروزرسانی وضعیت پیام‌ها");
    }
  };

  // Mark messages from a specific user as read
  const markUserMessagesAsRead = async (userId: string) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/floating-chat/mark-user-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender.id === userId ? { ...msg, read: true } : msg
          )
        );
      }
    } catch (error) {
      console.error("Error marking user messages as read:", error);
    }
  };

  // Select a user to chat with
  const handleSelectUser = (chatUser: ChatUser) => {
    // First update the UI immediately to show selected user and mark messages as read locally
    setSelectedUser({ ...chatUser, unreadCount: 0 });
    setViewMode("users");

    // Update UI immediately - mark all messages from this user as read locally
    setMessages((prev) =>
      prev.map((msg) =>
        msg.sender.id === chatUser.id ? { ...msg, read: true } : msg
      )
    );

    // Then communicate with the server
    if (socket && isConnected) {
      // Emit an event to mark messages from this user as read
      socket.emit(
        "mark-floating-user-messages-read",
        { userId: chatUser.id },
        (response: { success: boolean }) => {
          if (!response.success) {
            // Only try REST API fallback if socket call failed
            markUserMessagesAsRead(chatUser.id);
          }
        }
      );
    } else {
      // Use REST API if socket is not connected
      markUserMessagesAsRead(chatUser.id);
    }
  };

  // Toggle between 'users' and 'all' view modes
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "users" ? "all" : "users"));
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if(user?.userType === "student"){
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">شما دسترسی به این صفحه را ندارید</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          برای مشاهده این صفحه باید وارد شوید
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6 rtl">
        <h1 className="text-2xl font-bold">مدیریت گفتگوی شناور</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleViewMode}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            {viewMode === "users" ? (
              <>
                <FiMessageSquare className="ml-1" />
                نمایش همه پیام‌ها
              </>
            ) : (
              <>
                <FiUsers className="ml-1" />
                نمایش بر اساس کاربر
              </>
            )}
          </button>
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <FiUserCheck className="ml-1" />
            علامت همه به عنوان خوانده شده
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-10rem)]">
        {/* User list (visible only in 'users' mode) */}
        {viewMode === "users" && (
          <div className="md:col-span-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="bg-blue-600 text-white p-3 font-bold rtl">
              کاربران
            </div>

            {/* Search box */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <FiSearch className="absolute top-3 right-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="جستجوی کاربر..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 rtl"
                />
              </div>
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 p-4 text-center rtl">
                  کاربری یافت نشد
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredUsers.map((chatUser) => (
                    <li
                      key={chatUser.id}
                      onClick={() => handleSelectUser(chatUser)}
                      className={`p-3 hover:bg-gray-50 cursor-pointer transition rtl ${
                        selectedUser?.id === chatUser.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {chatUser.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {chatUser.lastMessage || "بدون پیام"}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {chatUser.lastMessageTime && (
                            <div className="text-xs text-gray-500">
                              {new Date(
                                chatUser.lastMessageTime
                              ).toLocaleString(["fa-IR"], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                          {chatUser.unreadCount > 0 && (
                            <div className="mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                              {chatUser.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Chat window */}
        <div
          className={`${
            viewMode === "users" ? "md:col-span-2" : "md:col-span-3"
          } bg-white rounded-lg shadow-md border border-gray-200 flex flex-col h-full`}
        >
          <div className="bg-blue-600 text-white p-3 font-bold rounded-t-lg rtl flex justify-between items-center">
            <div>
              {viewMode === "users"
                ? selectedUser
                  ? `گفتگو با ${selectedUser.name}`
                  : "انتخاب کاربر"
                : "همه پیام‌ها"}
            </div>
          </div>

          {/* Messages - static height with scrollbar */}
          <div
            className="flex-1 overflow-y-auto p-4 rtl"
            style={{ height: "500px", maxHeight: "calc(100vh - 15rem)" }}
          >
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  {viewMode === "users" && !selectedUser
                    ? "لطفا یک کاربر را انتخاب کنید"
                    : "هنوز پیامی ارسال نشده است"}
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg._id}
                  className={`mb-4 flex ${
                    msg.sender.id === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender.id === user.id
                        ? "bg-blue-100 rounded-tr-none"
                        : "bg-gray-100 rounded-tl-none"
                    } relative group`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {msg.sender.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({msg.sender.role})
                      </span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <div className="text-xs text-gray-500 mt-1 text-left flex items-center gap-2">
                      <span>
                        {new Date(msg.timestamp).toLocaleString(["fa-IR"], {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {!msg.read && msg.sender.id !== user.id && (
                        <span className="bg-blue-500 w-2 h-2 rounded-full"></span>
                      )}
                    </div>

                    {/* Admin delete button */}
                    <button
                      onClick={() => handleDeleteMessage(msg._id)}
                      className="absolute top-1 left-1 text-red-500 opacity-0 group-hover:opacity-100 transition"
                      title="حذف پیام"
                    >
                      <FiTrash size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - fixed at bottom */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-gray-200 p-3 flex items-center rtl"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                viewMode === "users" && selectedUser
                  ? `پاسخ به ${selectedUser.name}...`
                  : "پیام خود را بنویسید..."
              }
              className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={viewMode === "users" && !selectedUser}
            />
            <button
              type="submit"
              disabled={
                !message.trim() ||
                !isConnected ||
                (viewMode === "users" && !selectedUser)
              }
              className={`mr-2 px-4 py-2 rounded-lg flex items-center ${
                !message.trim() ||
                !isConnected ||
                (viewMode === "users" && !selectedUser)
                  ? "bg-gray-200 text-gray-400"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <FiSend className="ml-2" />
              ارسال
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
