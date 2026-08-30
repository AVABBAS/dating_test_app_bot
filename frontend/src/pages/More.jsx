import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Avatar } from '../components/UI';
import {
  Crown, Heart, Sparkles, ShoppingBag, CalendarDays, Trophy,
  Gift, Globe2, Bell, SlidersHorizontal, Settings, ShieldCheck, ChevronLeft,
} from 'lucide-react';

const More = ({ user }) => {
  const navigate = useNavigate();
  const [premium, setPremium] = useState(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.telegramId) return;
    api.premiumStatus(user.telegramId).then(setPremium).catch(() => {});
    api.notifications(user.telegramId).then((d) => setUnread(d.unread || 0)).catch(() => {});
  }, [user]);

  const tiles = [
    { to: '/likes-you', icon: Heart, label: 'پسندیدنت', color: '#FF2A7A', bg: 'rgba(255,42,122,0.15)' },
    { to: '/top-picks', icon: Sparkles, label: 'منتخب‌ها', color: '#FFB300', bg: 'rgba(255,179,0,0.15)' },
    { to: '/store', icon: ShoppingBag, label: 'فروشگاه', color: '#34C759', bg: 'rgba(52,199,89,0.15)' },
    { to: '/events', icon: CalendarDays, label: 'رویدادها', color: '#8C30F5', bg: 'rgba(140,48,245,0.15)' },
    { to: '/leaderboard', icon: Trophy, label: 'برترین‌ها', color: '#FF9500', bg: 'rgba(255,149,0,0.15)' },
    { to: '/gifts', icon: Gift, label: 'هدایا', color: '#FF2D55', bg: 'rgba(255,45,85,0.15)' },
    { to: '/passport', icon: Globe2, label: 'پاسپورت', color: '#00C6FF', bg: 'rgba(0,198,255,0.15)' },
    { to: '/notifications', icon: Bell, label: 'اعلان‌ها', color: '#5AC8FA', bg: 'rgba(90,200,250,0.15)', badge: unread },
  ];

  const listItems = [
    { to: '/filters', icon: SlidersHorizontal, label: 'فیلترهای جستجو', sub: 'سن، فاصله و ترجیحات' },
    { to: '/settings', icon: Settings, label: 'تنظیمات', sub: 'اعلان‌ها و حریم خصوصی' },
    { to: '/safety', icon: ShieldCheck, label: 'مرکز ایمنی', sub: 'نکات امنیتی و گزارش' },
  ];

  const isPremium = premium?.isPremium;

  return (
    <div className="lp-page more-page">
      <div className="more-top">
        <h1>بیشتر</h1>
      </div>

      {/* Profile mini-card */}
      <button className="more-profile glass-panel" onClick={() => navigate('/profile')}>
        <Avatar user={user} size={54} />
        <div className="more-profile-info">
          <div className="more-profile-name">
            {user?.firstName || 'پروفایل من'}
            {user?.isVerified && <span className="mp-verified">✓</span>}
          </div>
          <div className="more-profile-sub">مشاهده و ویرایش پروفایل</div>
        </div>
        <ChevronLeft size={20} color="var(--text-secondary)" />
      </button>

      {/* Premium banner */}
      <button className={`more-premium ${isPremium ? 'active' : ''}`} onClick={() => navigate('/premium')}>
        <div className="more-premium-glow" />
        <Crown size={30} color="#fff" fill={isPremium ? '#FFD700' : 'rgba(255,255,255,0.3)'} />
        <div className="more-premium-text">
          <div className="more-premium-title">
            {isPremium ? `Lovely ${premium.tier === 'platinum' ? 'Platinum 👑' : 'Gold ✨'}` : 'ارتقا به Lovely Premium'}
          </div>
          <div className="more-premium-sub">
            {isPremium ? 'اشتراک فعال — مدیریت اشتراک' : 'لایک نامحدود، دیدن پسندیدن‌ها و بیشتر'}
          </div>
        </div>
        <ChevronLeft size={20} color="rgba(255,255,255,0.8)" />
      </button>

      {/* Feature grid */}
      <div className="more-grid">
        {tiles.map((t) => (
          <button key={t.to} className="more-tile glass-panel" onClick={() => navigate(t.to)}>
            {t.badge > 0 && <span className="more-tile-badge">{t.badge > 99 ? '99+' : t.badge}</span>}
            <div className="more-tile-icon" style={{ background: t.bg }}>
              <t.icon size={22} color={t.color} />
            </div>
            <span className="more-tile-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Settings list */}
      <div className="more-list glass-panel">
        {listItems.map((it, i) => (
          <button key={it.to} className={`more-list-item ${i < listItems.length - 1 ? 'bordered' : ''}`} onClick={() => navigate(it.to)}>
            <div className="more-list-icon"><it.icon size={19} color="var(--text-secondary)" /></div>
            <div className="more-list-text">
              <span>{it.label}</span>
              <span className="more-list-sub">{it.sub}</span>
            </div>
            <ChevronLeft size={18} color="var(--text-secondary)" />
          </button>
        ))}
      </div>

      <div className="more-version">Lovely v2.0 · ساخته شده با ❤️</div>
    </div>
  );
};

export default More;
