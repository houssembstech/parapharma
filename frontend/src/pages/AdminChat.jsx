// src/pages/Admin/AdminChat.jsx
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";

const AdminChat = () => {
  const { 
    chats, 
    messages, 
    sendMessage, 
    loadingMessages,
    isTyping,
    startTyping,
    stopTyping,
    currentChat,
    selectChat,
    fetchAdminChats,
    error,
    clearError
  } = useChat();
  
  const { user } = useAuth();
  
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [localError, setLocalError] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Charger les chats admin au démarrage
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminChats();
    }
  }, [user]);

  // Sélectionner le premier chat automatiquement
  useEffect(() => {
    if (chats.length > 0 && !currentChat) {
      selectChat(chats[0]);
    }
  }, [chats, currentChat]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (!currentChat) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      startTyping(currentChat._id);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentChat._id);
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentChat) {
      setLocalError("Veuillez écrire un message");
      return;
    }

    // Arrêter l'indicateur de frappe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(currentChat._id);

    setSending(true);
    setLocalError(null);

    try {
      // Trouver l'utilisateur à qui répondre
      const customer = currentChat.participants?.find(p => p.role === 'customer' || p._id !== user._id);
      if (!customer) {
        throw new Error("Client non trouvé dans la conversation");
      }

      await sendMessage(customer._id, newMessage.trim(), currentChat._id);
      setNewMessage("");
    } catch (err) {
      console.error("Erreur envoi message admin:", err);
      setLocalError(err.message || "Échec de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const formatTime = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('fr-FR', { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } catch {
      return "";
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR');
    } catch {
      return "";
    }
  };

  // Obtenir le nom du client
  const getCustomerName = (chat) => {
    const customer = chat.participants?.find(p => p.role === 'customer' || p._id !== user._id);
    return customer?.name || customer?.email || "Client";
  };

  // Messages du chat actuel
  const currentMessages = messages.filter(msg => 
    msg.chat === currentChat?._id || msg.chatId === currentChat?._id
  );

  if (user?.role !== 'admin') {
    return (
      <div className="container py-4 text-center">
        <div className="alert alert-danger">
          Accès réservé aux administrateurs
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Conversations</h5>
            </div>
            <div className="card-body p-0">
              {chats.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  Aucune conversation
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {chats.map(chat => (
                    <button
                      key={chat._id}
                      className={`list-group-item list-group-item-action ${
                        currentChat?._id === chat._id ? 'active' : ''
                      }`}
                      onClick={() => selectChat(chat)}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{getCustomerName(chat)}</h6>
                        {chat.unreadCount > 0 && (
                          <span className={`badge ${
                            currentChat?._id === chat._id ? 'bg-light text-dark' : 'bg-danger'
                          }`}>
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="mb-1 small text-truncate">
                        {chat.lastMessage || "Aucun message"}
                      </p>
                      <small>
                        {chat.lastMessageAt ? formatDate(chat.lastMessageAt) : "Nouveau"}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {(error || localError) && (
            <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
              <strong>Erreur:</strong> {error || localError}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => {
                  clearError();
                  setLocalError(null);
                }}
              ></button>
            </div>
          )}

          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-header text-white d-flex align-items-center justify-content-between rounded-top-4 bg-primary">
              <div>
                <h5 className="mb-0">
                  {currentChat ? `Conversation avec ${getCustomerName(currentChat)}` : "Sélectionnez une conversation"}
                </h5>
              </div>
              {(loadingMessages || sending) && (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              )}
            </div>

            <div 
              className="card-body bg-light d-flex flex-column p-3" 
              style={{ 
                height: '60vh', 
                overflowY: 'auto'
              }}
            >
              {!currentChat ? (
                <div className="text-center text-muted my-auto">
                  <p>Sélectionnez une conversation pour commencer</p>
                </div>
              ) : loadingMessages ? (
                <div className="text-center text-muted my-auto">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                  <p className="mt-2">Chargement des messages...</p>
                </div>
              ) : currentMessages.length === 0 ? (
                <div className="text-center text-muted my-auto">
                  <p>Aucun message dans cette conversation</p>
                </div>
              ) : (
                currentMessages.map((msg) => {
                  const isMine = msg.sender?._id === user._id || msg.sender === user._id;
                  return (
                    <div 
                      key={msg._id} 
                      className={`d-flex mb-3 ${isMine ? "justify-content-end" : "justify-content-start"}`}
                    >
                      <div 
                        className={`p-3 rounded-3 shadow-sm ${
                          isMine ? "bg-primary text-white" : "bg-white border"
                        }`} 
                        style={{ maxWidth: '70%' }}
                      >
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {msg.content}
                        </div>
                        <small className={`d-block mt-2 ${isMine ? "text-white-50" : "text-muted"}`}>
                          {isMine ? "Vous" : getCustomerName(currentChat)} • {formatTime(msg.timestamp || msg.createdAt)}
                        </small>
                      </div>
                    </div>
                  );
                })
              )}
              
              {isTyping && currentChat && (
                <div className="d-flex justify-content-start mb-3">
                  <div className="bg-white border p-3 rounded-3">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <small className="text-muted">{getCustomerName(currentChat)} écrit...</small>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <form 
              onSubmit={handleSendMessage} 
              className="card-footer d-flex gap-2 align-items-center p-3 bg-light rounded-bottom-4"
            >
              <textarea
                className="form-control rounded-pill"
                placeholder={currentChat ? "Tapez votre réponse..." : "Sélectionnez une conversation..."}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={1}
                style={{ resize: 'none' }}
                disabled={!currentChat || sending}
              />
              <button 
                type="submit" 
                className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
                disabled={!newMessage.trim() || !currentChat || sending}
              >
                {sending ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Envoi...
                  </>
                ) : (
                  <>
                    Envoyer <i className="bi bi-send"></i>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          height: 20px;
        }
        .typing-indicator span {
          height: 8px;
          width: 8px;
          background-color: #6c757d;
          border-radius: 50%;
          display: inline-block;
          margin: 0 2px;
          animation: typing 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing {
          0%, 80%, 100% { 
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminChat;
