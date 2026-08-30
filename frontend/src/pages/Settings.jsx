import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PageHeader, Loading, useToast, Toggle } from '../components/UI';
import { getTelegramData } from '../telegram';
import { Bell, Heart, MessageCircle, EyeOff, Crown, BadgeCheck } from 'lucide-react';

const tg = getTelegramData();

const Settings = ({ user }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastEl } = useToast();

  useEffect(() => {
    if (!user?.telegramId) return;
    api.getSettings(user.telegramId)
      .then((d) => setSettings(d.settings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const update = (key, val) => {
    const prev = settings;
    setSettings((s) => ({ ...s, [key]: val })); // optimistic
    tg.hapticImpact('light');
    api.setSettings(user.telegramId, { [key]: val })
      .then((r) => setSettings((s) => ({ ...s, ...r.settings })))
      .catch(() => {
        setSettings(prev); // rollback
        showToast('خطا در ذخیره تنظیمات', 'error');
      });
  };

  if (loading || !settings) return <><PageHeader title="تنظیمات" /><Loading /></>;

  const rows = [
    { group: 'اعلان‌ها', items: [
      { key: 'notifyMatches', icon: <Heart size={18} color="var(--primary-color)" />, bg: 'rgba(255,42,122,0.15)', title: 'مچ‌های جدید', sub: 'وقتی با کسی مچ می‌شوی' },
      { key: 'notifyLikes', icon: <Bell size={18} color="#FFB300" />, bg: 'rgba(255,179,0,0.15)', title: 'لایک‌ها', sub: 'وقتی کسی پروفایلت را می‌پسندد' },
      { key: 'notifyMessages', icon: <MessageCircle size={18} color="var(--super-like)" />, bg: 'rgba(0,198,255,0.15)', title: 'پیام‌ها', sub: 'وقتی پیام جدیدی می‌رسد' },
    ]},
    { group: 'حریم خصوصی', items: [
      { key: 'incognito', icon: <EyeOff size={18} color="#8C30F5" />, bg: 'rgba(140,48,245,0.15)', title: 'حالت ناپیدا', sub: 'فقط کسانی که لایک می‌کنی تو را می‌بینند' },
    ]},
  ];

  return (
    <div className="lp-page">
      <PageHeader title="اعلان‌ها و حریم خصوصی" subtitle="کنترل کامل روی حساب" />
      {ToastEl}

      {/* Account status */}
      <div className="st-account">
        <div className={`st-account-chip ${settings.isPremium ? 'active' : ''}`}>
          <Crown size={15} color={settings.isPremium ? '#FFB300' : 'var(--text-secondary)'} />
          {settings.isPremium ? `پرمیوم ${settings.premiumTier === 'platinum' ? 'پلاتینیوم' : 'طلایی'}` : 'حساب رایگان'}
        </div>
        <div className={`st-account-chip ${settings.isVerified ? 'active' : ''}`}>
          <BadgeCheck size={15} color={settings.isVerified ? '#00C6FF' : 'var(--text-secondary)'} />
          {settings.isVerified ? 'تأییدشده' : 'تأیید نشده'}
        </div>
      </div>

      {rows.map((section) => (
        <div key={section.group} className="lp-card st-group">
          <div className="lp-section-label">{section.group}</div>
          {section.items.map((it) => (
            <div key={it.key} className="st-row">
              <div className="st-row-icon" style={{ background: it.bg }}>{it.icon}</div>
              <div className="st-row-text">
                <span>{it.title}</span>
                <span className="st-row-sub">{it.sub}</span>
              </div>
              <Toggle on={!!settings[it.key]} onChange={(v) => update(it.key, v)} />
            </div>
          ))}
        </div>
      ))}

      <p className="st-foot">تغییرات به‌صورت خودکار ذخیره می‌شوند.</p>
    </div>
  );
};

export default Settings;
