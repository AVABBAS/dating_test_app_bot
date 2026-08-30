import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PageHeader, Loading, EmptyState, Avatar } from '../components/UI';
import { Gift } from 'lucide-react';

export const GIFT_META = {
  rose:    { emoji: '🌹', label: 'رز' },
  heart:   { emoji: '❤️', label: 'قلب' },
  diamond: { emoji: '💎', label: 'الماس' },
  crown:   { emoji: '👑', label: 'تاج' },
  teddy:   { emoji: '🧸', label: 'خرس' },
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'همین حالا';
  if (s < 3600) return `${Math.floor(s / 60)} دقیقه پیش`;
  if (s < 86400) return `${Math.floor(s / 3600)} ساعت پیش`;
  return `${Math.floor(s / 86400)} روز پیش`;
};

const Gifts = ({ user }) => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.telegramId) return;
    api.gifts(user.telegramId)
      .then((d) => setGifts(d.gifts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <><PageHeader title="هدیه‌ها" /><Loading /></>;

  return (
    <div className="lp-page">
      <PageHeader title="هدیه‌ها" subtitle={gifts.length ? `${gifts.length} هدیه دریافت‌شده` : 'هدیه‌های دریافتی تو'} />

      {gifts.length === 0 ? (
        <EmptyState
          icon={<Gift size={40} color="var(--primary-color)" />}
          title="هنوز هدیه‌ای نگرفتی"
          sub="وقتی کسی برایت هدیه بفرستد، اینجا نمایش داده می‌شود."
        />
      ) : (
        <div className="gf-list">
          {gifts.map((g) => {
            const meta = GIFT_META[g.type] || GIFT_META.heart;
            return (
              <div key={g.id} className="gf-card glass-panel">
                <div className="gf-emoji">{meta.emoji}</div>
                <div className="gf-body">
                  <div className="gf-top">
                    <Avatar user={g.fromUser} size={34} />
                    <span className="gf-name">{g.fromUser?.firstName || 'کاربر'}</span>
                    <span className="gf-time">{timeAgo(g.createdAt)}</span>
                  </div>
                  <div className="gf-label">یک <b>{meta.label}</b> برایت فرستاد</div>
                  {g.message && <div className="gf-msg">«{g.message}»</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Gifts;
