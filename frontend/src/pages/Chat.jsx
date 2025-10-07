import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../context/ChatContext";

const Chat = () => {
  const { 
    messages, 
    sendMessage, 
    loading,
    isTyping,
    startTyping,
    stopTyping
  } = useChat();
  
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const ADMIN_ID = "68e41aab6d537e13a959bc8e";

  // Typing handlers
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Start typing indicator
    if (!isTypingLocal) {
      setIsTypingLocal(true);
      startTyping(ADMIN_ID);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      stopTyping(ADMIN_ID);
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Stop typing
    setIsTypingLocal(false);
    stopTyping(ADMIN_ID);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      await sendMessage(ADMIN_ID, newMessage.trim());
      setNewMessage("");
    } catch (err) {
      setError("Message send failed");
      console.error(err);
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
    };
  }, []);

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="card shadow-lg border-0 rounded-4">
        {/* Header */}
        <div className="card-header text-white d-flex align-items-center justify-content-between rounded-top-4 bg-primary">
          <h5 className="mb-0 fw-bold">
            💬 Chat with Support
          </h5>
          {loading && (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="card-body bg-light d-flex flex-column overflow-auto p-3" style={{ height: '60vh' }}>
          {loading ? (
            <div className="text-center text-muted mt-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading messages...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted mt-3">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender._id !== ADMIN_ID;
              return (
                <div key={msg._id} className={`d-flex mb-3 ${isMine ? "justify-content-end" : "justify-content-start"}`}>
                  <div className={`p-3 rounded-3 shadow-sm ${isMine ? "bg-primary text-white" : "bg-white border"}`} style={{ maxWidth: '70%' }}>
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </div>
                    <small className={`d-block mt-2 ${isMine ? "text-white-50" : "text-muted"}`} style={{ textAlign: 'right' }}>
                      {isMine ? "You" : "Support"} • {formatTime(msg.timestamp || msg.createdAt)}
                      {msg.isOptimistic && " ⏳"}
                    </small>
                  </div>
                </div>
              );
            })
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
                <small className="text-muted">Support is typing...</small>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="card-footer d-flex gap-2 align-items-center p-3 bg-light rounded-bottom-4">
          <textarea
            className="form-control rounded-pill"
            placeholder="Type a message..."
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
          />
          <button 
            type="submit" 
            className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
            disabled={!newMessage.trim()}
          >
            Send <i className="bi bi-send"></i>
          </button>
        </form>
      </div>

      <style jsx>{`
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