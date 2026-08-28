import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../telegram';

const Matches = ({ user }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;
      try {
        // Fallback dummy data
        const dummy = [
          { matchId: 'm1', id: '1', name: 'Sarah', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop', lastMessage: 'Hey! How are you?', time: '2m ago', isNew: true },
          { matchId: 'm2', id: '2', name: 'Jessica', photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&auto=format&fit=crop', lastMessage: 'Loved your profile!', time: '1h ago', isNew: false },
        ];
        
        try {
          const res = await axios.get(`${API_URL}/matches/${user.telegramId}`);
          setMatches(res.data.length > 0 ? res.data : dummy);
        } catch {
          setMatches(dummy);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [user]);

  const newMatches = matches.filter(m => m.isNew);
  const conversations = matches.filter(m => !m.isNew || m.lastMessage);

  if (loading) return <div className="loading-screen">Loading matches...</div>;

  return (
    <div className="matches-page">
      <div className="new-matches-section">
        <h3 className="section-title">New Matches</h3>
        {newMatches.length > 0 ? (
          <div className="horizontal-scroll">
            {newMatches.map(match => (
              <div key={match.matchId} className="match-avatar-wrapper" onClick={() => navigate(`/chat/${match.matchId}`)}>
                <img src={match.photoUrl} alt={match.name} className="match-avatar" />
                <span className="match-name">{match.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{color: 'var(--text-secondary)', fontSize: '14px'}}>Keep swiping to get matches!</p>
        )}
      </div>

      <div className="messages-section">
        <h3 className="section-title">Messages</h3>
        {conversations.length > 0 ? (
          conversations.map(match => (
            <div key={match.matchId} className="message-item" onClick={() => navigate(`/chat/${match.matchId}`)}>
              <img src={match.photoUrl} alt={match.name} className="message-avatar" />
              <div className="message-content">
                <div className="message-header">
                  <h4>{match.name}</h4>
                  <span className="message-time">{match.time}</span>
                </div>
                <p className="message-preview">{match.lastMessage || 'Say hi! 👋'}</p>
              </div>
            </div>
          ))
        ) : (
          <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px'}}>No messages yet.</p>
        )}
      </div>
    </div>
  );
};

export default Matches;
