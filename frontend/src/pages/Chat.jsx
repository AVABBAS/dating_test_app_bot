import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../telegram';
import { ArrowLeft, Send } from 'lucide-react';

const Chat = ({ user }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [matchInfo, setMatchInfo] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // ── Fetch match info ────────────────────────────────────
  useEffect(() => {
    const fetchInfo = async () => {
      if (!user?.telegramId || !matchId) return;
      try {
        const res = await axios.get(`${API_URL}/chat-info/${matchId}`, {
          params: { telegramId: user.telegramId }
        });
        setMatchInfo(res.data.otherUser);
      } catch {
        setMatchInfo({ firstName: 'مچ', photoUrl: '' });
      }
    };
    fetchInfo();
  }, [matchId, user]);

  // ── Fetch messages (with polling) ───────────────────────
  const fetchMessages = async () => {
    if (!user?.telegramId || !matchId) return;
    try {
      const res = await axios.get(`${API_URL}/messages/${matchId}`, {
        params: { telegramId: user.telegramId }
      });
      setMessages(res.data || []);
    } catch {
      // keep existing messages on error
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll every 4 seconds for new messages
    pollRef.current = setInterval(fetchMessages, 4000);
    return () => clearInterval(pollRef.current);
  }, [matchId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic UI
    const tempMsg = {
      id: `temp-${Date.now()}`,
      text,
      isMine: true,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await axios.post(`${API_URL}/messages`, {
        fromTelegramId: user?.telegramId,
        matchId,
        text,
      });
      // Refetch to get real message with ID
      fetchMessages();
    } catch {
      // Remove temp message on failure
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInput(text); // restore input
    } finally {
      setSending(false);
    }
  };

  // ── Format time ─────────────────────────────────────────
  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="chat-user-info">
          {matchInfo?.photoUrl ? (
            <img
              src={matchInfo.photoUrl}
              alt={matchInfo.firstName}
              className="chat-avatar"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop'; }}
            />
          ) : (
            <div className="chat-avatar" style={{ background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              👤
            </div>
          )}
          <div>
            <h3 style={{ fontSize: '17px', margin: 0 }}>{matchInfo?.firstName || '...'}</h3>
            {matchInfo?.isOnline && (
              <span style={{ fontSize: 11, color: '#34C759' }}>● آنلاین</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
            <p>اولین نفری باش که سلام می‌دی!</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-bubble ${msg.isMine ? 'message-sent' : 'message-received'}`}
          >
            {msg.text}
            <span className="msg-time">{formatTime(msg.createdAt)}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-input-container" onSubmit={handleSend}>
        <input
          type="text"
          className="chat-input"
          placeholder="پیامت رو بنویس..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="send-btn" disabled={!input.trim() || sending}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
