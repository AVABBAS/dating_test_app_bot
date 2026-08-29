import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MatchModal = ({ data, onClose }) => {
  const navigate = useNavigate();
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    const dots = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      backgroundColor: ['#FF2E93', '#FF8A00', '#00B0FF', '#00E676', '#FFFFFF'][Math.floor(Math.random() * 5)],
      width: `${Math.random() * 8 + 4}px`,
      height: `${Math.random() * 8 + 4}px`,
    }));
    setConfetti(dots);
  }, []);

  const handleMessage = () => {
    onClose();
    if (data.matchId) {
      navigate(`/chat/${data.matchId}`);
    } else {
      navigate('/matches');
    }
  };

  return (
    <div className="match-modal-overlay">
      {confetti.map(c => (
        <div
          key={c.id}
          className="confetti"
          style={{
            left: c.left,
            animationDelay: c.animationDelay,
            backgroundColor: c.backgroundColor,
            width: c.width,
            height: c.height,
            borderRadius: Math.random() > 0.5 ? '50%' : '0'
          }}
        />
      ))}

      <h1 className="match-title">مچ شدید! 🎉</h1>
      <p style={{ color: 'white', marginBottom: '30px', textAlign: 'center' }}>
        شما و {data.matchName} یکدیگر را پسندیدید ❤️
      </p>

      <div className="match-photos">
        <img src={data.userPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'} className="match-photo match-photo-left" alt="شما"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'; }} />
        <img src={data.matchPhoto} className="match-photo match-photo-right" alt="مچ"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&auto=format&fit=crop'; }} />
      </div>

      <button className="match-btn btn-primary" onClick={handleMessage}>
        ارسال پیام 💬
      </button>
      <button className="match-btn btn-secondary" onClick={onClose}>
        ادامه سوایپ ❤️
      </button>
    </div>
  );
};

export default MatchModal;
