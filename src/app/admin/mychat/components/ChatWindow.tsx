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

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        <div className="text-center">
          <p className="text-gray-600">
            برای شروع گفتگو، یک اتاق را از لیست انتخاب کنید
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-md">
      {/* Chat header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 rtl:text-right">
          {selectedChatroom.data.chatroomName}
        </h2>
        <p className="text-sm text-gray-500 rtl:text-right">
          کد گفتگو: {selectedChatroom.data.chatroomCode}
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">هنوز پیامی ارسال نشده است</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${
                  isMyMessage(message.sender.id)
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                    isMyMessage(message.sender.id)
                      ? "bg-blue-500 text-white rounded-tr-none"
                      : "bg-gray-200 text-gray-800 rounded-tl-none"
                  }`}
                >
                  {!isMyMessage(message.sender.id) && (
                    <div className="font-medium text-sm mb-1 rtl:text-right">
                      {message.sender.name}
                    </div>
                  )}
                  <div className="rtl:text-right whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      isMyMessage(message.sender.id)
                        ? "text-blue-100 text-left"
                        : "text-gray-500 text-right"
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
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 p-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 rtl:text-right"
            disabled={isSending}
          />
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-500 text-white rounded-l-md ${
              isSending || !messageInput.trim()
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-600"
            }`}
            disabled={isSending || !messageInput.trim()}
          >
            {isSending ? (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              "ارسال"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
