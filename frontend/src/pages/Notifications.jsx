import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PageHeader, Loading, EmptyState } from '../components/UI';
import { Bell, Heart, Star, MessageCircle, Gift, CalendarDays, CheckCheck } from 'lucide-react';

const TYPE_META = {
  match:     { icon: Heart,         color: '#FF2A7A', bg: 'rgba(255,42,122,0.15)' },
  like:      { icon: Heart,         color: '#FF6FA5', bg: 'rgba(255,42,122,0.12)' },
  superlike: { icon: Star,          color: '#00C6FF', bg: 'rgba(0,198,255,0.15)' },
  message:   { icon: MessageCircle, color: '#34C759', bg: 'rgba(52,199,89,0.15)' },
  gift:      { icon: Gift,          color: '#FFB300', bg: 'rgba(255,179,0,0.15)' },
  event:     { icon: CalendarDays,  color: '#8C30F5', bg: 'rgba(140,48,245,0.15)' },
  system:    { icon: Bell,          color: '#9090A5', bg: 'rgba(255,255,255,0.08)' },
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'همین حالا';
  if (s < 3600) return `${Math.floor(s / 60)} دقیقه پیش`;
  if (s < 86400) return `${Math.floor(s / 3600)} ساعت پیش`;
  return `${Math.floor(s / 86400)} روز پیش`;
};

const Notifications = ({ user }) => {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.telegramId) return;
    api.notifications(user.telegramId)
      .then((d) => { setItems(d.notifications || []); setUnread(d.unread || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const markAll = () => {
    if (!unread) return;
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnread(0);
    api.readNotifications(user.telegramId).catch(() => {});
  };

  if (loading) return <><PageHeader title="اعلان‌ها" /><Loading /></>;

  return (
    <div className="lp-page">
      <PageHeader
        title="اعلان‌ها"
        subtitle={unread ? `${unread} اعلان خوانده‌نشده` : 'همه‌چیز به‌روز است'}
        right={unread ? <button className="nt-markall" onClick={markAll}><CheckCheck size={18} /></button> : null}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell size={40} color="var(--primary-color)" />}
          title="اعلانی نداری"
          sub="وقتی اتفاق تازه‌ای بیفتد، اینجا می‌بینی."
        />
      ) : (
        <div className="nt-list">
          {items.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.system;
            const Icon = meta.icon;
            return (
              <div key={n.id} className={`nt-row ${n.read ? '' : 'unread'}`}>
                <div className="nt-icon" style={{ background: meta.bg }}>
                  <Icon size={18} color={meta.color} fill={n.type === 'match' || n.type === 'like' ? meta.color : 'none'} />
                </div>
                <div className="nt-text">
                  <span className="nt-title">{n.title}</span>
                  {n.body && <span className="nt-body">{n.body}</span>}
                  <span className="nt-time">{timeAgo(n.createdAt)}</span>
                </div>
                {!n.read && <span className="nt-dot" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
