import axios from 'axios';
import { Chatroom, ChatMessage, FileAttachment } from '../types';

// Chat server URL
const CHAT_SERVER_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:3001';

// Create Axios instance for chat API
const chatApi = axios.create({
  baseURL: CHAT_SERVER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global auth token
let authToken: string | null = null;

/**
 * Set the auth token for API requests
 * @param token JWT token
 */
export function setAuthToken(token: string): void {
  authToken = token;
  chatApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/**
 * Get the current auth token
 * @returns Current auth token
 */
export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Upload a file to the server
 * @param file File to upload
 * @returns Response containing file attachment data
 */
export async function uploadFile(file: File): Promise<{ fileAttachment: FileAttachment }> {
  if (!authToken) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${CHAT_SERVER_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  return response.json();
}

/**
 * Get chatrooms for the current user
 * @returns List of chatrooms
 */
export const getChatrooms = async (): Promise<Chatroom[]> => {
  const response = await chatApi.get('/api/chatrooms');
  return response.data.chatrooms;
};

/**
 * Get messages for a specific chatroom
 * @param chatroomId Chatroom ID
 * @returns List of messages
 */
export const getMessages = async (chatroomId: string): Promise<ChatMessage[]> => {
  const response = await chatApi.get(`/api/messages/${chatroomId}`);
  return response.data.messages;
}; 