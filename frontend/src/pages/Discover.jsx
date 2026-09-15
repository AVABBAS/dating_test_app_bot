import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../telegram';
import { X, Star, Heart as HeartIcon, RotateCcw, Info, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import MatchModal from '../components/MatchModal';
import Stories from '../components/Stories';

const Discover = ({ user }) => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchData, setMatchData] = useState(null);
  const [history, setHistory] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [pendingAction, setPendingAction] = useState(false);
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);
  const actionTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const fetchProfiles = async () => {
      if (!user?.telegramId) return;
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_URL}/discover/${user.telegramId}`);
        if (!cancelled) {
          setProfiles(Array.isArray(res.data) ? res.data : []);
          setCurrentIndex(0);
        }
      } catch {
        if (!cancelled) {
          setProfiles([]);
          setError('دریافت پروفایل‌ها ناموفق بود.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfiles();
    return () => { cancelled = true; };
  }, [user?.telegramId]);

  useEffect(() => {
    setPhotoIndex(0);
    setShowInfo(false);
  }, [currentIndex]);

  useEffect(() => () => window.clearTimeout(actionTimer.current), []);

  const currentProfile = profiles[currentIndex];

  const triggerExit = (dir, profile = currentProfile) => {
    if (!profile || pendingAction) return;
    setExitDir(dir);
    setIsDragging(false);
    setPendingAction(true);
    const indexAtAction = currentIndex;
    setHistory(prev => [...prev, { profile, index: indexAtAction }]);

    actionTimer.current = window.setTimeout(async () => {
      const action = ({ right: 'like', left: 'pass', up: 'superlike' })[dir];
      try {
        const res = await axios.post(`${API_URL}/action`, {
          fromTelegramId: user.telegramId,
          toUserId: profile.id,
          action,
        });
        if (res.data?.match) {
          setMatchData({
            userPhoto: user.photoUrl || '',
            matchPhoto: profile.photoUrl,
            matchName: profile.firstName || profile.name || 'کاربر',
            matchId: res.data.matchedUser?.id || res.data.matchId,
          });
        }
        setCurrentIndex(indexAtAction + 1);
      } catch {
        // Do not silently lose a failed action: restore the card and let the user retry.
        setHistory(prev => prev.slice(0, -1));
        setExitDir(null);
      } finally {
        setDelta({ x: 0, y: 0 });
        setPendingAction(false);
      }
    }, 280);
  };

  const handleRewind = () => {
    if (pendingAction || history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentIndex(last.index);
    setDelta({ x: 0, y: 0 });
    setExitDir(null);
  };

  const onDragStart = (e) => {
    if (pendingAction || !currentProfile) return;
    const point = e.touches?.[0] || e;
    startPos.current = { x: point.clientX, y: point.clientY };
    startTime.current = Date.now();
    setIsDragging(true);
  };

  const onDragMove = (e) => {
    if (!isDragging || pendingAction) return;
    const point = e.touches?.[0] || e;
    setDelta({ x: point.clientX - startPos.current.x, y: point.clientY - startPos.current.y });
  };

  const onDragEnd = () => {
    if (!isDragging || pendingAction) return;
    setIsDragging(false);
    const elapsed = Math.max(Date.now() - startTime.current, 1);
    const velocityX = delta.x / elapsed;
    const velocityY = delta.y / elapsed;
    if (delta.x > 90 || velocityX > 0.3) triggerExit('right');
    else if (delta.x < -90 || velocityX < -0.3) triggerExit('left');
    else if ((delta.y < -70 && Math.abs(delta.x) < 50) || velocityY < -0.3) triggerExit('up');
    else setDelta({ x: 0, y: 0 });
  };

  const photos = currentProfile?.photos?.length ? currentProfile.photos : (currentProfile?.photoUrl ? [currentProfile.photoUrl] : []);
  const currentPhoto = photos[photoIndex] || photos[0];
  const dist = Math.min(Math.hypot(delta.x, delta.y), 150);
  const pct = dist / 150;
  const likeOp = Math.min(Math.max(delta.x / 80, 0), 1);
  const nopeOp = Math.min(Math.max(-delta.x / 80, 0), 1);
  const superOp = Math.min(Math.max(-delta.y / 70, 0), 1) * (Math.abs(delta.x) < 50 ? 1 : 0);
  let cardTransform = 'translate(0,0) rotate(0deg)';
  if (exitDir === 'right') cardTransform = 'translate(150vw,-20px) rotate(30deg)';
  else if (exitDir === 'left') cardTransform = 'translate(-150vw,-20px) rotate(-30deg)';
  else if (exitDir === 'up') cardTransform = 'translate(0,-150vh) rotate(5deg)';
  else if (isDragging) cardTransform = `translate(${delta.x}px,${delta.y}px) rotate(${delta.x * 0.05}deg)`;

  if (loading) return <div className="discover-page"><div className="discover-loading"><HeartIcon size={52} color="var(--brand-primary)" /><p>در حال یافتن نفرات...</p></div></div>;
  if (error) return <div className="discover-page"><div className="empty-state"><div style={{ fontSize: 54 }}>⚠️</div><h3>{error}</h3><button type="button" className="primary-btn" onClick={() => window.location.reload()}>تلاش دوباره</button></div></div>;
  if (!currentProfile) return <div className="discover-page"><div className="empty-state"><div style={{ fontSize: 64 }}>🌹</div><h3>فعلاً پروفایل دیگری نیست</h3><p>بعداً دوباره سر بزن، کارت‌های جدید منتظرت هستند.</p>{history.length > 0 && <button type="button" className="rewind-big-btn" onClick={handleRewind}><RotateCcw size={16} /> بازگرداندن آخرین کارت</button>}</div></div>;

  return (
    <div className="discover-page">
      <div className="discover-header">
        <div className="discover-logo"><Sparkles size={20} color="var(--brand-primary)" /><span>Vibe</span></div>
        <button type="button" className="hdr-btn" onClick={handleRewind} disabled={!history.length || pendingAction} title="بازگرداندن"><RotateCcw size={18} /></button>
      </div>
      <Stories user={user} />
      <div className="card-container" onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd} onMouseDown={onDragStart} onMouseMove={onDragMove} onMouseUp={onDragEnd} onMouseLeave={onDragEnd}>
        {profiles[currentIndex + 1] && <div className="swipe-card" style={{ transform: `scale(${0.94 + 0.06 * pct}) translateY(14px)`, opacity: 0.75 + 0.25 * pct, zIndex: 1 }}><img src={profiles[currentIndex + 1].photoUrl} className="card-image" alt="" draggable={false} /><div className="card-gradient-overlay" /></div>}
        <div className="swipe-card" style={{ transform: cardTransform, transition: isDragging && !exitDir ? 'none' : 'transform .35s cubic-bezier(.25,.46,.45,.94)', zIndex: 2 }}>
          <div className="card-image-wrapper">
            {currentPhoto ? <img src={currentPhoto} className="card-image" alt={currentProfile.firstName || 'کاربر'} draggable={false} /> : <div className="card-image" />}
            {photos.length > 1 && <><div className="photo-dots">{photos.map((_, i) => <span key={i} className={`photo-dot ${i === photoIndex ? 'active' : ''}`} />)}</div><div className="photo-tap-left" onClick={e => { e.stopPropagation(); setPhotoIndex(i => Math.max(0, i - 1)); }} /><div className="photo-tap-right" onClick={e => { e.stopPropagation(); setPhotoIndex(i => Math.min(photos.length - 1, i + 1)); }} /></>}
            <div className="card-gradient-overlay" />
            <div className="action-overlay overlay-like" style={{ opacity: likeOp }}>پسندیدم ❤️</div>
            <div className="action-overlay overlay-nope" style={{ opacity: nopeOp }}>رد شد ✕</div>
            <div className="action-overlay overlay-super" style={{ opacity: superOp }}>سوپر لایک ⭐</div>
            <div className="card-info">
              <div className="card-name-row"><div className="card-name-age"><span className="card-name">{currentProfile.firstName || 'کاربر'}</span>{currentProfile.age != null && <span className="card-age">{currentProfile.age}</span>}{currentProfile.isVerified && <ShieldCheck size={18} color="#00C6FF" />}</div><button type="button" className="card-info-btn" onClick={e => { e.stopPropagation(); setShowInfo(v => !v); }} aria-label="اطلاعات"><Info size={20} color="#fff" /></button></div>
              <div className="card-meta">{currentProfile.isOnline && <span className="online-pip" />}{currentProfile.distance != null && <span className="card-distance"><MapPin size={12} /> {currentProfile.distance}</span>}</div>
              {!showInfo && currentProfile.bio && <p className="card-bio">{currentProfile.bio}</p>}
              {showInfo && <div className="card-info-panel"><p className="card-bio-full">{currentProfile.bio}</p>{Array.isArray(currentProfile.interests) && currentProfile.interests.length > 0 && <div className="card-tags">{currentProfile.interests.map((t, i) => <span key={i} className="card-tag">{t}</span>)}</div>}</div>}
            </div>
          </div>
        </div>
      </div>
      <div className="action-buttons">
        <button type="button" className="action-btn btn-rewind" onClick={handleRewind} disabled={!history.length || pendingAction}><RotateCcw size={20} /></button>
        <button type="button" className="action-btn btn-pass" onClick={() => triggerExit('left')} disabled={pendingAction}><X size={30} strokeWidth={3} /></button>
        <button type="button" className="action-btn btn-super" onClick={() => triggerExit('up')} disabled={pendingAction}><Star size={24} strokeWidth={3} fill="currentColor" /></button>
        <button type="button" className="action-btn btn-like" onClick={() => triggerExit('right')} disabled={pendingAction}><HeartIcon size={30} strokeWidth={3} fill="currentColor" /></button>
      </div>
      {matchData && <MatchModal data={matchData} onClose={() => setMatchData(null)} />}
    </div>
  );
};

export default Discover;
