export interface User {
  id: string;
  name: string;
  username: string;
  userType: string;
  schoolCode: string;
  role: string;
  classCode?: { label: string; value: string }[];
  groups?: { label: string; value: string }[];
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

export interface FileAttachment {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  type: string;
  url: string;
  isImage: boolean;
}

export interface Reaction {
  emoji: string;
  users: {
    id: string;
    name: string;
  }[];
}

export interface ReferencedMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
  };
  hasAttachment: boolean;
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
  fileAttachment?: FileAttachment;
  edited?: boolean;
  editedAt?: string;
  reactions?: Record<string, Reaction>;
  replyTo?: ReferencedMessage;
} 