import React, { useState, useEffect } from "react";
import { Chatroom } from "../types";

interface ChatroomListProps {
  chatrooms: Chatroom[];
  selectedChatroomId: string | null;
  onSelectChatroom: (chatroomId: string) => void;
  isLoading: boolean;
  unreadCounts: Record<string, number>;
}

const ChatroomList: React.FC<ChatroomListProps> = ({
  chatrooms,
  selectedChatroomId,
  onSelectChatroom,
  isLoading,
  unreadCounts,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChatrooms, setFilteredChatrooms] = useState<Chatroom[]>([]);

  // Filter chatrooms when search term or chatrooms change
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChatrooms(chatrooms);
    } else {
      const filtered = chatrooms.filter((room) =>
        room.data.chatroomName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChatrooms(filtered);
    }
  }, [searchTerm, chatrooms]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-l from-blue-50 to-white flex-shrink-0">
        <div className="flex items-center space-x-reverse space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
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
          <h2 className="text-lg font-bold text-gray-800">اتاق‌های گفتگو</h2>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی اتاق گفتگو..."
            className="w-full p-3 pr-4 pl-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right bg-white shadow-sm transition-all duration-200"
            dir="rtl"
          />
          <div className="absolute left-3 top-3.5 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Chatrooms List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-500">در حال بارگذاری...</p>
            </div>
          </div>
        ) : filteredChatrooms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm.trim() !== ""
                ? "هیچ اتاق گفتگویی یافت نشد"
                : "هیچ اتاق گفتگویی وجود ندارد"}
            </p>
            <p className="text-sm text-gray-400">
              {searchTerm.trim() !== ""
                ? "عبارت جستجو را تغییر دهید"
                : "اتاق گفتگوی جدیدی ایجاد نشده است"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredChatrooms.map((room) => (
              <div key={room._id} className="mb-2">
                <button
                  className={`w-full p-4 text-right transition-all duration-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group ${
                    selectedChatroomId === room._id
                      ? "bg-gradient-to-l from-blue-100 to-blue-50 border-r-4 border-blue-500 shadow-sm"
                      : "hover:shadow-sm"
                  }`}
                  onClick={() => onSelectChatroom(room._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-base font-semibold transition-colors ${
                            selectedChatroomId === room._id
                              ? "text-blue-700"
                              : "text-gray-800 group-hover:text-blue-600"
                          }`}
                        >
                          {room.data.chatroomName}
                        </span>
                        <div className="flex items-center space-x-reverse space-x-2">
                          {/* Unread count badge - only show if not currently selected */}
                          {unreadCounts[room._id] > 0 &&
                            selectedChatroomId !== room._id && (
                              <div className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                                {unreadCounts[room._id] > 99
                                  ? "99+"
                                  : unreadCounts[room._id]}
                              </div>
                            )}
                          {selectedChatroomId === room._id && (
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          کد: {room.data.chatroomCode}
                        </span>
                        <div className="flex items-center space-x-reverse space-x-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                          <span className="text-xs text-gray-400">فعال</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatroomList;
