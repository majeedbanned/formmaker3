import React, { useState, useRef, useEffect } from "react";
import { User, ChatMessage, Chatroom } from "../types";
import { getSocket } from "../lib/socket";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedChatroom || isSending) return;

    setIsSending(true);

    const socket = getSocket();
    if (!socket) {
      console.error("Socket not connected");
      setIsSending(false);
      return;
    }

    socket.emit(
      "send-message",
      {
        chatroomId: selectedChatroom._id,
        content: messageInput.trim(),
      },
      (response: { success: boolean; error?: string }) => {
        setIsSending(false);

        if (response.success) {
          setMessageInput("");
          // Focus input after sending
          inputRef.current?.focus();
        } else {
          console.error("Error sending message:", response.error);
          // You might want to show an error notification here
        }
      }
    );
  };

  const isMyMessage = (senderId: string) => {
    return senderId === user.id;
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

      {/* Message input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex">
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-500 text-white rounded-l-md flex items-center justify-center min-w-[80px] ${
              isSending || !messageInput.trim()
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-600"
            }`}
            disabled={isSending || !messageInput.trim()}
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
            className="flex-1 p-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            disabled={isSending}
            dir="rtl"
          />
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
