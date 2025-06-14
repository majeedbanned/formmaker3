import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { User, Chatroom, ChatMessage, Reaction } from "../types";
import { setAuthToken } from "../services/api";
import { initializeSocket, getSocket, disconnectSocket } from "../lib/socket";
import ChatroomList from "./ChatroomList";
import ChatWindow from "./ChatWindow";

interface ChatLayoutProps {
  user: User;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ user }) => {
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [selectedChatroomId, setSelectedChatroomId] = useState<string | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChatrooms, setIsLoadingChatrooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Get selected chatroom object
  const selectedChatroom =
    chatrooms.find((room) => room._id === selectedChatroomId) || null;

  // Initialize socket connection and fetch chatrooms
  useEffect(() => {
    // Function to initialize chat
    const initializeChat = async () => {
      try {
        // We're using the auth token from the user prop instead of cookies directly
        if (!user || !user.id) {
          toast.error("خطا در احراز هویت. لطفاً دوباره وارد شوید");
          return;
        }

        // Get auth token through an API request
        const response = await fetch("/api/auth/token");
        if (!response.ok) {
          toast.error("خطا در دریافت توکن احراز هویت");
          return;
        }

        const data = await response.json();
        const token = data.token;

        if (!token) {
          toast.error("توکن احراز هویت یافت نشد");
          return;
        }

        // Set token for API requests
        setAuthToken(token);

        // Initialize socket
        initializeSocket(token);

        // Load chatrooms
        loadChatrooms();
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("خطا در راه‌اندازی گفتگو");
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [user]);

  // Set up global socket listeners (unread counts updates)
  useEffect(() => {
    const setupSocketListeners = (): (() => void) | null => {
      const socket = getSocket();
      if (!socket) return null;

      // Handle unread counts updates - this should always be active
      const handleUnreadCountsUpdated = (
        newUnreadCounts: Record<string, number>
      ) => {
        console.log("Received unread counts update:", newUnreadCounts);
        setUnreadCounts(newUnreadCounts);
      };

      socket.on("unread-counts-updated", handleUnreadCountsUpdated);

      return () => {
        socket.off("unread-counts-updated", handleUnreadCountsUpdated);
      };
    };

    // Try to set up listeners immediately
    let cleanup = setupSocketListeners();

    // If socket isn't ready, try again after a short delay
    if (!cleanup) {
      const timeout = setTimeout(() => {
        cleanup = setupSocketListeners();
      }, 500);

      return () => {
        clearTimeout(timeout);
        if (cleanup) cleanup();
      };
    }

    return cleanup;
  }, []);

  // Handle new messages, deletions, and edits
  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      if (message.chatroomId === selectedChatroomId) {
        setMessages((prevMessages) => [...prevMessages, message]);

        // Mark the message as read since the chatroom is currently active
        socket.emit("mark-messages-read", { chatroomId: selectedChatroomId });

        // Clear unread count for this chatroom since user is actively viewing it
        setUnreadCounts((prev) => ({
          ...prev,
          [selectedChatroomId]: 0,
        }));
      }
    };

    const handleMessageDeleted = (data: { messageId: string }) => {
      if (selectedChatroomId) {
        setMessages((prevMessages) =>
          prevMessages.filter((message) => message._id !== data.messageId)
        );
      }
    };

    const handleMessageEdited = (data: {
      messageId: string;
      newContent: string;
      editedAt: string;
    }) => {
      if (selectedChatroomId) {
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message._id === data.messageId
              ? {
                  ...message,
                  content: data.newContent,
                  edited: true,
                  editedAt: data.editedAt,
                }
              : message
          )
        );
      }
    };

    const handleReactionUpdated = (data: {
      messageId: string;
      reactions: Record<string, Reaction>;
    }) => {
      if (selectedChatroomId) {
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message._id === data.messageId
              ? {
                  ...message,
                  reactions: data.reactions,
                }
              : message
          )
        );
      }
    };

    socket.on("new-message", handleNewMessage);
    socket.on("message-deleted", handleMessageDeleted);
    socket.on("message-edited", handleMessageEdited);
    socket.on("message-reaction-updated", handleReactionUpdated);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("message-deleted", handleMessageDeleted);
      socket.off("message-edited", handleMessageEdited);
      socket.off("message-reaction-updated", handleReactionUpdated);
    };
  }, [selectedChatroomId]);

  // Load chatrooms directly from Next.js app database
  const loadChatrooms = async () => {
    setIsLoadingChatrooms(true);
    try {
      // Fetch chatrooms from the Next.js API endpoint
      const response = await fetch("/api/chatrooms", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chatrooms: ${response.status}`);
      }

      const data = await response.json();
      setChatrooms(data.chatrooms || []);

      // Load unread counts after loading chatrooms
      loadUnreadCounts();
    } catch (error) {
      console.error("Error loading chatrooms:", error);
      toast.error("خطا در بارگذاری لیست گفتگوها");
    } finally {
      setIsLoadingChatrooms(false);
    }
  };

  // Load unread counts for all chatrooms
  const loadUnreadCounts = async () => {
    try {
      const socket = getSocket();
      if (socket) {
        socket.emit(
          "get-unread-counts",
          null,
          (response: {
            success: boolean;
            unreadCounts?: Record<string, number>;
            error?: string;
          }) => {
            if (response.success && response.unreadCounts) {
              setUnreadCounts(response.unreadCounts);
            } else {
              console.error("Error loading unread counts:", response.error);
            }
          }
        );
      }
    } catch (error) {
      console.error("Error loading unread counts:", error);
    }
  };

  // Join a chatroom and load messages
  const handleSelectChatroom = useCallback((chatroomId: string) => {
    setSelectedChatroomId(chatroomId);
    setIsLoadingMessages(true);
    setMessages([]);

    const socket = getSocket();

    if (!socket) {
      toast.error("اتصال به سرور گفتگو برقرار نیست");
      setIsLoadingMessages(false);
      return;
    }

    // Join room and get messages
    socket.emit(
      "join-room",
      chatroomId,
      (response: {
        success: boolean;
        messages?: ChatMessage[];
        error?: string;
      }) => {
        setIsLoadingMessages(false);

        if (response.success && response.messages) {
          setMessages(response.messages);

          // Clear unread count for this chatroom since user just joined
          setUnreadCounts((prev) => ({
            ...prev,
            [chatroomId]: 0,
          }));
        } else {
          console.error("Error joining room:", response.error);
          toast.error("خطا در ورود به اتاق گفتگو");
        }
      }
    );
  }, []);

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-4 gap-1 h-full overflow-hidden"
      dir="rtl"
    >
      {/* Chatroom list (right column) */}
      <div className="lg:col-span-1 h-full overflow-hidden">
        <div className="bg-white shadow-sm border-r border-gray-200 h-full">
          <ChatroomList
            chatrooms={chatrooms}
            selectedChatroomId={selectedChatroomId}
            onSelectChatroom={handleSelectChatroom}
            isLoading={isLoadingChatrooms}
            unreadCounts={unreadCounts}
          />
        </div>
      </div>

      {/* Chat window (left column) */}
      <div className="lg:col-span-3 h-full overflow-hidden">
        <div className="bg-white h-full">
          <ChatWindow
            user={user}
            selectedChatroom={selectedChatroom}
            messages={messages}
            isLoading={isLoadingMessages}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
