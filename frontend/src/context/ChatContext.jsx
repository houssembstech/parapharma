import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { messageAPI, apiUtils } from "../services/api";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useRef(null);

  // Use import.meta.env for Vite
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      socket.current = io(API_URL.replace('/api', ''), { // Remove /api for socket connection
        auth: {
          token: token
        }
      });

      // Join user's personal room
      socket.current.emit('join_user', user._id);

      // Listen for incoming messages
      socket.current.on('receive_message', (message) => {
        setMessages(prev => {
          if (prev.find(msg => msg._id === message._id)) return prev;
          return [...prev, message];
        });

        // Update chats list
        updateChatsList(message);
        
        // Update unread count
        if (message.receiver._id === user._id) {
          setUnreadCount(prev => prev + 1);
        }
      });

      // Listen for chat updates
      socket.current.on('chat_updated', () => {
        fetchChats();
      });

      // Listen for typing indicators
      socket.current.on('user_typing', (data) => {
        if (data.senderId === activeChatUser?._id) {
          setIsTyping(data.isTyping);
        }
      });

      // Listen for messages read confirmation
      socket.current.on('messages_read', (data) => {
        if (data.chatId === [user._id, activeChatUser?._id].sort().join('_')) {
          setMessages(prev => 
            prev.map(msg => 
              msg.receiver === user._id ? { ...msg, isRead: true } : msg
            )
          );
        }
      });

      return () => {
        if (socket.current) {
          socket.current.disconnect();
        }
      };
    }
  }, [user, token, activeChatUser, API_URL]);

  // Helper function to update chats list
  const updateChatsList = (message) => {
    setChats(prev => {
      const chatId = message.chatId;
      const existingChatIndex = prev.findIndex(chat => chat.chatId === chatId);
      
      if (existingChatIndex !== -1) {
        const updatedChats = [...prev];
        updatedChats[existingChatIndex] = {
          ...updatedChats[existingChatIndex],
          lastMessage: message.content,
          timestamp: message.timestamp,
          unreadCount: message.receiver._id === user._id 
            ? (updatedChats[existingChatIndex].unreadCount || 0) + 1
            : updatedChats[existingChatIndex].unreadCount
        };
        const [movedChat] = updatedChats.splice(existingChatIndex, 1);
        return [movedChat, ...updatedChats];
      } else {
        const newChat = {
          chatId,
          lastMessage: message.content,
          timestamp: message.timestamp,
          partner: message.sender._id === user._id ? message.receiver : message.sender,
          partnerDetails: message.sender._id === user._id ? message.receiver : message.sender,
          unreadCount: message.receiver._id === user._id ? 1 : 0
        };
        return [newChat, ...prev];
      }
    });
  };

  // Fetch all chats for user using the API utility
  const fetchChats = async () => {
    if (!token) return;
    setLoadingChats(true);
    try {
      const response = await messageAPI.getChats();
      const mappedChats = response.data.map(chat => ({
        chatId: chat._id,
        partner: chat.partnerDetails,
        lastMessage: chat.lastMessage || "",
        timestamp: chat.timestamp,
        unreadCount: chat.unreadCount || 0
      }));

      setChats(mappedChats);
      
      // Calculate total unread count
      const totalUnread = mappedChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
      
    } catch (err) {
      const errorInfo = apiUtils.handleError(err, 'Failed to load chats');
      setError(errorInfo.error);
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  // Fetch messages for selected user
  const fetchMessages = async (partnerId) => {
    if (!token || !partnerId) return [];
    setLoadingMessages(true);
    try {
      const response = await messageAPI.getMessages(partnerId);
      setMessages(response.data || []);
      
      // Mark messages as read via socket
      if (socket.current && partnerId) {
        socket.current.emit('mark_messages_read', {
          chatId: [user._id, partnerId].sort().join('_'),
          userId: user._id,
          senderId: partnerId
        });
      }
      
      return response.data;
    } catch (err) {
      const errorInfo = apiUtils.handleError(err, 'Failed to load messages');
      setError(errorInfo.error);
      setMessages([]);
      return [];
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message using socket
  const sendMessage = async (receiverId, content) => {
    if (!token || !content.trim() || !socket.current) return;
    
    try {
      const messageData = {
        senderId: user._id,
        receiverId,
        content: content.trim(),
        chatId: [user._id, receiverId].sort().join('_')
      };

      // Emit message via socket
      socket.current.emit('send_message', messageData);

      // Optimistically add message to UI
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        sender: { _id: user._id, name: user.name },
        receiver: receiverId,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        isOptimistic: true,
        isRead: false
      };

      setMessages(prev => [...prev, optimisticMessage]);

    } catch (err) {
      const errorInfo = apiUtils.handleError(err, 'Failed to send message');
      setError(errorInfo.error);
    }
  };

  // Typing indicators
  const startTyping = (receiverId) => {
    if (socket.current && receiverId) {
      socket.current.emit('typing_start', {
        senderId: user._id,
        receiverId
      });
    }
  };

  const stopTyping = (receiverId) => {
    if (socket.current && receiverId) {
      socket.current.emit('typing_stop', {
        senderId: user._id,
        receiverId
      });
    }
  };

  // Select chat with a user
  const selectChat = async (partner) => {
    setActiveChatUser(partner);
    setIsTyping(false);
    await fetchMessages(partner._id);
    
    // Reset unread count for this chat in local state
    setChats(prev => 
      prev.map(chat => 
        chat.partner._id === partner._id 
          ? { ...chat, unreadCount: 0 }
          : chat
      )
    );
  };

  // Fetch unread count separately
  const fetchUnreadCount = async () => {
    try {
      const response = await messageAPI.getUnreadCount();
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  // Load chats on token change
  useEffect(() => {
    if (token) {
      fetchChats();
      fetchUnreadCount();
    }
  }, [token]);

  // Clear error
  const clearError = () => setError(null);

  return (
    <ChatContext.Provider
      value={{
        chats,
        messages,
        activeChatUser,
        loadingChats,
        loadingMessages,
        error,
        isTyping,
        unreadCount,
        fetchChats,
        fetchMessages,
        sendMessage,
        selectChat,
        startTyping,
        stopTyping,
        clearError,
        fetchUnreadCount,
        socket: socket.current
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
};