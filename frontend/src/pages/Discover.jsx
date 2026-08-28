import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../telegram';
import { X, Star, Heart as HeartIcon } from 'lucide-react';
import MatchModal from '../components/MatchModal';

const Discover = ({ user }) => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);

  // Swipe state
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Dummy data fallback if API fails
      const dummyProfiles = [
        { id: '1', name: 'Sarah', age: 24, bio: 'Love hiking and coffee ☕️', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop' },
        { id: '2', name: 'Jessica', age: 26, bio: 'Dog mom, travel enthusiast ✈️', photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop' },
        { id: '3', name: 'Emma', age: 22, bio: 'Art and museums 🎨', photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop' }
      ];
      
      try {
        const response = await axios.get(`${API_URL}/discover/${user.telegramId}`);
        setProfiles(response.data.length > 0 ? response.data : dummyProfiles);
      } catch (err) {
        setProfiles(dummyProfiles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentProfile = profiles[currentIndex];

  const handleAction = async (actionType, profile) => {
    if (!profile) return;
    
    // Optimistically update UI
    setCurrentIndex(prev => prev + 1);
    setDelta({ x: 0, y: 0 });
    
    try {
      const response = await axios.post(`${API_URL}/action`, {
        fromTelegramId: user.telegramId,
        toUserId: profile.id,
        action: actionType
      });
      
      if (response.data.match) {
        setMatchData({
          userPhoto: user.photoUrl || 'https://via.placeholder.com/150',
          matchPhoto: profile.photoUrl,
          matchName: profile.name,
          matchId: response.data.matchId
        });
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const handleTouchStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    setDelta({
      x: clientX - startPos.current.x,
      y: clientY - startPos.current.y
    });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const thresholdX = 100;
    const thresholdY = -80;

    if (delta.x > thresholdX) {
      // Swiped Right
      handleAction('like', currentProfile);
    } else if (delta.x < -thresholdX) {
      // Swiped Left
      handleAction('pass', currentProfile);
    } else if (delta.y < thresholdY && Math.abs(delta.x) < 50) {
      // Swiped Up
      handleAction('superlike', currentProfile);
    } else {
      // Snap back
      setDelta({ x: 0, y: 0 });
    }
  };

  if (loading) {
    return <div className="discover-page"><div className="loading-heart"><HeartIcon size={48} color="#FF2E93" /></div></div>;
  }

  if (!currentProfile) {
    return (
      <div className="discover-page">
        <div className="empty-state">
          <div className="loading-heart mb-4"><Compass size={64} color="#FF8A00" /></div>
          <h3>No more profiles!</h3>
          <p>Check back later for more potential matches.</p>
        </div>
      </div>
    );
  }

  const dragDistance = Math.min(Math.sqrt(delta.x * delta.x + delta.y * delta.y), 150);
  const dragPercentage = dragDistance / 150;
  
  // Calculate card transforms and overlay opacities
  const rotateX = isDragging ? -delta.y * 0.1 : 0;
  const rotateY = isDragging ? delta.x * 0.1 : 0;
  const cardStyle = {
    transform: isDragging 
      ? `translate(${delta.x}px, ${delta.y}px) rotate(${delta.x * 0.05}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      : `translate(0px, 0px) rotate(0deg) rotateX(0deg) rotateY(0deg)`,
    transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    transformStyle: 'preserve-3d'
  };

  const likeOpacity = Math.min(Math.max(delta.x / 100, 0), 1);
  const nopeOpacity = Math.min(Math.max(-delta.x / 100, 0), 1);
  const superOpacity = Math.min(Math.max(-delta.y / 80, 0), 1) * (Math.abs(delta.x) < 50 ? 1 : 0);

  const nextCardScale = 0.95 + (0.05 * dragPercentage);
  const nextCardOpacity = 0.8 + (0.2 * dragPercentage);

  return (
    <div className="discover-page">
      <div 
        className="card-container"
        ref={containerRef}
        style={{ perspective: '1000px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {/* Next Card (Background) */}
        {profiles[currentIndex + 1] && (
          <div className="swipe-card" style={{ transform: `scale(${nextCardScale})`, zIndex: 1, opacity: nextCardOpacity, transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <img src={profiles[currentIndex + 1].photoUrl} className="card-image" alt="Profile" draggable={false} />
            <div className="card-gradient-overlay"></div>
          </div>
        )}

        {/* Current Card */}
        <div className="swipe-card" style={{...cardStyle, zIndex: 2}}>
          <div className="card-image-wrapper">
            <img src={currentProfile.photoUrl} className="card-image" alt={currentProfile.name} draggable={false} />
            <div className="card-gradient-overlay"></div>
            
            {/* Action Overlays */}
            <div className="action-overlay overlay-like" style={{ opacity: likeOpacity }}>LIKE</div>
            <div className="action-overlay overlay-nope" style={{ opacity: nopeOpacity }}>NOPE</div>
            <div className="action-overlay overlay-super" style={{ opacity: superOpacity }}>SUPER LIKE</div>

            <div className="card-info">
              <div className="card-name-age">
                <span className="card-name">{currentProfile.name}</span>
                <span className="card-age">{currentProfile.age}</span>
              </div>
              <p className="card-bio">{currentProfile.bio}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="action-btn btn-pass" onClick={() => handleAction('pass', currentProfile)}>
          <X size={32} strokeWidth={3} />
        </button>
        <button className="action-btn btn-super" onClick={() => handleAction('superlike', currentProfile)}>
          <Star size={24} strokeWidth={3} fill="currentColor" />
        </button>
        <button className="action-btn btn-like" onClick={() => handleAction('like', currentProfile)}>
          <HeartIcon size={32} strokeWidth={3} fill="currentColor" />
        </button>
      </div>

      {matchData && (
        <MatchModal 
          data={matchData} 
          onClose={() => setMatchData(null)} 
        />
      )}
    </div>
  );
};

export default Discover;
