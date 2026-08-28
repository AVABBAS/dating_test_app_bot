import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../telegram';
import { X, Star, Heart as HeartIcon, RotateCcw, Zap, Info, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import MatchModal from '../components/MatchModal';

const DUMMY_PROFILES = [
  {
    id: '1',
    name: 'سارا',
    age: 24,
    bio: 'عاشق کوهنوردی و قهوه تخصصی ☕️ | موسیقی جاز و کتاب‌های کلاسیک 🎵',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=600&auto=format&fit=crop',
    ],
    distance: '۳ کیلومتری شما',
    isOnline: true,
    isVerified: true,
    interests: ['🎵 موسیقی', '☕ قهوه', '✈️ سفر'],
  },
  {
    id: '2',
    name: 'آرمیتا',
    age: 26,
    bio: 'طراح گرافیک | عاشق گربه‌ها و هنر مدرن 🎨🐱',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop',
    ],
    distance: '۵ کیلومتری شما',
    isOnline: false,
    isVerified: true,
    interests: ['🎨 هنر', '🐱 حیوانات', '📚 کتاب'],
  },
  {
    id: '3',
    name: 'نیلوفر',
    age: 22,
    bio: 'دانشجوی معماری | یوگا و طبیعت 🧘🌿',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop',
    ],
    distance: '۸ کیلومتری شما',
    isOnline: true,
    isVerified: false,
    interests: ['🧘 یوگا', '🏔️ کوهنوردی', '🍃 طبیعت'],
  },
];

const Discover = ({ user }) => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [history, setHistory] = useState([]);
  const [showInfo, setShowInfo] = useState(false);

  // Swipe state
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState(null); // 'left' | 'right' | 'up'
  const startPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => { fetchProfiles(); }, [user]);
  useEffect(() => { setPhotoIndex(0); setShowInfo(false); }, [currentIndex]);

  const fetchProfiles = async () => {
    if (!user) return;
    try {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/discover/${user.telegramId}`);
        setProfiles(res.data.length > 0 ? res.data : DUMMY_PROFILES);
      } catch {
        setProfiles(DUMMY_PROFILES);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentProfile = profiles[currentIndex];

  const triggerExit = (dir, profile) => {
    if (!profile) return;
    setExitDir(dir);
    setIsDragging(false);
    setHistory(prev => [...prev, { profile, index: currentIndex }]);

    setTimeout(async () => {
      setCurrentIndex(prev => prev + 1);
      setDelta({ x: 0, y: 0 });
      setExitDir(null);
      const actionMap = { right: 'like', left: 'pass', up: 'superlike' };
      try {
        const res = await axios.post(`${API_URL}/action`, {
          fromTelegramId: user.telegramId,
          toUserId: profile.id,
          action: actionMap[dir],
        });
        if (res.data.match) {
          setMatchData({
            userPhoto: user.photoUrl || '',
            matchPhoto: profile.photoUrl,
            matchName: profile.name,
            matchId: res.data.matchId,
          });
        }
      } catch (e) { console.error(e); }
    }, 320);
  };

  const handleRewind = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentIndex(last.index);
    setDelta({ x: 0, y: 0 });
    setExitDir(null);
  };

  // Touch/Mouse handlers
  const onDragStart = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    startPos.current = { x, y };
    setIsDragging(true);
  };

  const onDragMove = (e) => {
    if (!isDragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setDelta({ x: x - startPos.current.x, y: y - startPos.current.y });
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (delta.x > 90) triggerExit('right', currentProfile);
    else if (delta.x < -90) triggerExit('left', currentProfile);
    else if (delta.y < -70 && Math.abs(delta.x) < 50) triggerExit('up', currentProfile);
    else setDelta({ x: 0, y: 0 });
  };

  const onNextPhoto = (e) => {
    e.stopPropagation();
    const photos = currentProfile?.photos || [currentProfile?.photoUrl];
    if (photoIndex < photos.length - 1) setPhotoIndex(i => i + 1);
  };
  const onPrevPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex > 0) setPhotoIndex(i => i - 1);
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className="discover-page">
        <div className="discover-loading">
          <HeartIcon size={52} color="#FF2A7A" style={{ animation: 'pulse 1s infinite alternate' }} />
          <p>در حال یافتن نفرات...</p>
        </div>
      </div>
    );
  }

  // ── EMPTY ──
  if (!currentProfile) {
    return (
      <div className="discover-page">
        <div className="empty-state">
          <div style={{ fontSize: 64, marginBottom: 16 }}>🌹</div>
          <h3>پروفایل دیگری نیست!</h3>
          <p>بعداً برگرد، کارت‌های جدید منتظرتن.</p>
          {history.length > 0 && (
            <button className="rewind-big-btn" onClick={handleRewind}>
              <RotateCcw size={16} /> بازگرداندن آخرین کارت
            </button>
          )}
        </div>
      </div>
    );
  }

  const photos = currentProfile.photos?.length ? currentProfile.photos : [currentProfile.photoUrl];
  const currentPhoto = photos[photoIndex] || currentProfile.photoUrl;

  // Card transform
  const dist = Math.min(Math.sqrt(delta.x ** 2 + delta.y ** 2), 150);
  const pct = dist / 150;

  let cardTransform;
  if (exitDir === 'right') cardTransform = 'translate(150vw, -20px) rotate(30deg)';
  else if (exitDir === 'left') cardTransform = 'translate(-150vw, -20px) rotate(-30deg)';
  else if (exitDir === 'up') cardTransform = 'translate(0, -150vh) rotate(5deg)';
  else if (isDragging) cardTransform = `translate(${delta.x}px, ${delta.y}px) rotate(${delta.x * 0.05}deg)`;
  else cardTransform = 'translate(0,0) rotate(0deg)';

  const cardTransition = isDragging && !exitDir ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  const likeOp = Math.min(Math.max(delta.x / 80, 0), 1);
  const nopeOp = Math.min(Math.max(-delta.x / 80, 0), 1);
  const superOp = Math.min(Math.max(-delta.y / 70, 0), 1) * (Math.abs(delta.x) < 50 ? 1 : 0);

  const nextScale = 0.94 + 0.06 * pct;
  const nextOp = 0.75 + 0.25 * pct;

  return (
    <div className="discover-page">

      {/* ── Header ── */}
      <div className="discover-header">
        <div className="discover-logo">
          <Sparkles size={20} color="#FF2A7A" />
          <span>Lovely</span>
        </div>
        <div className="discover-header-actions">
          <button
            className="hdr-btn"
            onClick={handleRewind}
            disabled={history.length === 0}
            title="بازگرداندن"
          >
            <RotateCcw size={18} />
          </button>
          <button className="hdr-btn hdr-boost" title="بوست">
            <Zap size={18} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* ── Card Stack ── */}
      <div
        className="card-container"
        ref={containerRef}
        style={{ perspective: '1000px' }}
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
      >
        {/* Next card */}
        {profiles[currentIndex + 1] && (
          <div
            className="swipe-card"
            style={{
              transform: `scale(${nextScale}) translateY(14px)`,
              opacity: nextOp,
              zIndex: 1,
              transition: isDragging ? 'none' : 'all 0.35s ease',
            }}
          >
            <img src={profiles[currentIndex + 1].photoUrl} className="card-image" alt="" draggable={false} />
            <div className="card-gradient-overlay" />
          </div>
        )}

        {/* Active card */}
        <div
          className="swipe-card"
          style={{ transform: cardTransform, transition: cardTransition, zIndex: 2 }}
        >
          <div className="card-image-wrapper">
            <img src={currentPhoto} className="card-image" alt={currentProfile.name} draggable={false} />

            {/* Photo indicators */}
            {photos.length > 1 && (
              <div className="photo-dots">
                {photos.map((_, i) => (
                  <span key={i} className={`photo-dot ${i === photoIndex ? 'active' : ''}`} />
                ))}
              </div>
            )}

            {/* Photo nav tap zones */}
            {photos.length > 1 && (
              <>
                <div className="photo-tap-left" onClick={onPrevPhoto} />
                <div className="photo-tap-right" onClick={onNextPhoto} />
              </>
            )}

            <div className="card-gradient-overlay" />

            {/* LIKE / NOPE / SUPER overlays */}
            <div className="action-overlay overlay-like" style={{ opacity: likeOp }}>پسندیدم ❤️</div>
            <div className="action-overlay overlay-nope" style={{ opacity: nopeOp }}>رد شد ✕</div>
            <div className="action-overlay overlay-super" style={{ opacity: superOp }}>سوپر لایک ⭐</div>

            {/* Card Info */}
            <div className="card-info">
              {/* Name row */}
              <div className="card-name-row">
                <div className="card-name-age">
                  <span className="card-name">{currentProfile.name}</span>
                  <span className="card-age">{currentProfile.age}</span>
                  {currentProfile.isVerified && (
                    <ShieldCheck size={18} color="#00C6FF" style={{ marginRight: 4 }} />
                  )}
                </div>
                <button
                  className="card-info-btn"
                  onClick={(e) => { e.stopPropagation(); setShowInfo(v => !v); }}
                >
                  <Info size={20} color="#fff" />
                </button>
              </div>

              {/* Distance + online */}
              <div className="card-meta">
                {currentProfile.isOnline && <span className="online-pip" />}
                {currentProfile.distance && (
                  <span className="card-distance">
                    <MapPin size={12} /> {currentProfile.distance}
                  </span>
                )}
              </div>

              {/* Bio (shown unless info panel open) */}
              {!showInfo && <p className="card-bio">{currentProfile.bio}</p>}

              {/* Expanded info panel */}
              {showInfo && (
                <div className="card-info-panel">
                  <p className="card-bio-full">{currentProfile.bio}</p>
                  {currentProfile.interests?.length > 0 && (
                    <div className="card-tags">
                      {currentProfile.interests.map((t, i) => (
                        <span key={i} className="card-tag">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="action-buttons">
        <button
          className="action-btn btn-rewind"
          onClick={handleRewind}
          disabled={history.length === 0}
          title="بازگرداندن"
        >
          <RotateCcw size={20} />
        </button>
        <button className="action-btn btn-pass" onClick={() => triggerExit('left', currentProfile)}>
          <X size={30} strokeWidth={3} />
        </button>
        <button className="action-btn btn-super" onClick={() => triggerExit('up', currentProfile)}>
          <Star size={24} strokeWidth={3} fill="currentColor" />
        </button>
        <button className="action-btn btn-like" onClick={() => triggerExit('right', currentProfile)}>
          <HeartIcon size={30} strokeWidth={3} fill="currentColor" />
        </button>
        <button className="action-btn btn-boost" title="بوست">
          <Zap size={20} fill="currentColor" />
        </button>
      </div>

      {/* ── Match Modal ── */}
      {matchData && (
        <MatchModal data={matchData} onClose={() => setMatchData(null)} />
      )}
    </div>
  );
};

export default Discover;
