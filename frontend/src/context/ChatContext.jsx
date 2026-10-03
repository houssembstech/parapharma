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

  const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

  // Définir l'ID admin
  const ADMIN_ID = "69147c245c5da4da1f43483d";

  // Clé de stockage basée sur l'utilisateur actuel
  const getStorageKey = (partnerId = null) => {
    if (!user) return null;
    
    // Pour les clients, toujours stocker avec l'admin
    if (user.role !== 'admin' && !partnerId) {
      partnerId = ADMIN_ID;
    }
    
    if (partnerId) {
      return `chat_${user._id}_${partnerId}`;
    }
    return `chats_list_${user._id}`;
  };

  // Sauvegarder les messages dans localStorage
  const saveMessagesToStorage = (partnerId, messages) => {
    try {
      const storageKey = getStorageKey(partnerId);
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch (err) {
      console.error('Erreur sauvegarde messages:', err);
    }
  };

  // Charger les messages depuis localStorage
  const loadMessagesFromStorage = (partnerId) => {
    try {
      const storageKey = getStorageKey(partnerId);
      if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [];
      }
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    }
    return [];
  };

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      socket.current = io(API_URL.replace('/api', ''), {
        auth: { token }
      });

      socket.current.emit('join_user', user._id);

      // Listen for incoming messages
      socket.current.on('receive_message', (message) => {
        console.log('Message reçu:', message);
        
        setMessages(prev => {
          const messageExists = prev.find(msg => msg._id === message._id);
          if (messageExists) return prev;
          
          const newMessages = [...prev, message];
          
          // Sauvegarder dans localStorage
          const partnerId = user.role === 'admin' ? message.sender._id : ADMIN_ID;
          saveMessagesToStorage(partnerId, newMessages);
          
          return newMessages;
        });

        // Mettre à jour la liste des chats
        updateChatsList(message);
        
        if (message.receiver._id === user._id) {
          setUnreadCount(prev => prev + 1);
        }
      });

      // Listen for typing indicators
      socket.current.on('user_typing', (data) => {
        if (data.senderId === activeChatUser?._id) {
          setIsTyping(data.isTyping);
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
      const partner = message.sender._id === user._id ? message.receiver : message.sender;
      
      const existingChatIndex = prev.findIndex(chat => 
        chat.partner._id === partner._id
      );
      
      let updatedChats;
      
      if (existingChatIndex !== -1) {
        updatedChats = [...prev];
        updatedChats[existingChatIndex] = {
          ...updatedChats[existingChatIndex],
          lastMessage: message.content,
          timestamp: message.timestamp,
          unreadCount: message.receiver._id === user._id 
            ? (updatedChats[existingChatIndex].unreadCount || 0) + 1
            : updatedChats[existingChatIndex].unreadCount
        };
        const [movedChat] = updatedChats.splice(existingChatIndex, 1);
        updatedChats = [movedChat, ...updatedChats];
      } else {
        const newChat = {
          chatId,
          lastMessage: message.content,
          timestamp: message.timestamp,
          partner: partner,
          unreadCount: message.receiver._id === user._id ? 1 : 0
        };
        updatedChats = [newChat, ...prev];
      }
      
      return updatedChats;
    });
  };

  // Fetch all chats for user
  const fetchChats = async () => {
    if (!token) return;
    setLoadingChats(true);
    try {
      const response = await messageAPI.getChats();
      const mappedChats = response.data.map(chat => ({
        chatId: chat._id,
        partner: chat.partnerDetails || chat.partner,
        lastMessage: chat.lastMessage || "",
        timestamp: chat.timestamp,
        unreadCount: chat.unreadCount || 0
      }));

      setChats(mappedChats);
      
      const totalUnread = mappedChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
      
    } catch (err) {
      const errorInfo = apiUtils.handleError(err, 'Failed to load chats');
      setError(errorInfo.error);
      console.log('Error loading chats, using empty list');
    } finally {
      setLoadingChats(false);
    }
  };

  // Fetch messages for selected user
  const fetchMessages = async (partnerId) => {
    if (!token || !partnerId) {
      // Pour les clients, charger depuis le stockage local
      if (user?.role !== 'admin') {
        const cachedMessages = loadMessagesFromStorage(ADMIN_ID);
        setMessages(cachedMessages);
      }
      return [];
    }
    
    setLoadingMessages(true);
    try {
      // Charger d'abord depuis le stockage local
      const cachedMessages = loadMessagesFromStorage(partnerId);
      setMessages(cachedMessages);

      // Puis récupérer depuis l'API
      const response = await messageAPI.getMessages(partnerId);
      const apiMessages = response.data || [];
      
      setMessages(apiMessages);
      saveMessagesToStorage(partnerId, apiMessages);
      
      return apiMessages;
    } catch (err) {
      const errorInfo = apiUtils.handleError(err, 'Failed to load messages');
      setError(errorInfo.error);
      // Utiliser les messages en cache en cas d'erreur
      console.log('Using cached messages due to error');
      return cachedMessages;
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message using socket
  const sendMessage = async (receiverId, content) => {
    if (!token || !content.trim() || !socket.current) {
      setError("Impossible d'envoyer le message");
      return;
    }
    
    try {
      const messageData = {
        senderId: user._id,
        receiverId: receiverId,
        content: content.trim(),
        chatId: [user._id, receiverId].sort().join('_')
      };

      console.log('Envoi message:', messageData);

      // Optimistically add message to UI
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        sender: { _id: user._id, name: user.name },
        receiver: { _id: receiverId },
        content: content.trim(),
        timestamp: new Date().toISOString(),
        isOptimistic: true,
        isRead: false
      };

      setMessages(prev => {
        const newMessages = [...prev, optimisticMessage];
        const storagePartnerId = user.role === 'admin' ? receiverId : ADMIN_ID;
        saveMessagesToStorage(storagePartnerId, newMessages);
        return newMessages;
      });

      // Emit message via socket
      socket.current.emit('send_message', messageData);

    } catch (err) {
      const errorInfo = apiUtils.handleError(err, 'Failed to send message');
      setError(errorInfo.error);
      throw err; // Propager l'erreur
    }
  };

  // Typing indicators
  const startTyping = (receiverId) => {
    if (socket.current && receiverId) {
      socket.current.emit('typing_start', {
        senderId: user._id,
        receiverId: receiverId
      });
    }
  };

  const stopTyping = (receiverId) => {
    if (socket.current && receiverId) {
      socket.current.emit('typing_stop', {
        senderId: user._id,
        receiverId: receiverId
      });
    }
  };

  // Select chat with a user
  const selectChat = async (partner) => {
    setActiveChatUser(partner);
    setIsTyping(false);
    await fetchMessages(partner._id);
  };

  // Pour les clients : sélectionner automatiquement l'admin
  const initializeClientChat = () => {
    if (user?.role !== 'admin') {
      const adminUser = {
        _id: ADMIN_ID,
        name: "Support",
        role: "admin"
      };
      setActiveChatUser(adminUser);
      fetchMessages(ADMIN_ID);
    }
  };

  // Clear chat history for a specific conversation
  const clearChatHistory = (partnerId) => {
    try {
      const storageKey = getStorageKey(partnerId);
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
      setMessages([]);
      
      // Recharger les messages depuis l'API
      if (partnerId) {
        fetchMessages(partnerId);
      }
    } catch (err) {
      console.error('Error clearing chat history:', err);
      setError('Failed to clear chat history');
    }
  };

  // Load chats on token change
  useEffect(() => {
    if (token && user) {
      if (user.role === 'admin') {
        fetchChats();
      } else {
        // Pour les clients, initialiser directement le chat avec l'admin
        initializeClientChat();
      }
    }
  }, [token, user]);

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
        clearChatHistory,
        initializeClientChat,
        ADMIN_ID
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
