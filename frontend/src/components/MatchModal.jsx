import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MatchModal = ({ data, onClose }) => {
  const navigate = useNavigate();
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    // Generate random confetti dots
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
    if(data.matchId) {
      navigate(`/chat/${data.matchId}`);
    }
  };

  return (
    <div className="match-modal-overlay">
      {/* Confetti Elements */}
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

      <h1 className="match-title">It's a Match! 🎉</h1>
      <p style={{color: 'white', marginBottom: '30px'}}>You and {data.matchName} have liked each other.</p>
      
      <div className="match-photos">
        <img src={data.userPhoto} className="match-photo match-photo-left" alt="You" />
        <img src={data.matchPhoto} className="match-photo match-photo-right" alt="Match" />
      </div>

      <button className="match-btn btn-primary" onClick={handleMessage}>
        Send a Message
      </button>
      <button className="match-btn btn-secondary" onClick={onClose}>
        Keep Swiping
      </button>
    </div>
  );
};

export default MatchModal;
