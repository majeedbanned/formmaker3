import React, { useState, useEffect } from "react";
import { Chatroom } from "../types";

interface ChatroomListProps {
  chatrooms: Chatroom[];
  selectedChatroomId: string | null;
  onSelectChatroom: (chatroomId: string) => void;
  isLoading: boolean;
}

const ChatroomList: React.FC<ChatroomListProps> = ({
  chatrooms,
  selectedChatroomId,
  onSelectChatroom,
  isLoading,
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
    <div className="h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-l from-blue-50 to-white flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-800 text-right mb-3">
          اتاق‌های گفتگو
        </h2>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی اتاق گفتگو..."
            className="w-full p-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            dir="rtl"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
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

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredChatrooms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm.trim() !== ""
              ? "هیچ اتاق گفتگویی با این نام یافت نشد"
              : "هیچ اتاق گفتگویی وجود ندارد"}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredChatrooms.map((room) => (
              <li key={room._id}>
                <button
                  className={`w-full px-4 py-3 text-right transition duration-150 ease-in-out hover:bg-blue-50 focus:outline-none ${
                    selectedChatroomId === room._id
                      ? "bg-blue-100 border-r-4 border-blue-500"
                      : ""
                  }`}
                  onClick={() => onSelectChatroom(room._id)}
                >
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-md font-bold ${
                        selectedChatroomId === room._id
                          ? "text-blue-700"
                          : "text-gray-800"
                      }`}
                    >
                      {room.data.chatroomName}
                    </span>
                    <span className="text-sm text-gray-500 mt-1 flex items-center">
                      <span>کد: {room.data.chatroomCode}</span>
                      {selectedChatroomId === room._id && (
                        <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
                      )}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatroomList;
