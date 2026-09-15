import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MoreVertical, Flag } from 'lucide-react';
import { api } from '../api';
import { goBack } from '../components/UI';

const QUICK_EMOJIS = ['❤️', '😍', '😂', '🔥', '👋', '😊', '🌹', '✨', '💯', '🙏'];

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

  useEffect(() => {
    if (!user?.telegramId || !matchId) return undefined;
    let cancelled = false;
    api.matches(user.telegramId)
      .then(data => {
        if (cancelled) return;
        const match = (Array.isArray(data) ? data : []).find(m => String(m.matchId) === String(matchId));
        if (match?.user) setMatchInfo(match.user);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [matchId, user?.telegramId]);

  const fetchMessages = useCallback(async () => {
    if (!user?.telegramId || !matchId) return;
    try {
      const data = await api.messages(matchId, user.telegramId);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      // Keep the current conversation visible during transient failures.
    }
  }, [matchId, user?.telegramId]);

  useEffect(() => {
    let active = true;

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const startPolling = () => {
      stopPolling();
      if (!active || document.hidden) return;
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 5000);
    };

    startPolling();
    const handleVisibility = () => {
      if (document.hidden) stopPolling();
      else startPolling();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: document.activeElement === inputRef.current ? 'auto' : 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    const val = e.target.value.slice(0, 2000);
    setInput(val);
    localStorage.setItem(draftKey, val);
  };

  const handleSend = async (text = input) => {
    const msg = typeof text === 'string' ? text.trim() : '';
    if (!msg || sending || !user?.telegramId || !matchId) return;
    setInput('');
    localStorage.removeItem(draftKey);
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, text: msg, isMine: true, createdAt: new Date().toISOString(), temp: true }]);
    try {
      await api.sendMessage(matchId, user.telegramId, msg);
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
      await api.report(user.telegramId, matchInfo.id, reportReason);
      setShowReport(false);
      setShowMenu(false);
      setReportReason('');
    } catch {
      // Keep the modal open so the user can retry.
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  };

  if (!matchId || !/^\d+$/.test(String(matchId))) {
    return <div className="chat-page"><div className="chat-empty"><p>گفتگوی موردنظر پیدا نشد.</p><button type="button" className="primary-btn" onClick={() => navigate('/matches')}>بازگشت به مچ‌ها</button></div></div>;
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button type="button" className="back-btn" onClick={() => goBack(navigate, '/matches')} aria-label="بازگشت"><ArrowLeft size={22} /></button>
        <div className="chat-user-info">
          <div className="chat-avatar-wrap">
            {matchInfo?.photoUrl ? <img src={matchInfo.photoUrl} alt={matchInfo.firstName || ''} className="chat-avatar" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <div className="chat-avatar chat-avatar-placeholder">👤</div>}
            {matchInfo?.isOnline && <span className="chat-online-dot" />}
          </div>
          <div><h3 className="chat-name">{matchInfo?.firstName || 'مخاطب'}</h3><span className="chat-status">گفتگو</span></div>
        </div>
        <button type="button" className="chat-menu-btn" onClick={() => setShowMenu(v => !v)} aria-label="منو"><MoreVertical size={20} /></button>
        {showMenu && <div className="chat-dropdown"><button type="button" className="chat-dropdown-item" onClick={() => { setShowReport(true); setShowMenu(false); }}><Flag size={15} /> گزارش کاربر</button></div>}
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

      <div className="emoji-bar">{QUICK_EMOJIS.map(emoji => <button type="button" key={emoji} className="emoji-btn" onClick={() => handleSend(emoji)} disabled={sending}>{emoji}</button>)}</div>
      <form className="chat-input-container" onSubmit={e => { e.preventDefault(); handleSend(); }}>
        <input ref={inputRef} type="text" className="chat-input" placeholder="پیامت رو بنویس..." value={input} onChange={handleInputChange} disabled={sending} maxLength={2000} />
        <button type="submit" className="send-btn" disabled={!input.trim() || sending} aria-label="ارسال"><Send size={20} /></button>
      </form>

      {showReport && (
        <div className="pf-modal-overlay" onClick={() => setShowReport(false)}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🚩</div><h3>گزارش کاربر</h3><p>چرا می‌خواهی این کاربر را گزارش دهی؟</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, textAlign: 'right' }}>
              {['رفتار نامناسب', 'اکانت جعلی', 'اسپم', 'محتوای مضر'].map(r => <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}><input type="radio" name="reason" value={r} checked={reportReason === r} onChange={e => setReportReason(e.target.value)} />{r}</label>)}
            </div>
            <div className="pf-modal-btns"><button type="button" className="pf-modal-cancel" onClick={() => setShowReport(false)}>لغو</button><button type="button" className="pf-modal-confirm" onClick={handleReport} disabled={!reportReason || !matchInfo?.id}>ارسال گزارش</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
