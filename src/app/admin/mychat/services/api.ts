import axios from 'axios';
import { Chatroom, ChatMessage } from '../types';

// Chat server URL
const CHAT_SERVER_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:3001';

// Create axios instance
const chatApi = axios.create({
  baseURL: CHAT_SERVER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Set auth token for API requests
 * @param token JWT token
 */
export const setAuthToken = (token: string): void => {
  chatApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

/**
 * Fetch all chatrooms for the current user
 * @param domain Domain name for database connection
 * @returns Promise with chatrooms array
 */
export const fetchChatrooms = async (domain: string = 'localhost:3000'): Promise<Chatroom[]> => {
  try {
    const response = await chatApi.get('/api/chatrooms', {
      headers: {
        'x-domain': domain,
      },
    });
    return response.data.chatrooms;
  } catch (error) {
    console.error('Error fetching chatrooms:', error);
    return [];
  }
};

/**
 * Fetch messages for a specific chatroom
 * @param chatroomId Chatroom ID
 * @param domain Domain name for database connection
 * @returns Promise with messages array
 */
export const fetchMessages = async (
  chatroomId: string,
  domain: string = 'localhost:3000'
): Promise<ChatMessage[]> => {
  try {
    const response = await chatApi.get(`/api/messages/${chatroomId}`, {
      headers: {
        'x-domain': domain,
      },
    });
    return response.data.messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}; 