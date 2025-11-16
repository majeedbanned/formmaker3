"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { IoMdChatbubbles } from "react-icons/io";
import { FiSend, FiX } from "react-icons/fi";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

// Chat message type
interface ChatMessage {
  _id: string;
  content: string;
  chatroomId?: string; // Optional because floating chat messages don't need it
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

// User type
interface User {
  id: string;
  userType: "school" | "teacher" | "student";
  schoolCode: string;
  username: string;
  name: string;
  role: string;
}

const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref to track pending message IDs to prevent duplicates
  const pendingMessageIds = useRef<Set<string>>(new Set());

  // Use a memoized version of the messages that filters out duplicates
  const uniqueMessages = useMemo(() => {
    const seen = new Set();
    return messages.filter((msg) => {
      const duplicate = seen.has(msg._id);
      seen.add(msg._id);
      return !duplicate;
    });
  }, [messages]);

  // Function to fetch the user data
  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      const data = await response.json();
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

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

  // Function to fetch unread message count
  const fetchUnreadCount = () => {
    if (socket && isConnected) {
      socket.emit(
        "get-floating-unread-count",
        (response: { success: boolean; count: number }) => {
          if (response.success) {
            setUnreadCount(response.count);
          }
        }
      );
    }
  };

  // Initialization logic - Runs once on component mount
  useEffect(() => {
    let mounted = true;
    const initializeChat = async () => {
      const userData = await fetchUser();
      if (!userData || !mounted) return;

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
        // console.log("Socket connected:", socketInstance.id);

        // Join the floating chat room
        socketInstance.emit(
          "join-room",
          "floating-chat",
          (response: { success: boolean; messages?: ChatMessage[] }) => {
            if (!mounted) return;
            if (response.success && response.messages) {
              // Set messages directly, not appending
              setMessages(response.messages);
              // Clear the pending messages set when loading initial messages
              pendingMessageIds.current.clear();
            }
            // Get unread count
            fetchUnreadCount();
          }
        );
      });

      socketInstance.on("disconnect", () => {
        if (!mounted) return;
        setIsConnected(false);
        // console.log("Socket disconnected");
      });

      socketInstance.on("new-message", (message: ChatMessage) => {
        if (!mounted) return;

        // Check if this message ID is already pending
        if (pendingMessageIds.current.has(message._id)) {
          // This message was already added locally, so remove it from pending
          pendingMessageIds.current.delete(message._id);
          return;
        }

        // Add the message to state
        setMessages((prev) => {
          // Check if the message already exists in the state
          if (prev.some((msg) => msg._id === message._id)) {
            return prev; // Don't add duplicate message
          }

          // If message is not from current user and chat is closed, increment unread count
          if (userData && message.sender.id !== userData.id && !isOpen) {
            setUnreadCount((prevCount) => prevCount + 1);
          }

          return [...prev, message];
        });
      });

      socketInstance.on("message-deleted", (data: { messageId: string }) => {
        if (!mounted) return;
        setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    };

    initializeChat();

    return () => {
      mounted = false;
    };
  }, []);

  // Scroll to bottom when messages change or chat is opened
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [uniqueMessages, isOpen]);

  // Mark messages as read when opening the chat
  useEffect(() => {
    if (isOpen && socket && isConnected) {
      // Reset unread count
      setUnreadCount(0);

      // Mark messages as read on the server
      socket.emit("join-room", "floating-chat", () => {
        // Just rejoin the room to mark messages as read
      });
    }
  }, [isOpen, socket, isConnected]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket || !isConnected || !user) return;

    // Send message
    socket.emit(
      "send-message",
      {
        chatroomId: "floating-chat",
        content: message.trim(),
        fileAttachment: null,
        replyTo: null,
      },
      (response: { success: boolean; message?: ChatMessage }) => {
        if (response.success) {
          setMessage("");

          // Only add the message to the state if the server response includes the message
          if (response.message) {
            // Add message ID to pending set to prevent duplicate when receiving via socket
            pendingMessageIds.current.add(response.message._id);

            // Add the message to the local state
            setMessages((prev) => {
              // Make sure we're not adding a duplicate
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

  if (isLoading) return null;
  if (!user) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Chat button */}
      <button
        onClick={toggleChat}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition duration-200 flex items-center justify-center relative"
        aria-label="چت"
      >
        {isOpen ? (
          <FiX className="w-6 h-6" />
        ) : (
          <IoMdChatbubbles className="w-6 h-6" />
        )}

        {/* Unread counter */}
        {!isOpen && unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </button>

      {/* Chat box */}
      {isOpen && false && (
        <div className="absolute bottom-16 left-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 font-bold rtl">
            گفتگوی آنلاین
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 max-h-96 rtl">
            {uniqueMessages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                پیامی وجود ندارد. اولین پیام خود را ارسال کنید.
              </p>
            ) : (
              uniqueMessages.map((msg) => (
                <div
                  key={msg._id}
                  className={`mb-2 max-w-[85%] ${
                    msg.sender.id === user.id
                      ? "mr-auto bg-blue-100 rounded-tr-none"
                      : "ml-auto bg-gray-100 rounded-tl-none"
                  } p-2 rounded-lg`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {msg.sender.name}
                  </div>
                  <div className="text-sm">{msg.content}</div>
                  <div className="text-xs text-gray-400 text-left mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString(["fa-IR"], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-gray-200 p-2 flex items-center rtl"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!message.trim() || !isConnected}
              className={`ml-2 p-2 rounded-full ${
                !message.trim() || !isConnected
                  ? "bg-gray-200 text-gray-400"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <FiSend className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FloatingChat;
