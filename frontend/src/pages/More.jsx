import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Avatar } from '../components/UI';
import {
  Crown, Heart, ShoppingBag, Trophy, Gift, Bell,
  SlidersHorizontal, Settings, ShieldCheck, ChevronLeft,
} from 'lucide-react';

const More = ({ user }) => {
  const navigate = useNavigate();
  const [premium, setPremium] = useState(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!user?.telegramId) return undefined;

    Promise.allSettled([
      api.premiumStatus(user.telegramId),
      api.notifications(user.telegramId),
    ]).then(([premiumResult, notificationsResult]) => {
      if (cancelled) return;
      if (premiumResult.status === 'fulfilled') setPremium(premiumResult.value);
      if (notificationsResult.status === 'fulfilled') setUnread(Number(notificationsResult.value?.unread) || 0);
    });

    return () => { cancelled = true; };
  }, [user?.telegramId]);

  const tiles = [
    { to: '/likes-you', icon: Heart, label: 'پسندیدنت', color: 'var(--brand-primary)', bg: 'rgba(255,79,120,.15)' },
    { to: '/store', icon: ShoppingBag, label: 'فروشگاه', color: '#34C759', bg: 'rgba(52,199,89,.15)' },
    { to: '/notifications', icon: Bell, label: 'اعلان‌ها', color: '#5AC8FA', bg: 'rgba(90,200,250,.15)', badge: unread },
    { to: '/gifts', icon: Gift, label: 'هدایا', color: '#FF2D55', bg: 'rgba(255,45,85,.15)' },
    { to: '/leaderboard', icon: Trophy, label: 'برترین‌ها', color: '#FF9500', bg: 'rgba(255,149,0,.15)' },
  ];

  const listItems = [
    { to: '/filters', icon: SlidersHorizontal, label: 'فیلترهای جستجو', sub: 'سن، فاصله و ترجیحات' },
    { to: '/settings', icon: Settings, label: 'تنظیمات', sub: 'اعلان‌ها و حریم خصوصی' },
    { to: '/safety', icon: ShieldCheck, label: 'مرکز ایمنی', sub: 'امنیت، گزارش و مسدودسازی' },
  ];

  const isPremium = Boolean(premium?.isPremium);

  return (
    <div className="lp-page more-page">
      <div className="more-top"><h1>بیشتر</h1></div>

      <button type="button" className="more-profile glass-panel" onClick={() => navigate('/profile')}>
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

      <button type="button" className={`more-premium ${isPremium ? 'active' : ''}`} onClick={() => navigate('/premium')}>
        <div className="more-premium-glow" />
        <Crown size={30} color="#fff" fill={isPremium ? '#FFD700' : 'rgba(255,255,255,.3)'} />
        <div className="more-premium-text">
          <div className="more-premium-title">{isPremium ? `Vibe ${premium.tier === 'platinum' ? 'Platinum 👑' : 'Gold ✨'}` : 'ارتقا به Vibe Premium'}</div>
          <div className="more-premium-sub">{isPremium ? 'اشتراک فعال — مدیریت اشتراک' : 'امکانات بیشتر برای کشف و ارتباط'}</div>
        </div>
        <ChevronLeft size={20} color="rgba(255,255,255,.8)" />
      </button>

      <div className="more-grid">
        {tiles.map((t) => (
          <button type="button" key={t.to} className="more-tile glass-panel" onClick={() => navigate(t.to)}>
            {t.badge > 0 && <span className="more-tile-badge">{t.badge > 99 ? '99+' : t.badge}</span>}
            <div className="more-tile-icon" style={{ background: t.bg }}><t.icon size={22} color={t.color} /></div>
            <span className="more-tile-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="more-list glass-panel">
        {listItems.map((it, i) => (
          <button type="button" key={it.to} className={`more-list-item ${i < listItems.length - 1 ? 'bordered' : ''}`} onClick={() => navigate(it.to)}>
            <div className="more-list-icon"><it.icon size={19} color="var(--text-secondary)" /></div>
            <div className="more-list-text"><span>{it.label}</span><span className="more-list-sub">{it.sub}</span></div>
            <ChevronLeft size={18} color="var(--text-secondary)" />
          </button>
        ))}
      </div>

      <div className="more-version">Vibe · آدم مناسب، نه فقط یک پروفایل</div>
    </div>
  );
};

export default More;
