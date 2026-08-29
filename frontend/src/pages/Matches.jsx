import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../telegram';
import { Heart, MessageCircle } from 'lucide-react';

const Matches = ({ user }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user?.telegramId) return;
      try {
        const res = await axios.get(`${API_URL}/matches/${user.telegramId}`);
        setMatches(res.data || []);
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user]);

  // New matches = matched but no messages yet
  const newMatches = matches.filter(m => !m.lastMessage);
  const conversations = matches.filter(m => !!m.lastMessage);

  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = (now - d) / 1000; // seconds
      if (diff < 60)  return 'همین الان';
      if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
      return `${Math.floor(diff / 86400)} روز پیش`;
    } catch { return ''; }
  };

  if (loading) {
    return (
      <div className="matches-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Heart size={40} color="var(--primary-color)" style={{ animation: 'pulse 1s infinite alternate' }} />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="matches-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
        <div style={{ fontSize: 60 }}>💞</div>
        <h3 style={{ color: 'var(--text-primary)' }}>هنوز مچی نداری</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '0 40px' }}>
          به بخش Discover برو و پروفایل‌ها را بررسی کن!
        </p>
        <button
          style={{ marginTop: 12, padding: '12px 28px', borderRadius: 24, background: 'var(--gradient-primary)', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          شروع سوایپ ❤️
        </button>
      </div>
    );
  }

  return (
    <div className="matches-page">

      {/* New Matches */}
      {newMatches.length > 0 && (
        <div className="new-matches-section">
          <h3 className="section-title">مچ‌های جدید 🎉</h3>
          <div className="horizontal-scroll">
            {newMatches.map(match => {
              const other = match.user;
              return (
                <div
                  key={match.matchId}
                  className="match-avatar-wrapper"
                  onClick={() => navigate(`/chat/${match.matchId}`)}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={other.photoUrl}
                      alt={other.firstName}
                      className="match-avatar"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop'; }}
                    />
                    {other.isOnline && (
                      <span style={{ position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: '50%', background: '#34C759', border: '2px solid var(--bg-color)' }} />
                    )}
                  </div>
                  <span className="match-name">{other.firstName || 'کاربر'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversations */}
      <div className="messages-section">
        <h3 className="section-title">پیام‌ها 💬</h3>

        {conversations.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '8px 0' }}>
            اولین پیام رو بفرست! 👋
          </p>
        ) : (
          conversations.map(match => {
            const other = match.user;
            const last = match.lastMessage;
            return (
              <div
                key={match.matchId}
                className="message-item"
                onClick={() => navigate(`/chat/${match.matchId}`)}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={other.photoUrl}
                    alt={other.firstName}
                    className="message-avatar"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop'; }}
                  />
                  {other.isOnline && (
                    <span style={{ position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: '50%', background: '#34C759', border: '2px solid var(--bg-color)' }} />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <h4>{other.firstName || 'کاربر'}</h4>
                    <span className="message-time">{formatTime(last?.createdAt)}</span>
                  </div>
                  <p className="message-preview">
                    {last?.isMine && <span style={{ color: 'var(--text-secondary)' }}>شما: </span>}
                    {last?.text || 'سلام! 👋'}
                  </p>
                </div>
                <MessageCircle size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Matches;
