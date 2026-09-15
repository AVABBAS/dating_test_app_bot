import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../telegram';
import { ArrowRight, Send, MoreVertical, Flag } from 'lucide-react';

const QUICK_EMOJIS = ['❤️', '😍', '😂', '🔥', '👋', '😊', '🌹', '✨', '💯', '🙏'];

const TypingDots = () => <div className="typing-indicator"><span /><span /><span /></div>;

const Chat = ({ user }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const draftKey = `chat_draft_${matchId}`;
  const [input, setInput] = useState(() => localStorage.getItem(draftKey) || '');
  const [matchInfo, setMatchInfo] = useState(null);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  const parsedMatchId = Number.parseInt(matchId, 10);
  const validMatchId = Number.isInteger(parsedMatchId) && parsedMatchId > 0;

  useEffect(() => {
    let cancelled = false;
    const fetchInfo = async () => {
      if (!user?.telegramId || !validMatchId) return;
      try {
        const res = await axios.get(`${API_URL}/matches/${user.telegramId}`);
        const matches = Array.isArray(res.data) ? res.data : [];
        const match = matches.find(item => Number(item.matchId) === parsedMatchId);
        if (!cancelled) setMatchInfo(match?.user || null);
      } catch {
        if (!cancelled) setMatchInfo(null);
      }
    };
    fetchInfo();
    return () => { cancelled = true; };
  }, [parsedMatchId, user?.telegramId, validMatchId]);

  const fetchMessages = useCallback(async () => {
    if (!user?.telegramId || !validMatchId) return;
    try {
      const res = await axios.get(`${API_URL}/messages/${parsedMatchId}`, { params: { telegramId: user.telegramId } });
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Keep the current conversation visible on transient polling failures.
    }
  }, [parsedMatchId, user?.telegramId, validMatchId]);

  useEffect(() => {
    if (!validMatchId) return undefined;
    fetchMessages();
    pollRef.current = window.setInterval(fetchMessages, 5000);
    return () => window.clearInterval(pollRef.current);
  }, [fetchMessages, validMatchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    if (value) localStorage.setItem(draftKey, value);
    else localStorage.removeItem(draftKey);
  };

  const handleSend = async (text = input) => {
    const msg = typeof text === 'string' ? text.trim() : '';
    if (!msg || sending || !user?.telegramId || !validMatchId) return;

    setInput('');
    localStorage.removeItem(draftKey);
    setSending(true);
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tempMsg = { id: tempId, text: msg, isMine: true, createdAt: new Date().toISOString(), temp: true };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await axios.post(`${API_URL}/messages`, { fromTelegramId: user.telegramId, matchId: parsedMatchId, text: msg });
      await fetchMessages();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(msg);
      localStorage.setItem(draftKey, msg);
    } finally {
      setSending(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !matchInfo?.id || !user?.telegramId) return;
    try {
      await axios.post(`${API_URL}/report`, { fromTelegramId: user.telegramId, toUserId: matchInfo.id, reason: reportReason });
      setShowReport(false);
      setShowMenu(false);
      setReportReason('');
    } catch {
      // Keep modal open so the user can retry.
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!validMatchId) {
    return (
      <div className="chat-page chat-invalid-state">
        <h3>گفتگو پیدا نشد</h3>
        <button type="button" className="primary-btn" onClick={() => navigate('/matches')}>بازگشت به مچ‌ها</button>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="بازگشت"><ArrowRight size={22} /></button>
        <div className="chat-user-info">
          <div className="chat-avatar-wrap">
            {matchInfo?.photoUrl ? <img src={matchInfo.photoUrl} alt={matchInfo.firstName || 'کاربر'} className="chat-avatar" /> : <div className="chat-avatar chat-avatar-placeholder">👤</div>}
            {matchInfo?.isOnline && <span className="chat-online-dot" />}
          </div>
          <div>
            <h3 className="chat-name">{matchInfo?.firstName || 'گفتگو'}</h3>
            <span className="chat-status">{matchInfo?.isOnline ? <span style={{ color: '#34C759' }}>آنلاین</span> : <span style={{ color: 'var(--text-secondary)' }}>آفلاین</span>}</span>
          </div>
        </div>
        <button type="button" className="chat-menu-btn" onClick={() => setShowMenu(v => !v)} aria-label="منو"><MoreVertical size={20} /></button>
        {showMenu && (
          <div className="chat-dropdown">
            <button type="button" className="chat-dropdown-item" onClick={() => { setShowReport(true); setShowMenu(false); }}><Flag size={15} /> گزارش کاربر</button>
          </div>
        )}
      </div>

      <div className="chat-messages" onClick={() => setShowMenu(false)}>
        {messages.length === 0 && <div className="chat-empty"><div style={{ fontSize: 44 }}>👋</div><p>سلام بده! اولین پیام رو بفرست</p></div>}
        {messages.map(msg => (
          <div key={msg.id} className={`msg-row ${msg.isMine ? 'msg-row-me' : 'msg-row-them'}`}>
            <div className={`message-bubble ${msg.isMine ? 'message-sent' : 'message-received'} ${msg.temp ? 'msg-temp' : ''}`}>
              {msg.text}
              <div className="msg-meta"><span className="msg-time">{formatTime(msg.createdAt)}</span>{msg.isMine && <span className="msg-tick">{msg.temp ? '✓' : '✓✓'}</span>}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="emoji-bar">
        {QUICK_EMOJIS.map(emoji => <button type="button" key={emoji} className="emoji-btn" onClick={() => handleSend(emoji)} disabled={sending}>{emoji}</button>)}
      </div>

      <form className="chat-input-container" onSubmit={e => { e.preventDefault(); handleSend(); }}>
        <input ref={inputRef} type="text" className="chat-input" placeholder="پیامت رو بنویس..." value={input} onChange={handleInputChange} disabled={sending} maxLength={2000} />
        <button type="submit" className="send-btn" disabled={!input.trim() || sending}><Send size={20} /></button>
      </form>

      {showReport && (
        <div className="pf-modal-overlay" onClick={() => setShowReport(false)}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🚩</div>
            <h3>گزارش کاربر</h3>
            <p>چرا می‌خواهی این کاربر را گزارش دهی؟</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, textAlign: 'right' }}>
              {['رفتار نامناسب', 'اکانت جعلی', 'اسپم', 'محتوای مضر'].map(reason => (
                <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>
                  <input type="radio" name="reason" value={reason} checked={reportReason === reason} onChange={e => setReportReason(e.target.value)} />
                  {reason}
                </label>
              ))}
            </div>
            <div className="pf-modal-btns">
              <button type="button" className="pf-modal-cancel" onClick={() => setShowReport(false)}>لغو</button>
              <button type="button" className="pf-modal-confirm" onClick={handleReport} disabled={!reportReason}>ارسال گزارش</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
