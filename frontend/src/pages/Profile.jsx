import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../telegram';
import { api } from '../api';
import {
  Edit3, Check, X, Camera, Heart, Star, Users,
  ChevronLeft, Bell, Shield, LogOut, Trash2, MessageSquareQuote,
  MapPin, Zap, ShieldCheck, Settings, Info, SlidersHorizontal, Crown, BadgeCheck
} from 'lucide-react';

const INTERESTS_LIST = [
  '🎵 موسیقی', '🎬 فیلم', '✈️ سفر', '📚 کتاب', '🏋️ ورزش',
  '🎨 هنر', '🍳 آشپزی', '📸 عکاسی', '🎮 بازی', '🧘 یوگا',
  '⚽ فوتبال', '🐱 حیوانات', '☕ قهوه', '🏔️ طبیعت', '💻 تکنولوژی', '🎭 تئاتر'
];

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({ likes: 0, superLikes: 0, matches: 0 });
  const [prompts, setPrompts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'settings'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData(user);
      setEditForm({
        photoUrl: user.photoUrl || '',
        firstName: user.firstName || '',
        age: user.age || '',
        gender: user.gender || '',
        bio: user.bio || '',
        interests: user.interests || [],
        lookingFor: user.lookingFor || 'everyone',
      });
      fetchStats();
      if (user.telegramId) api.getPrompts(user.telegramId).then((d) => setPrompts(d.prompts || [])).catch(() => {});
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user?.telegramId) return;
    try {
      const [likesRes, matchesRes] = await Promise.all([
        axios.get(`${API_URL}/likes-count/${user.telegramId}`),
        axios.get(`${API_URL}/matches/${user.telegramId}`),
      ]);
      setStats({
        likes: likesRes.data.likes || 0,
        superLikes: likesRes.data.superLikes || 0,
        matches: matchesRes.data.length || 0,
      });
    } catch { /* silent */ }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleBoost = async () => {
    if (!user?.telegramId) return;
    try {
      await axios.post(`${API_URL}/boost/${user.telegramId}`);
      showToast('⚡ بوست فعال شد! ۳۰ دقیقه در صدر نتایج هستی');
    } catch {
      showToast('خطا در فعال‌سازی بوست', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.telegramId) return;
    try {
      await axios.delete(`${API_URL}/user/${user.telegramId}`);
      // Clear local state and reload
      setShowDeleteConfirm(false);
      showToast('اکانت حذف شد');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      showToast('خطا در حذف اکانت', 'error');
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API_URL}/user/${user.telegramId}`, {
        photoUrl: editForm.photoUrl,
        age: editForm.age,
        gender: editForm.gender,
        bio: editForm.bio,
        interests: editForm.interests,
        lookingFor: editForm.lookingFor,
        firstName: editForm.firstName,
      });
      setProfileData(res.data);
      setIsEditing(false);
      showToast('پروفایل ذخیره شد ✓');
    } catch {
      showToast('خطا در ذخیره‌سازی', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (tag) => {
    if (editForm.interests.includes(tag)) {
      setEditForm({ ...editForm, interests: editForm.interests.filter(i => i !== tag) });
    } else if (editForm.interests.length < 5) {
      setEditForm({ ...editForm, interests: [...editForm.interests, tag] });
    }
  };

  const displayData = isEditing ? editForm : profileData;
  const photo = displayData?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop';

  if (!profileData) {
    return (
      <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Heart size={40} color="var(--primary-color)" style={{ animation: 'pulse 1s infinite alternate' }} />
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* ── Toast ── */}
      {toast && (
        <div className={`pf-toast ${toast.type}`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── Cover Photo ── */}
      <div className="profile-header">
        <img src={photo} alt="Cover" className="profile-cover" onError={e => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop'; }} />
        <div className="profile-cover-gradient" />

        {/* Edit / Save / Cancel buttons */}
        <div className="pf-header-actions">
          {isEditing ? (
            <>
              <button className="pf-hdr-btn pf-cancel-btn" onClick={() => { setIsEditing(false); setEditForm({ photoUrl: profileData.photoUrl || '', firstName: profileData.firstName || '', age: profileData.age || '', gender: profileData.gender || '', bio: profileData.bio || '', interests: profileData.interests || [], lookingFor: profileData.lookingFor || 'everyone' }); }}>
                <X size={18} /> لغو
              </button>
              <button className="pf-hdr-btn pf-save-btn" onClick={saveProfile} disabled={saving}>
                {saving ? '...' : <><Check size={18} /> ذخیره</>}
              </button>
            </>
          ) : (
            <button className="pf-hdr-btn pf-edit-btn" onClick={() => setIsEditing(true)}>
              <Edit3 size={18} /> ویرایش
            </button>
          )}
        </div>
      </div>

      {/* ── Profile Details ── */}
      <div className="profile-details">

        {/* Name & Age */}
        {isEditing ? (
          <div className="pf-edit-name-row">
            <input
              className="pf-edit-input pf-name-input"
              value={editForm.firstName}
              onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
              placeholder="اسم"
            />
            <input
              className="pf-edit-input pf-age-input"
              type="number"
              value={editForm.age}
              onChange={e => setEditForm({ ...editForm, age: e.target.value })}
              placeholder="سن"
              min="18" max="80"
            />
          </div>
        ) : (
          <div className="profile-name-age">
            <h1>{profileData.firstName || 'کاربر'}</h1>
            <span>{profileData.age}</span>
            {profileData.isVerified && <BadgeCheck size={22} color="#00C6FF" style={{ marginRight: 2 }} />}
            {profileData.gender && <span className="pf-gender-badge">{profileData.gender === 'male' ? '👨' : profileData.gender === 'female' ? '👩' : '🌈'}</span>}
          </div>
        )}

        {/* Photo URL edit */}
        {isEditing && (
          <div className="pf-photo-edit">
            <Camera size={14} color="var(--text-secondary)" />
            <input
              className="pf-edit-input"
              value={editForm.photoUrl}
              onChange={e => setEditForm({ ...editForm, photoUrl: e.target.value })}
              placeholder="آدرس عکس پروفایل (URL)..."
              style={{ flex: 1 }}
            />
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="pf-tabs">
          <button className={`pf-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <Info size={15} /> پروفایل
          </button>
          <button className={`pf-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={15} /> تنظیمات
          </button>
        </div>

        {/* ══════ PROFILE TAB ══════ */}
        {activeTab === 'profile' && (
          <>
            {/* Stats */}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{stats.likes}</span>
                <span className="stat-label">❤️ لایک</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{stats.superLikes}</span>
                <span className="stat-label">⭐ سوپر</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{stats.matches}</span>
                <span className="stat-label">💞 مچ</span>
              </div>
            </div>

            {/* Bio */}
            <div className="profile-section">
              <h3>درباره من</h3>
              {isEditing ? (
                <textarea
                  className="pf-edit-textarea"
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="درباره خودت بنویس..."
                  rows={3}
                />
              ) : (
                <p>{profileData.bio || 'هنوز بیو‌ای ننوشتی. ویرایش کن و خودت رو معرفی کن!'}</p>
              )}
            </div>

            {/* Looking For */}
            {isEditing && (
              <div className="profile-section">
                <h3>دنبال</h3>
                <div className="gender-options">
                  {[{ v: 'men', l: '👨 مرد' }, { v: 'women', l: '👩 زن' }, { v: 'everyone', l: '💞 همه' }].map(o => (
                    <button key={o.v} className={`gender-opt ${editForm.lookingFor === o.v ? 'active' : ''}`} onClick={() => setEditForm({ ...editForm, lookingFor: o.v })}>{o.l}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            <div className="profile-section">
              <h3>علاقه‌مندی‌ها {isEditing && <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>(حداکثر ۵)</span>}</h3>
              {isEditing ? (
                <div className="tags-container">
                  {INTERESTS_LIST.map(tag => (
                    <div
                      key={tag}
                      className={`tag ${editForm.interests.includes(tag) ? 'selected' : ''}`}
                      onClick={() => toggleInterest(tag)}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tags-container">
                  {(profileData.interests || []).length > 0
                    ? profileData.interests.map(tag => <div key={tag} className="tag selected">{tag}</div>)
                    : <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>هنوز علاقه‌مندی انتخاب نکردی.</p>
                  }
                </div>
              )}
            </div>

            {/* Prompts */}
            {!isEditing && (
              <div className="profile-section">
                <h3 style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquareQuote size={17} /> پرامپت‌ها</span>
                  <button className="pf-inline-link" onClick={() => navigate('/prompts')}>
                    {prompts.length ? 'ویرایش' : 'افزودن'}
                  </button>
                </h3>
                {prompts.length > 0 ? (
                  <div className="pf-prompts">
                    {prompts.map((p) => (
                      <div key={p.id} className="pf-prompt-card">
                        <span className="pf-prompt-q">{p.question}</span>
                        <span className="pf-prompt-a">{p.answer}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>با پاسخ به چند سؤال کوتاه، پروفایلت را جذاب‌تر کن.</p>
                )}
              </div>
            )}

            {/* Boost Card */}
            {!isEditing && (
              <div className="pf-boost-card">
                <div className="pf-boost-left">
                  <Zap size={24} color="#8C30F5" fill="#8C30F5" />
                  <div>
                    <div className="pf-boost-title">بوست پروفایل</div>
                    <div className="pf-boost-sub">۳۰ دقیقه در صدر نتایج باش</div>
                  </div>
                </div>
                <button className="pf-boost-btn" onClick={handleBoost}>فعال‌سازی</button>
              </div>
            )}
          </>
        )}

        {/* ══════ SETTINGS TAB ══════ */}
        {activeTab === 'settings' && (
          <div className="pf-settings">

            <div className="pf-settings-group">
              <div className="pf-settings-label">پروفایل</div>
              <div className="pf-settings-item" onClick={() => navigate('/verification')}>
                <div className="pf-settings-icon" style={{ background: 'rgba(0,198,255,0.15)' }}>
                  <ShieldCheck size={18} color="#00C6FF" />
                </div>
                <div className="pf-settings-text">
                  <span>تأیید هویت</span>
                  <span className="pf-settings-sub">{profileData.isVerified ? 'تأیید شده ✓' : 'نشان آبی اعتماد بگیر'}</span>
                </div>
                <ChevronLeft size={18} color="var(--text-secondary)" />
              </div>
              <div className="pf-settings-item" onClick={() => navigate('/prompts')}>
                <div className="pf-settings-icon" style={{ background: 'rgba(255,42,122,0.15)' }}>
                  <MessageSquareQuote size={18} color="var(--primary-color)" />
                </div>
                <div className="pf-settings-text">
                  <span>پرامپت‌های پروفایل</span>
                  <span className="pf-settings-sub">سؤال‌های یخ‌شکن را پاسخ بده</span>
                </div>
                <ChevronLeft size={18} color="var(--text-secondary)" />
              </div>
              <div className="pf-settings-item" onClick={() => navigate('/premium')}>
                <div className="pf-settings-icon" style={{ background: 'rgba(255,179,0,0.15)' }}>
                  <Crown size={18} color="#FFB300" />
                </div>
                <div className="pf-settings-text">
                  <span>Lovely Premium</span>
                  <span className="pf-settings-sub">{profileData.isPremium ? 'اشتراک فعال' : 'ارتقای حساب'}</span>
                </div>
                <ChevronLeft size={18} color="var(--text-secondary)" />
              </div>
            </div>

            <div className="pf-settings-group">
              <div className="pf-settings-label">کشف</div>
              <div className="pf-settings-item" onClick={() => navigate('/filters')}>
                <div className="pf-settings-icon" style={{ background: 'rgba(140,48,245,0.15)' }}>
                  <SlidersHorizontal size={18} color="#8C30F5" />
                </div>
                <div className="pf-settings-text">
                  <span>فیلترهای جستجو</span>
                  <span className="pf-settings-sub">سن، فاصله و ترجیحات</span>
                </div>
                <ChevronLeft size={18} color="var(--text-secondary)" />
              </div>
              <div className="pf-settings-item" onClick={() => navigate('/passport')}>
                <div className="pf-settings-icon" style={{ background: 'rgba(0,198,255,0.15)' }}>
                  <MapPin size={18} color="#00C6FF" />
                </div>
                <div className="pf-settings-text">
                  <span>پاسپورت</span>
                  <span className="pf-settings-sub">در شهرهای دیگر جستجو کن</span>
                </div>
                <ChevronLeft size={18} color="var(--text-secondary)" />
              </div>
            </div>

            <div className="pf-settings-group">
              <div className="pf-settings-label">تنظیمات</div>
              <div className="pf-settings-item" onClick={() => navigate('/settings')}>
                <div className="pf-settings-icon" style={{ background: 'rgba(255,179,0,0.15)' }}>
                  <Bell size={18} color="#FFB300" />
                </div>
                <div className="pf-settings-text">
                  <span>اعلان‌ها و حریم خصوصی</span>
                  <span className="pf-settings-sub">مدیریت اعلان‌ها و حالت ناپیدا</span>
                </div>
                <ChevronLeft size={18} color="var(--text-secondary)" />
              </div>
              <div className="pf-settings-item" onClick={() => navigate('/safety')}>
                <div className="pf-settings-icon" style={{ background: 'rgba(52,199,89,0.15)' }}>
                  <Shield size={18} color="#34C759" />
                </div>
                <div className="pf-settings-text">
                  <span>مرکز ایمنی</span>
                  <span className="pf-settings-sub">نکات امنیتی و پشتیبانی</span>
                </div>
                <ChevronLeft size={18} color="var(--text-secondary)" />
              </div>
            </div>

            <div className="pf-settings-group">
              <div className="pf-settings-label">سایر</div>
              <div className="pf-settings-item" onClick={() => setShowDeleteConfirm(true)}>
                <div className="pf-settings-icon" style={{ background: 'rgba(255,59,48,0.15)' }}>
                  <Trash2 size={18} color="var(--danger)" />
                </div>
                <div className="pf-settings-text">
                  <span style={{ color: 'var(--danger)' }}>حذف اکانت</span>
                  <span className="pf-settings-sub">این کار برگشت‌ناپذیر است</span>
                </div>
                <ChevronLeft size={18} color="var(--text-secondary)" />
              </div>
            </div>

            <div className="pf-app-version">Lovely v2.0 · ساخته شده با ❤️</div>
          </div>
        )}
      </div>

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && (
        <div className="pf-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3>حذف اکانت</h3>
            <p>آیا مطمئنی؟ تمام مچ‌ها و پیام‌هایت حذف خواهند شد.</p>
            <div className="pf-modal-btns">
              <button className="pf-modal-cancel" onClick={() => setShowDeleteConfirm(false)}>لغو</button>
              <button className="pf-modal-confirm" onClick={handleDeleteAccount}>بله، حذف کن</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
