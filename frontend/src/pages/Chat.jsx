import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../telegram';
import { ArrowLeft, Send, MoreVertical, Flag } from 'lucide-react';

const QUICK_EMOJIS = ['❤️', '😍', '😂', '🔥', '👋', '😊', '🌹', '✨', '💯', '🙏'];

const TypingDots = () => (
  <div className="typing-indicator">
    <span /><span /><span />
  </div>
);

const Chat = ({ user }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [matchInfo, setMatchInfo] = useState(null);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const typingRef = useRef(null);
  const typingPollRef = useRef(null);
  const inputRef = useRef(null);

  // ── Fetch match info ───────────────────────────────────
  useEffect(() => {
    const fetchInfo = async () => {
      if (!user?.telegramId || !matchId) return;
      try {
        const res = await axios.get(`${API_URL}/chat-info/${matchId}`, {
          params: { telegramId: user.telegramId }
        });
        setMatchInfo(res.data.otherUser);
      } catch {
        setMatchInfo({ firstName: 'مخاطب', photoUrl: '' });
      }
    };
    fetchInfo();
  }, [matchId, user]);

  // ── Fetch messages (polling) ───────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!user?.telegramId || !matchId) return;
    try {
      const res = await axios.get(`${API_URL}/messages/${matchId}`, {
        params: { telegramId: user.telegramId }
      });
      setMessages(res.data || []);
    } catch { /* silent */ }
  }, [matchId, user]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 4000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // ── Poll typing status ─────────────────────────────────
  useEffect(() => {
    const pollTyping = async () => {
      if (!user?.telegramId || !matchId) return;
      try {
        const res = await axios.get(`${API_URL}/typing/${matchId}`, {
          params: { telegramId: user.telegramId }
        });
        setOtherTyping(res.data.isTyping);
      } catch { /* silent */ }
    };
    typingPollRef.current = setInterval(pollTyping, 2000);
    return () => clearInterval(typingPollRef.current);
  }, [matchId, user]);

  // ── Auto scroll ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  // ── Send typing event ──────────────────────────────────
  const sendTyping = useCallback(() => {
    if (!user?.telegramId || !matchId) return;
    axios.post(`${API_URL}/typing/${matchId}`, { telegramId: user.telegramId }).catch(() => {});
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {}, 3000);
  }, [matchId, user]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTyping();
  };

  // ── Send message ───────────────────────────────────────
  const handleSend = async (text = input) => {
    const msg = typeof text === 'string' ? text : input;
    if (!msg.trim() || sending) return;
    setInput('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg = { id: tempId, text: msg.trim(), isMine: true, createdAt: new Date().toISOString(), temp: true };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await axios.post(`${API_URL}/messages`, {
        fromTelegramId: user?.telegramId,
        matchId,
        text: msg.trim(),
      });
      fetchMessages();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(msg);
    } finally {
      setSending(false);
    }
  };

  const handleEmojiClick = (emoji) => {
    handleSend(emoji);
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await axios.post(`${API_URL}/report`, {
        fromTelegramId: user?.telegramId,
        toUserId: matchInfo?.id,
        reason: reportReason,
      });
      setShowReport(false);
      setShowMenu(false);
      setReportReason('');
      // Show quick toast
      const el = document.createElement('div');
      el.textContent = 'گزارش ارسال شد ✓';
      el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#34C759;color:white;padding:10px 20px;border-radius:30px;font-size:14px;font-weight:600;z-index:9999';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    } catch { /* silent */ }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className="chat-page">
      {/* ── Header ── */}
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <div className="chat-user-info">
          <div className="chat-avatar-wrap">
            {matchInfo?.photoUrl ? (
              <img src={matchInfo.photoUrl} alt={matchInfo.firstName} className="chat-avatar"
                onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <div className="chat-avatar chat-avatar-placeholder">👤</div>
            )}
            {matchInfo?.isOnline && <span className="chat-online-dot" />}
          </div>
          <div>
            <h3 className="chat-name">{matchInfo?.firstName || '...'}</h3>
            <span className="chat-status">
              {otherTyping ? (
                <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>در حال تایپ...</span>
              ) : matchInfo?.isOnline ? (
                <span style={{ color: '#34C759' }}>آنلاین</span>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>آفلاین</span>
              )}
            </span>
          </div>
        </div>
        <button className="chat-menu-btn" onClick={() => setShowMenu(v => !v)}>
          <MoreVertical size={20} />
        </button>
        {/* Dropdown menu */}
        {showMenu && (
          <div className="chat-dropdown">
            <div className="chat-dropdown-item" onClick={() => { setShowReport(true); setShowMenu(false); }}>
              <Flag size={15} /> گزارش کاربر
            </div>
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="chat-messages" onClick={() => setShowMenu(false)}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <div style={{ fontSize: 44 }}>👋</div>
            <p>سلام بده! اولین پیام رو بفرست</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`msg-row ${msg.isMine ? 'msg-row-me' : 'msg-row-them'}`}>
            <div className={`message-bubble ${msg.isMine ? 'message-sent' : 'message-received'} ${msg.temp ? 'msg-temp' : ''}`}>
              {msg.text}
              <div className="msg-meta">
                <span className="msg-time">{formatTime(msg.createdAt)}</span>
                {msg.isMine && !msg.temp && (
                  <span className="msg-tick">✓✓</span>
                )}
                {msg.isMine && msg.temp && (
                  <span className="msg-tick msg-tick-sending">✓</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {otherTyping && (
          <div className="msg-row msg-row-them">
            <div className="message-bubble message-received">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Emoji Bar ── */}
      <div className="emoji-bar">
        {QUICK_EMOJIS.map(e => (
          <button key={e} className="emoji-btn" onClick={() => handleEmojiClick(e)}>{e}</button>
        ))}
      </div>

      {/* ── Input Bar ── */}
      <form className="chat-input-container" onSubmit={e => { e.preventDefault(); handleSend(); }}>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="پیامت رو بنویس..."
          value={input}
          onChange={handleInputChange}
          disabled={sending}
        />
        <button type="submit" className="send-btn" disabled={!input.trim() || sending}>
          <Send size={20} />
        </button>
      </form>

      {/* ── Report modal ── */}
      {showReport && (
        <div className="pf-modal-overlay" onClick={() => setShowReport(false)}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🚩</div>
            <h3>گزارش کاربر</h3>
            <p>چرا می‌خواهی این کاربر را گزارش دهی؟</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, textAlign: 'right' }}>
              {['رفتار نامناسب', 'اکانت جعلی', 'اسپم', 'محتوای مضر'].map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>
                  <input type="radio" name="reason" value={r} onChange={e => setReportReason(e.target.value)}
                    style={{ accentColor: 'var(--primary-color)' }} />
                  {r}
                </label>
              ))}
            </div>
            <div className="pf-modal-btns">
              <button className="pf-modal-cancel" onClick={() => setShowReport(false)}>لغو</button>
              <button className="pf-modal-confirm" onClick={handleReport} disabled={!reportReason}>ارسال گزارش</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
