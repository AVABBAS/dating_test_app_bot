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
  const [matchInfo, setMatchInfo] = useState({ name: 'Match', photoUrl: 'https://via.placeholder.com/40' });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Dummy messages
    setMessages([
      { id: 1, text: 'Hey there! 👋', senderId: 'other', time: '10:00 AM' },
      { id: 2, text: 'Hi! How are you doing?', senderId: user?.telegramId || 'me', time: '10:05 AM' },
    ]);
    
    // Auto scroll
    scrollToBottom();
  }, [matchId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: input,
      senderId: user?.telegramId || 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMsg]);
    setInput('');

    try {
      await axios.post(`${API_URL}/messages`, {
        fromTelegramId: user?.telegramId,
        matchId: matchId,
        text: input
      });
    } catch (err) {
      console.error('Failed to send message to API', err);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="chat-user-info">
          <img src={matchInfo.photoUrl} alt="Avatar" className="chat-avatar" />
          <h3 style={{fontSize: '18px'}}>{matchInfo.name}</h3>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => {
          const isMe = msg.senderId === (user?.telegramId || 'me');
          return (
            <div key={msg.id} className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}>
              {msg.text}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-container" onSubmit={handleSend}>
        <input 
          type="text" 
          className="chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="send-btn" disabled={!input.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
