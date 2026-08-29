import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../telegram';
import {
  Search, X, Heart, Star, MapPin,
  ShieldCheck, Zap, Filter
} from 'lucide-react';

// ── Category config ──────────────────────────────────────
const CATEGORIES = [
  { key: 'all',      label: '🌍 همه'       },
  { key: 'online',   label: '🟢 آنلاین'    },
  { key: 'new',      label: '✨ جدید'      },
  { key: 'popular',  label: '🔥 محبوب'    },
  { key: 'verified', label: '✅ تأیید‌شده' },
];

// ── Skeleton card ─────────────────────────────────────────
const SkeletonCard = () => (
  <div className="ex-card ex-skeleton">
    <div className="ex-skeleton-img" />
    <div className="ex-skeleton-info">
      <div className="ex-skeleton-line wide" />
      <div className="ex-skeleton-line" />
    </div>
  </div>
);

// ── Profile detail modal ──────────────────────────────────
const ProfileModal = ({ profile, onClose, onLike, onSuperLike }) => {
  if (!profile) return null;
  return (
    <div className="ex-modal-overlay" onClick={onClose}>
      <div className="ex-modal" onClick={e => e.stopPropagation()}>
        <button className="ex-modal-close" onClick={onClose}><X size={20} /></button>

        <div className="ex-modal-photo-wrap">
          <img
            src={profile.photoUrl}
            alt={profile.firstName}
            className="ex-modal-photo"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop'; }}
          />
          <div className="ex-modal-photo-grad" />
          <div className="ex-modal-badges">
            {profile.isOnline && <span className="ex-badge-online">🟢 آنلاین</span>}
            {profile.isBoosted && <span className="ex-badge-boost"><Zap size={11} /> بوست</span>}
          </div>
        </div>

        <div className="ex-modal-info">
          <div className="ex-modal-name-row">
            <h2>{profile.firstName || 'کاربر'}, {profile.age}</h2>
            {profile.isVerified && <ShieldCheck size={20} color="#00C6FF" />}
          </div>

          <div className="ex-modal-meta">
            {profile.gender && (
              <span className="ex-modal-chip">
                {profile.gender === 'male' ? '👨 مرد' : profile.gender === 'female' ? '👩 زن' : '🌈 سایر'}
              </span>
            )}
            <span className="ex-modal-chip"><MapPin size={12} /> {profile.distance ? `${profile.distance} کیلومتر` : 'نامشخص'}</span>
          </div>

          {profile.bio && <p className="ex-modal-bio">{profile.bio}</p>}

          {profile.interests && profile.interests.length > 0 && (
            <div className="ex-modal-tags">
              {profile.interests.map((t, i) => <span key={i} className="card-tag">{t}</span>)}
            </div>
          )}

          <div className="ex-modal-actions">
            <button className="ex-modal-btn ex-modal-pass" onClick={onClose}><X size={22} /></button>
            <button className="ex-modal-btn ex-modal-super" onClick={() => { onSuperLike(profile); onClose(); }}><Star size={22} /></button>
            <button className="ex-modal-btn ex-modal-like" onClick={() => { onLike(profile); onClose(); }}><Heart size={22} fill="white" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Filter Drawer ─────────────────────────────────────────
const FilterDrawer = ({ filters, onChange, onClose }) => (
  <div className="ex-filter-overlay" onClick={onClose}>
    <div className="ex-filter-drawer" onClick={e => e.stopPropagation()}>
      <div className="ex-filter-header">
        <h3>فیلترها</h3>
        <button className="ex-filter-close" onClick={onClose}><X size={20} /></button>
      </div>

      <div className="ex-filter-section">
        <label>محدوده سنی</label>
        <div className="ex-filter-range-row">
          <span>{filters.ageMin}</span>
          <input type="range" min="18" max="60" value={filters.ageMin}
            onChange={e => onChange({ ...filters, ageMin: +e.target.value })} />
          <span>تا</span>
          <input type="range" min="18" max="80" value={filters.ageMax}
            onChange={e => onChange({ ...filters, ageMax: +e.target.value })} />
          <span>{filters.ageMax} سال</span>
        </div>
      </div>

      <div className="ex-filter-section">
        <label>جنسیت</label>
        <div className="gender-options">
          {[{ v: 'all', l: '👥 همه' }, { v: 'male', l: '👨 مرد' }, { v: 'female', l: '👩 زن' }].map(o => (
            <button key={o.v}
              className={`gender-opt ${filters.gender === o.v ? 'active' : ''}`}
              onClick={() => onChange({ ...filters, gender: o.v })}
            >{o.l}</button>
          ))}
        </div>
      </div>

      <button className="ex-filter-apply" onClick={onClose}>اعمال فیلتر ✓</button>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────
const Explore = ({ user }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  const [filters, setFilters] = useState({ ageMin: 18, ageMax: 60, gender: 'all' });
  const [toastMsg, setToastMsg] = useState(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const telegramId = user?.telegramId || 123;
      const res = await axios.get(`${API_URL}/explore/${telegramId}`, {
        params: { category: activeCategory }
      });
      setProfiles(res.data || []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [user, activeCategory]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleLike = async (profile, action = 'like') => {
    if (!user?.telegramId || likedIds.has(profile.id)) return;
    setLikedIds(prev => new Set([...prev, profile.id]));
    showToast(action === 'superlike' ? `⭐ سوپر لایک برای ${profile.firstName}!` : `❤️ ${profile.firstName} رو پسندیدی!`);
    try {
      await axios.post(`${API_URL}/action`, {
        fromTelegramId: user.telegramId,
        toUserId: profile.id,
        action,
      });
    } catch { /* silent */ }
  };

  const filtered = profiles.filter(p => {
    const q = searchQuery.toLowerCase();
    const nameMatch = !q || (p.firstName || '').toLowerCase().includes(q) || (p.bio || '').toLowerCase().includes(q);
    const ageMatch = (!p.age) || (p.age >= filters.ageMin && p.age <= filters.ageMax);
    const genderMatch = filters.gender === 'all' || p.gender === filters.gender;
    return nameMatch && ageMatch && genderMatch;
  });

  const onlineCount = profiles.filter(p => p.isOnline).length;

  return (
    <div className="explore-page">

      {toastMsg && <div className="ex-toast">{toastMsg}</div>}

      {/* Header */}
      <div className="ex-header">
        <div className="ex-header-top">
          <h1 className="ex-title">
            کشف کن
            {profiles.length > 0 && <span className="ex-title-count">{profiles.length}</span>}
          </h1>
          <div className="ex-header-right">
            {onlineCount > 0 && (
              <span className="ex-online-count">
                <span className="ex-online-dot" />
                {onlineCount} آنلاین
              </span>
            )}
            <button className="ex-filter-btn" onClick={() => setShowFilter(true)}>
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="ex-search-bar">
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            className="ex-search-input"
            placeholder="جستجوی اسم یا بیو..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="ex-search-clear" onClick={() => setSearchQuery('')}><X size={14} /></button>
          )}
        </div>

        {/* Category tabs */}
        <div className="categories-scroll">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`category-chip ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="explore-grid">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ex-empty">
          <div className="ex-empty-icon">🔍</div>
          <h3>نتیجه‌ای پیدا نشد</h3>
          <p>فیلترها را تغییر بده یا دسته‌بندی دیگری را امتحان کن</p>
          <button className="ex-empty-btn" onClick={() => { setSearchQuery(''); setActiveCategory('all'); setFilters({ ageMin: 18, ageMax: 60, gender: 'all' }); }}>
            نمایش همه
          </button>
        </div>
      ) : (
        <div className="explore-grid">
          {filtered.map(profile => (
            <div
              key={profile.id}
              className={`explore-card ${likedIds.has(profile.id) ? 'ex-card-liked' : ''}`}
              onClick={() => setSelectedProfile(profile)}
            >
              <img
                src={profile.photoUrl}
                alt={profile.firstName}
                className="explore-img"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'; }}
              />

              <div className="ex-card-badges">
                {profile.isBoosted && <span className="ex-badge-boost-sm"><Zap size={10} /></span>}
                {profile.isOnline && <span className="ex-card-online-dot" />}
              </div>

              {likedIds.has(profile.id) && (
                <div className="ex-liked-overlay">
                  <Heart size={32} fill="white" color="white" />
                </div>
              )}

              <div className="explore-info">
                <div className="explore-name">
                  {profile.firstName || 'کاربر'}{profile.age ? `, ${profile.age}` : ''}
                  {profile.isVerified && <ShieldCheck size={13} color="#00C6FF" />}
                </div>
                {profile.bio && <div className="ex-card-bio">{profile.bio}</div>}
              </div>

              <button
                className={`ex-quick-like ${likedIds.has(profile.id) ? 'liked' : ''}`}
                onClick={e => { e.stopPropagation(); handleLike(profile); }}
              >
                <Heart size={16} fill={likedIds.has(profile.id) ? 'white' : 'none'} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showFilter && (
        <FilterDrawer filters={filters} onChange={setFilters} onClose={() => setShowFilter(false)} />
      )}

      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onLike={p => handleLike(p, 'like')}
          onSuperLike={p => handleLike(p, 'superlike')}
        />
      )}
    </div>
  );
};

export default Explore;
