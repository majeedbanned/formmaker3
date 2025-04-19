export interface User {
  id: string;
  name: string;
  username: string;
  userType: string;
  schoolCode: string;
  role: string;
}

export interface ChatroomRecipient {
  students?: string[];
  groups?: string[];
  classCode?: string[];
  teachers?: string[];
}

export interface Chatroom {
  _id: string;
  data: {
  chatroomCode: string;
  chatroomName: string;
  schoolCode: string;
  recipients?: ChatroomRecipient;
  }
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  _id: string;
  chatroomId: string;
  schoolCode: string;
  content: string;
  sender: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  timestamp: string;
  read: boolean;
  createdAt?: string;
  updatedAt?: string;
} 