import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../telegram';
import {
  Search, X, Heart, Star, Zap, MapPin,
  Loader2, Frown, RefreshCw, Sparkles, Info
} from 'lucide-react';
import MatchModal from '../components/MatchModal';

const CATEGORIES = [
  { value: 'all', label: 'همه' },
  { value: 'online', label: '🟢 آنلاین' },
  { value: 'new', label: '✨ جدید' },
  { value: 'popular', label: '🔥 پرطرفدار' },
];

// Fallback data so the page never looks broken (e.g. offline / API error).
const DUMMY_PROFILES = [
  { id: 'd1', firstName: 'میا', age: 23, photoUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?q=80&w=400&auto=format&fit=crop', bio: 'عاشق موسیقی و سفر ✈️', interests: ['🎵 موسیقی', '✈️ سفر'], isOnline: true },
  { id: 'd2', firstName: 'لیام', age: 27, photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop', bio: 'ورزشکار و کوهنورد 🏔️', interests: ['🏋️ ورزش'], isOnline: false },
  { id: 'd3', firstName: 'الیویا', age: 25, photoUrl: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=400&auto=format&fit=crop', bio: 'طراح گرافیک 🎨', interests: ['🎨 هنر'], isOnline: true },
  { id: 'd4', firstName: 'نوا', age: 28, photoUrl: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=400&auto=format&fit=crop', bio: 'برنامه‌نویس و گیمر 🎮', interests: ['💻 تکنولوژی'], isOnline: false },
  { id: 'd5', firstName: 'آوا', age: 24, photoUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400&auto=format&fit=crop', bio: 'عاشق قهوه و کتاب ☕📚', interests: ['☕ قهوه', '📚 کتاب'], isOnline: true },
  { id: 'd6', firstName: 'ایتن', age: 26, photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop', bio: 'عکاس آماتور 📸', interests: ['📸 عکاسی'], isOnline: false },
];

const Explore = ({ user }) => {
  const [category, setCategory] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [passedIds, setPassedIds] = useState(new Set());

  const searchInputRef = useRef(null);

  // Debounce the search term so we don't hammer the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrored(false);
    try {
      const params = {};
      if (category !== 'all') params.category = category;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await axios.get(`${API_URL}/explore/${user.telegramId}`, { params });
      setProfiles(res.data || []);
      setUsingFallback(false);
    } catch {
      // Keep the experience smooth even if the backend/user isn't ready yet.
      setProfiles(DUMMY_PROFILES);
      setUsingFallback(true);
      setErrored(true);
    } finally {
      setLoading(false);
    }
  }, [user, category, debouncedSearch]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const visibleProfiles = profiles.filter(p => !passedIds.has(p.id));

  const openProfile = (profile) => {
    setSelectedProfile(profile);
    setPhotoIndex(0);
  };

  const closeProfile = () => {
    setSelectedProfile(null);
    setPhotoIndex(0);
  };

  const handleAction = async (action) => {
    if (!selectedProfile || actionBusy || usingFallback) {
      // If we're on fallback/dummy data, just close politely without hitting the API.
      if (usingFallback && selectedProfile) {
        if (action === 'pass') setPassedIds(prev => new Set(prev).add(selectedProfile.id));
        closeProfile();
      }
      return;
    }

    setActionBusy(true);
    try {
      const res = await axios.post(`${API_URL}/action`, {
        fromTelegramId: user.telegramId,
        toUserId: selectedProfile.id,
        action,
      });

      setPassedIds(prev => new Set(prev).add(selectedProfile.id));

      if (res.data.match) {
        setMatchData({
          userPhoto: user.photoUrl || '',
          matchPhoto: selectedProfile.photoUrl,
          matchName: selectedProfile.firstName,
          matchId: res.data.matchId,
        });
      }
      closeProfile();
    } catch (e) {
      console.error('Explore action failed:', e);
    } finally {
      setActionBusy(false);
    }
  };

  const photos = selectedProfile?.photos?.length ? selectedProfile.photos : [selectedProfile?.photoUrl];
  const currentPhoto = photos[photoIndex] || selectedProfile?.photoUrl;

  return (
    <div className="explore-page">
      {/* ── Header ── */}
      <div className="explore-header">
        <div className="explore-header-top">
          <h1 className="explore-title">
            <Sparkles size={22} color="#FF2A7A" />
            کاوش
          </h1>
          <div className="explore-header-actions">
            <button
              className={`explore-icon-btn ${searchOpen ? 'active' : ''}`}
              onClick={() => { setSearchOpen(v => !v); if (searchOpen) setSearchTerm(''); }}
              title="جستجو"
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
            <button className="explore-icon-btn" onClick={fetchProfiles} title="بروزرسانی">
              <RefreshCw size={18} className={loading ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="explore-search-bar">
            <Search size={16} color="var(--text-secondary)" />
            <input
              ref={searchInputRef}
              type="text"
              className="explore-search-input"
              placeholder="جستجوی نام یا بیو..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="explore-search-clear" onClick={() => setSearchTerm('')}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <div className="categories-scroll">
          {CATEGORIES.map(cat => (
            <div
              key={cat.value}
              className={`category-chip ${category === cat.value ? 'active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="explore-loading">
          <Loader2 size={40} className="spin-icon" color="#FF2A7A" />
          <p>در حال بارگذاری پروفایل‌ها...</p>
        </div>
      ) : visibleProfiles.length === 0 ? (
        <div className="explore-empty">
          <Frown size={48} color="var(--text-secondary)" />
          <h3>پروفایلی پیدا نشد</h3>
          <p>
            {debouncedSearch
              ? `نتیجه‌ای برای «${debouncedSearch}» یافت نشد.`
              : 'دسته‌بندی دیگه‌ای رو امتحان کن.'}
          </p>
        </div>
      ) : (
        <>
          {errored && (
            <div className="explore-offline-banner">
              اتصال به سرور برقرار نشد — نمایش نمونه پروفایل‌ها
            </div>
          )}
          <div className="explore-grid">
            {visibleProfiles.map(profile => (
              <div key={profile.id} className="explore-card" onClick={() => openProfile(profile)}>
                <img src={profile.photoUrl} alt={profile.firstName} className="explore-img" loading="lazy" />
                <div className="explore-card-badges">
                  {profile.isBoosted && (
                    <span className="explore-badge explore-badge-boost"><Zap size={11} fill="currentColor" /></span>
                  )}
                </div>
                <div className="explore-info">
                  <span className="explore-name">
                    {profile.firstName}{profile.age ? `, ${profile.age}` : ''}
                    {profile.isOnline && <span className="online-badge" />}
                  </span>
                  {profile.bio && <span className="explore-bio-preview">{profile.bio}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Profile Detail Modal ── */}
      {selectedProfile && (
        <div className="explore-modal-overlay" onClick={closeProfile}>
          <div className="explore-modal" onClick={e => e.stopPropagation()}>
            <button className="explore-modal-close" onClick={closeProfile}>
              <X size={20} />
            </button>

            <div className="explore-modal-photo-wrapper">
              <img src={currentPhoto} alt={selectedProfile.firstName} className="explore-modal-photo" />

              {photos.length > 1 && (
                <div className="photo-dots">
                  {photos.map((_, i) => (
                    <span key={i} className={`photo-dot ${i === photoIndex ? 'active' : ''}`} />
                  ))}
                </div>
              )}
              {photos.length > 1 && (
                <>
                  <div
                    className="photo-tap-left"
                    onClick={(e) => { e.stopPropagation(); if (photoIndex > 0) setPhotoIndex(i => i - 1); }}
                  />
                  <div
                    className="photo-tap-right"
                    onClick={(e) => { e.stopPropagation(); if (photoIndex < photos.length - 1) setPhotoIndex(i => i + 1); }}
                  />
                </>
              )}

              <div className="card-gradient-overlay" />

              <div className="explore-modal-info">
                <div className="card-name-row">
                  <div className="card-name-age">
                    <span className="card-name">{selectedProfile.firstName}</span>
                    {selectedProfile.age && <span className="card-age">{selectedProfile.age}</span>}
                  </div>
                </div>
                <div className="card-meta">
                  {selectedProfile.isOnline && <span className="online-pip" />}
                  {selectedProfile.isOnline && (
                    <span className="card-distance"><MapPin size={12} /> آنلاین</span>
                  )}
                </div>
              </div>
            </div>

            <div className="explore-modal-body">
              {selectedProfile.bio && (
                <div className="explore-modal-bio">
                  <Info size={14} color="var(--text-secondary)" />
                  <p>{selectedProfile.bio}</p>
                </div>
              )}
              {selectedProfile.interests?.length > 0 && (
                <div className="card-tags" style={{ marginTop: 10 }}>
                  {selectedProfile.interests.map((t, i) => (
                    <span key={i} className="card-tag">{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="explore-modal-actions">
              <button
                className="action-btn btn-pass"
                onClick={() => handleAction('pass')}
                disabled={actionBusy}
              >
                <X size={26} strokeWidth={3} />
              </button>
              <button
                className="action-btn btn-super"
                onClick={() => handleAction('superlike')}
                disabled={actionBusy}
              >
                <Star size={22} strokeWidth={3} fill="currentColor" />
              </button>
              <button
                className="action-btn btn-like"
                onClick={() => handleAction('like')}
                disabled={actionBusy}
              >
                <Heart size={26} strokeWidth={3} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Match Modal ── */}
      {matchData && (
        <MatchModal data={matchData} onClose={() => setMatchData(null)} />
      )}
    </div>
  );
};

export default Explore;
