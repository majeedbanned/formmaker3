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
  console.log("chatrooms", chatrooms);
  // Filter chatrooms when search term or chatrooms change
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChatrooms(chatrooms);
    } else {
      const filtered = chatrooms.filter((room) =>
        room.chatroomName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChatrooms(filtered);
    }
  }, [searchTerm, chatrooms]);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 rtl:text-right">
          گفتگوها
        </h2>
        <div className="mt-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی گفتگو..."
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 rtl:text-right"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredChatrooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm.trim() !== ""
              ? "گفتگویی یافت نشد"
              : "گفتگویی وجود ندارد"}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredChatrooms.map((room) => (
              <li key={room._id}>
                <button
                  className={`w-full px-4 py-3 text-right transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none ${
                    selectedChatroomId === room._id
                      ? "bg-blue-50 border-r-4 border-blue-500"
                      : ""
                  }`}
                  onClick={() => onSelectChatroom(room._id)}
                >
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-md font-medium ${
                        selectedChatroomId === room._id
                          ? "text-blue-600"
                          : "text-gray-800"
                      }`}
                    >
                      {room.data.chatroomName}
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      کد گفتگو: {room.data.chatroomCode}
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
