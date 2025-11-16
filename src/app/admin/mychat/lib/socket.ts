import { io, Socket } from 'socket.io-client';

// Socket.IO instance
let socket: Socket | null = null;

// Chat server URL
const CHAT_SERVER_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:3001';

/**
 * Initialize Socket.IO connection with authentication
 * @param token JWT token for authentication
 * @returns Socket.IO instance
 */
export const initializeSocket = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(CHAT_SERVER_URL, {
    auth: {
      token
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Log connection status
  socket.on('connect', () => {
    // console.log('Socket.IO connected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    // console.log('Socket.IO disconnected:', reason);
  });

  socket.on('reconnect', (attempt) => {
    // console.log('Socket.IO reconnected after', attempt, 'attempts');
  });

  return socket;
};

/**
 * Get the current Socket.IO instance
 * @returns Socket.IO instance or null if not initialized
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect Socket.IO connection
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 