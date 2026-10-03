import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

const Chat = () => {
  const { 
    messages, 
    sendMessage, 
    loading,
    isTyping,
    startTyping,
    stopTyping,
    activeChatUser,
    clearChatHistory,
    ADMIN_ID,
    initializeClientChat
  } = useChat();
  
  const { user } = useAuth();
  
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialiser le chat pour les clients au chargement
  useEffect(() => {
    if (user?.role !== 'admin' && !activeChatUser) {
      initializeClientChat();
    }
  }, [user, activeChatUser, initializeClientChat]);

  // Déterminer le destinataire
  const getReceiverId = () => {
    if (user?.role === 'admin') {
      return activeChatUser?._id;
    } else {
      return ADMIN_ID; // Les clients envoient toujours à l'admin
    }
  };

  // Typing handlers
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    const receiverId = getReceiverId();
    if (!receiverId) return;
    
    // Start typing indicator
    if (!isTypingLocal) {
      setIsTypingLocal(true);
      startTyping(receiverId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      stopTyping(receiverId);
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const receiverId = getReceiverId();
    if (!newMessage.trim() || loading || !receiverId) {
      setError("Impossible d'envoyer le message");
      return;
    }

    // Stop typing
    setIsTypingLocal(false);
    stopTyping(receiverId);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const messageToSend = newMessage.trim();
    setNewMessage("");
    setError(null);

    try {
      await sendMessage(receiverId, messageToSend);
      console.log('Message envoyé avec succès');
    } catch (err) {
      setError("Échec de l'envoi du message");
      console.error("Send message error:", err);
      setNewMessage(messageToSend);
    }
  };

  // Auto-scroll Effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth", 
      block: "end" 
    });
  }, [messages, isTyping]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      const receiverId = getReceiverId();
      if (receiverId) {
        stopTyping(receiverId);
      }
    };
  }, [stopTyping]);

  const formatTime = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('fr-FR', { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } catch (err) {
      return "";
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (err) {
      return "";
    }
  };

  // Grouper les messages par date
  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  const isAdmin = user?.role === 'admin';
  
  const getChatTitle = () => {
    if (isAdmin) {
      return activeChatUser ? `💬 Conversation avec ${activeChatUser.name}` : '💬 Sélectionnez une conversation';
    } else {
      return '💬 Chat avec le Support';
    }
  };

  const canSendMessages = () => {
    if (isAdmin) {
      return activeChatUser !== null;
    } else {
      return true; // Les clients peuvent toujours envoyer à l'admin
    }
  };

  const handleClearHistory = () => {
    const partnerId = isAdmin ? activeChatUser?._id : ADMIN_ID;
    if (partnerId && window.confirm("Voulez-vous vraiment effacer l'historique de cette conversation ?")) {
      clearChatHistory(partnerId);
    }
  };

  const isSendDisabled = !canSendMessages() || !newMessage.trim() || loading;

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="card shadow-lg border-0 rounded-4">
        {/* Header */}
        <div className="card-header text-white d-flex align-items-center justify-content-between rounded-top-4 bg-primary">
          <h5 className="mb-0 fw-bold">
            {getChatTitle()}
          </h5>
          <div className="d-flex align-items-center gap-2">
            {loading && (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            )}
            {canSendMessages() && messages.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={handleClearHistory}
                title="Effacer l'historique"
              >
                <i className="bi bi-trash"></i>
              </button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="card-body bg-light d-flex flex-column overflow-auto p-3" style={{ height: '60vh' }}>
          {!canSendMessages() ? (
            <div className="text-center text-muted mt-3">
              <i className="bi bi-chat-dots display-4 d-block mb-2"></i>
              <p>Sélectionnez une conversation pour commencer à chatter</p>
            </div>
          ) : loading && messages.length === 0 ? (
            <div className="text-center text-muted mt-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement des messages...</span>
              </div>
              <p className="mt-2">Chargement des messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted mt-3">
              <i className="bi bi-chat-dots display-4 d-block mb-2"></i>
              <p>Aucun message pour le moment. Démarrez la conversation !</p>
              <small className="text-muted">
                Votre historique de chat sera sauvegardé automatiquement
              </small>
            </div>
          ) : (
            Object.entries(messageGroups).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="text-center my-3">
                  <span className="badge bg-secondary bg-opacity-25 text-dark">
                    {date}
                  </span>
                </div>
                
                {/* Messages for this date */}
                {dateMessages.map((msg) => {
                  const isMine = msg.sender._id === user._id;
                  return (
                    <div key={msg._id} className={`d-flex mb-3 ${isMine ? "justify-content-end" : "justify-content-start"}`}>
                      <div 
                        className={`p-3 rounded-3 shadow-sm position-relative ${
                          isMine 
                            ? "bg-primary text-white" 
                            : "bg-white border"
                        } ${msg.hasError ? 'border-danger' : ''}`} 
                        style={{ maxWidth: '70%' }}
                      >
                        {msg.hasError && (
                          <i 
                            className="bi bi-exclamation-triangle-fill text-danger position-absolute"
                            style={{ top: '5px', right: '5px' }}
                            title="Erreur d'envoi"
                          ></i>
                        )}
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {msg.content}
                        </div>
                        <small className={`d-block mt-2 ${isMine ? "text-white-50" : "text-muted"}`}>
                          {isMine ? "Vous" : (isAdmin ? activeChatUser?.name : "Support")} • {formatTime(msg.timestamp)}
                          {msg.isOptimistic && (
                            <i className="bi bi-clock ms-1" title="En cours d'envoi"></i>
                          )}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="d-flex justify-content-start mb-3">
              <div className="bg-white border p-3 rounded-3">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <small className="text-muted">
                  {isAdmin ? activeChatUser?.name : 'Le support'} est en train d'écrire...
                </small>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="card-footer d-flex gap-2 align-items-center p-3 bg-light rounded-bottom-4">
          <textarea
            className="form-control rounded-pill"
            placeholder={canSendMessages() ? "Tapez votre message..." : "Sélectionnez une conversation..."}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && canSendMessages()) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            rows={1}
            style={{ resize: 'none' }}
            disabled={!canSendMessages()}
          />
          <button 
            type="submit" 
            className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
            disabled={isSendDisabled}
          >
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Envoi...</span>
                </div>
                Envoi
              </>
            ) : (
              <>
                Envoyer <i className="bi bi-send"></i>
              </>
            )}
          </button>
        </form>
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

export default Chat;
