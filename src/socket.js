import { io } from "socket.io-client";

const getSocketURL = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000'; // SSR fallback
  
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SOCKET_URL_PRODUCTION || 'https://creatisketch-server.onrender.com';
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
};

const URL = getSocketURL();

export const socket = io(URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
  transports: ['websocket', 'polling']
});

// Connection status tracking
export const connectionStatus = {
  connected: false,
  connecting: false,
  error: null
};

socket.on('connect', () => {
  connectionStatus.connected = true;
  connectionStatus.connecting = false;
  connectionStatus.error = null;
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  connectionStatus.connected = false;
  connectionStatus.connecting = false;
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  connectionStatus.connected = false;
  connectionStatus.connecting = false;
  connectionStatus.error = error.message;
  console.error('Socket connection error:', error);
});

socket.on('reconnect', (attemptNumber) => {
  connectionStatus.connected = true;
  connectionStatus.connecting = false;
  connectionStatus.error = null;
  console.log('Socket reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_attempt', () => {
  connectionStatus.connecting = true;
  console.log('Attempting to reconnect...');
});

socket.on('reconnect_error', (error) => {
  connectionStatus.error = error.message;
  console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  connectionStatus.connected = false;
  connectionStatus.connecting = false;
  connectionStatus.error = 'Failed to reconnect';
  console.error('Failed to reconnect to server');
});