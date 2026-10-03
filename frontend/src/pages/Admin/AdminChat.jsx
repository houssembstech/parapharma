import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminMobileHeader from "../../components/Layout/AdminMobileHeader";
import { FiSearch, FiSend, FiUser, FiClock, FiMessageCircle } from 'react-icons/fi';

const AdminChat = () => {
  const {
    chats,
    messages,
    activeChatUser,
    loadingChats,
    loadingMessages,
    selectChat,
    sendMessage,
    isTyping,
    unreadCount,
    startTyping,
    stopTyping
  } = useChat();

  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-select the first chat when chats load
  useEffect(() => {
    if (chats && chats.length > 0 && !activeChatUser) {
      selectChat(chats[0].partner);
    }
  }, [chats, activeChatUser, selectChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping]);

  // Typing handlers
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (activeChatUser) {
      // Start typing indicator
      if (!isTypingLocal) {
        setIsTypingLocal(true);
        startTyping(activeChatUser._id);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTypingLocal(false);
        stopTyping(activeChatUser._id);
      }, 1000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatUser) return;
    
    // Stop typing
    setIsTypingLocal(false);
    stopTyping(activeChatUser._id);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await sendMessage(activeChatUser._id, newMessage.trim());
    setNewMessage("");
  };

  // Send on Enter, newline with Shift+Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const userInitials = (name = "") =>
    name
      .split(" ")
      .map((s) => s[0]?.toUpperCase() || "")
      .slice(0, 2)
      .join("");

  const filteredChats = chats?.filter((c) =>
    c.partner?.name?.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="container-fluid py-4" style={{ background: "#f8fdf9", minHeight: "100vh" }}>
      <div className="row">
        {/* Sidebar */}
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          unreadCount={unreadCount}
        />

        {/* Main Content */}
        <div className={`${sidebarCollapsed ? 'col-lg-11' : 'col-lg-10'} col-md-9`}>
          {/* Mobile Header */}
          <AdminMobileHeader 
            title="Messages Clients" 
            onMenuClick={() => setSidebarOpen(true)}
            unreadCount={unreadCount}
          />

          {/* Header */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body py-3">
              <div className="row align-items-center">
                <div className="col-md-6 mb-3 mb-md-0">
                  <h2 className="h5 mb-1 fw-bold text-success">
                    <FiMessageCircle className="me-2" />
                    Centre de Messages
                    {unreadCount > 0 && (
                      <span className="badge bg-danger ms-2">{unreadCount}</span>
                    )}
                  </h2>
                  <p className="text-muted small mb-0">
                    Communiquez avec vos clients en temps réel
                  </p>
                </div>
                
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-md-end">
                    <div className="bg-light rounded-pill px-3 py-2 text-muted small d-flex align-items-center">
                      <FiClock className="me-2" />
                      {new Date().toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Container */}
          <div className="card shadow-sm border-0 rounded-4" style={{ height: '70vh' }}>
            <div className="card-body p-0 d-flex">
              {/* Users / Chat list */}
              <div className="border-end" style={{ width: '320px', minWidth: '260px' }}>
                <div className="p-3 border-bottom">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 fw-bold text-success">Conversations</h6>
                    <span className="badge bg-success rounded-pill">
                      {chats?.length ?? 0}
                    </span>
                  </div>
                  
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light border-end-0">
                      <FiSearch size={14} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="users-list" style={{ height: 'calc(70vh - 120px)', overflowY: 'auto' }}>
                  {loadingChats ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                    </div>
                  ) : !filteredChats || filteredChats.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <FiUser size={32} className="mb-2" />
                      <p>Aucune conversation</p>
                    </div>
                  ) : (
                    filteredChats.map((chat) => {
                      const partner = chat.partner || {};
                      const active = activeChatUser?._id === partner._id;
                      const lastMsg = chat.lastMessage || "Aucun message";
                      const unread = chat.unreadCount || 0;

                      return (
                        <div
                          key={chat.chatId || partner._id}
                          className={`d-flex align-items-center p-3 cursor-pointer ${
                            active ? 'bg-light border-start border-3 border-success' : 'hover-bg-light'
                          }`}
                          onClick={() => selectChat(partner)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="position-relative">
                            <div className="bg-success rounded-circle d-flex align-items-center justify-content-center text-white"
                                 style={{ width: '45px', height: '45px' }}>
                              {userInitials(partner.name)}
                            </div>
                            {unread > 0 && (
                              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                {unread}
                              </span>
                            )}
                          </div>
                          
                          <div className="ms-3 flex-grow-1">
                            <h6 className="mb-1 fw-semibold">{partner.name || "Unknown"}</h6>
                            <p className="mb-0 text-muted small text-truncate" style={{ maxWidth: '180px' }}>
                              {lastMsg}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Messages & Input */}
              <div className="flex-grow-1 d-flex flex-column">
                {activeChatUser ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3 border-bottom bg-light">
                      <div className="d-flex align-items-center">
                        <div className="bg-success rounded-circle d-flex align-items-center justify-content-center text-white me-3"
                             style={{ width: '40px', height: '40px' }}>
                          {userInitials(activeChatUser.name)}
                        </div>
                        <div>
                          <h6 className="mb-0 fw-semibold">{activeChatUser.name}</h6>
                          <small className="text-muted">{activeChatUser.email}</small>
                        </div>
                        {isTyping && (
                          <div className="ms-auto">
                            <div className="typing-indicator small">
                              <span></span>
                              <span></span>
                              <span></span>
                              <small className="text-muted ms-2">En train d'écrire...</small>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-grow-1 p-3" style={{ overflowY: 'auto', height: 'calc(70vh - 180px)' }}>
                      {loadingMessages ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-success" role="status">
                            <span className="visually-hidden">Chargement...</span>
                          </div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <p>Aucun message échangé</p>
                          <small>Soyez le premier à envoyer un message</small>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isFromPartner = msg.sender?._id === activeChatUser?._id;
                          const isMine = !isFromPartner;
                          
                          return (
                            <div key={msg._id} className={`d-flex mb-3 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                              <div className={`rounded-3 px-3 py-2 ${isMine ? 'bg-success text-white' : 'bg-light'}`}
                                   style={{ maxWidth: '70%' }}>
                                <div className="mb-1">{msg.content}</div>
                                <div className="small opacity-75 d-flex justify-content-between align-items-center">
                                  <span>{isFromPartner ? msg.sender?.name : "Vous"}</span>
                                  <span className="ms-2">{formatTime(msg.timestamp || msg.createdAt)}</span>
                                  {msg.isOptimistic && <span className="ms-2">⏳</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-3 border-top">
                      <form onSubmit={handleSendMessage} className="d-flex gap-2">
                        <textarea
                          className="form-control"
                          placeholder="Tapez votre message..."
                          rows="1"
                          value={newMessage}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          style={{ resize: 'none' }}
                        />
                        <button
                          type="submit"
                          className="btn btn-success d-flex align-items-center"
                          disabled={!newMessage.trim()}
                        >
                          <FiSend size={18} />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <FiUser size={48} className="mb-3" />
                      <h5>Sélectionnez une conversation</h5>
                      <p>Choisissez un client pour commencer à discuter</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <style>{`
        .typing-indicator {
          display: flex;
          align-items: center;
        }
        .typing-indicator span {
          height: 6px;
          width: 6px;
          background-color: #6c757d;
          border-radius: 50%;
          display: inline-block;
          margin: 0 1px;
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
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </div>
  );
};

export default AdminChat;
