import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { User, Chatroom, ChatMessage } from "../types";
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

        // console.log("token", token);

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

  // Handle new messages
  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      if (message.chatroomId === selectedChatroomId) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
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
    } catch (error) {
      console.error("Error loading chatrooms:", error);
      toast.error("خطا در بارگذاری لیست گفتگوها");
    } finally {
      setIsLoadingChatrooms(false);
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
        } else {
          console.error("Error joining room:", response.error);
          toast.error("خطا در ورود به اتاق گفتگو");
        }
      }
    );
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-[calc(100vh-150px)]">
      {/* Chatroom list (right column) */}
      <div className="md:col-span-1 order-2 md:order-1 h-full">
        <ChatroomList
          chatrooms={chatrooms}
          selectedChatroomId={selectedChatroomId}
          onSelectChatroom={handleSelectChatroom}
          isLoading={isLoadingChatrooms}
        />
      </div>

      {/* Chat window (left column) */}
      <div className="md:col-span-2 order-1 md:order-2 h-full">
        <ChatWindow
          user={user}
          selectedChatroom={selectedChatroom}
          messages={messages}
          isLoading={isLoadingMessages}
        />
      </div>
    </div>
  );
};

export default ChatLayout;
