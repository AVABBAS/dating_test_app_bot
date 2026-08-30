import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PageHeader, Loading, useToast } from '../components/UI';
import { getTelegramData } from '../telegram';
import { Zap, Star, Flower2 } from 'lucide-react';

const tg = getTelegramData();

const BAL_META = [
  { key: 'superLikesLeft', label: 'سوپرلایک', icon: Star, color: '#00C6FF' },
  { key: 'boostsLeft', label: 'بوست', icon: Zap, color: '#FFB300' },
  { key: 'rosesLeft', label: 'رز', icon: Flower2, color: '#FF2D55' },
];

const Store = ({ user, onChange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const { showToast, ToastEl } = useToast();

  useEffect(() => {
    if (!user?.telegramId) return;
    api.store(user.telegramId).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const buy = (it) => {
    tg.showConfirm(`خرید «${it.label}» با قیمت ${it.price}$؟`, (ok) => {
      if (!ok) return;
      setBusy(it.item);
      api.purchase(user.telegramId, it.item)
        .then((r) => {
          setData((d) => ({ ...d, balances: r.balances }));
          onChange?.(r.balances);
          tg.hapticNotification('success');
          showToast(`«${it.label}» به حسابت اضافه شد ✅`);
        })
        .catch(() => showToast('خطا در خرید', 'error'))
        .finally(() => setBusy(null));
    });
  };

  if (loading) return <><PageHeader title="فروشگاه" /><Loading /></>;

  const balances = data?.balances || {};
  const items = data?.items || [];

  return (
    <div className="lp-page">
      <PageHeader title="فروشگاه" subtitle="موجودی‌ات را شارژ کن" />
      {ToastEl}

      <div className="store-balances">
        {BAL_META.map((b) => (
          <div key={b.key} className="store-bal glass-panel">
            <span className="store-bal-icon" style={{ color: b.color }}><b.icon size={20} /></span>
            <span className="store-bal-num">{balances[b.key] ?? 0}</span>
            <span className="store-bal-label">{b.label}</span>
          </div>
        ))}
      </div>

      <div className="lp-section-label">بسته‌های خرید</div>
      <div className="store-items">
        {items.map((it) => (
          <div key={it.item} className="store-item glass-panel">
            <span className="store-item-emoji">{it.emoji}</span>
            <div className="store-item-info">
              <span className="store-item-label">{it.label}</span>
              <span className="store-item-price">${it.price}</span>
            </div>
            <button className="store-buy-btn" disabled={busy === it.item} onClick={() => buy(it)}>
              {busy === it.item ? '...' : 'خرید'}
            </button>
          </div>
        ))}
      </div>

      <p className="prem-note">پرداخت نمادین است و صرفاً برای نمایش عملکرد پیاده‌سازی شده.</p>
    </div>
  );
};

export default Store;
