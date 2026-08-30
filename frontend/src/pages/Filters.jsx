import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PageHeader, Loading, useToast, Segmented } from '../components/UI';
import { getTelegramData } from '../telegram';
import { Users, CalendarRange, MapPin, Check, Sparkles } from 'lucide-react';

const tg = getTelegramData();

const LOOKING_FOR = [
  { value: 'men', label: '👨 آقایان' },
  { value: 'women', label: '👩 خانم‌ها' },
  { value: 'everyone', label: '💞 همه' },
];

const Filters = ({ user }) => {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { showToast, ToastEl } = useToast();

  useEffect(() => {
    if (!user?.telegramId) return;
    api.getPreferences(user.telegramId)
      .then((d) => setPrefs(d.preferences))
      .catch(() => setPrefs({ lookingFor: 'everyone', prefAgeMin: 18, prefAgeMax: 60, maxDistance: 100 }))
      .finally(() => setLoading(false));
  }, [user]);

  const patch = (p) => setPrefs((s) => ({ ...s, ...p }));

  const onMinAge = (v) => {
    const min = Number(v);
    patch({ prefAgeMin: Math.min(min, prefs.prefAgeMax) });
  };
  const onMaxAge = (v) => {
    const max = Number(v);
    patch({ prefAgeMax: Math.max(max, prefs.prefAgeMin) });
  };

  const save = () => {
    setBusy(true);
    api.setPreferences(user.telegramId, {
      lookingFor: prefs.lookingFor,
      prefAgeMin: prefs.prefAgeMin,
      prefAgeMax: prefs.prefAgeMax,
      maxDistance: prefs.maxDistance,
    })
      .then((r) => {
        setPrefs(r.preferences);
        tg.hapticNotification('success');
        showToast('فیلترها ذخیره شد ✅');
      })
      .catch(() => showToast('خطا در ذخیره‌سازی', 'error'))
      .finally(() => setBusy(false));
  };

  if (loading || !prefs) return <><PageHeader title="فیلترهای جستجو" /><Loading /></>;

  return (
    <div className="lp-page">
      <PageHeader title="فیلترهای جستجو" subtitle="مخاطبانت را دقیق‌تر پیدا کن" />
      {ToastEl}

      {/* Looking for */}
      <div className="lp-card fl-block">
        <div className="fl-label"><Users size={16} color="var(--primary-color)" /> به دنبال</div>
        <Segmented options={LOOKING_FOR} value={prefs.lookingFor} onChange={(v) => patch({ lookingFor: v })} />
      </div>

      {/* Age range */}
      <div className="lp-card fl-block">
        <div className="fl-label">
          <CalendarRange size={16} color="var(--secondary-color)" /> بازه سنی
          <span className="fl-value">{prefs.prefAgeMin} تا {prefs.prefAgeMax} سال</span>
        </div>
        <div className="fl-range-row">
          <span className="fl-range-cap">حداقل</span>
          <input type="range" min={18} max={99} value={prefs.prefAgeMin} onChange={(e) => onMinAge(e.target.value)} className="fl-range" />
          <span className="fl-range-num">{prefs.prefAgeMin}</span>
        </div>
        <div className="fl-range-row">
          <span className="fl-range-cap">حداکثر</span>
          <input type="range" min={18} max={99} value={prefs.prefAgeMax} onChange={(e) => onMaxAge(e.target.value)} className="fl-range" />
          <span className="fl-range-num">{prefs.prefAgeMax}</span>
        </div>
      </div>

      {/* Distance */}
      <div className="lp-card fl-block">
        <div className="fl-label">
          <MapPin size={16} color="var(--super-like)" /> حداکثر فاصله
          <span className="fl-value">{prefs.maxDistance} کیلومتر</span>
        </div>
        <div className="fl-range-row">
          <input type="range" min={1} max={500} value={prefs.maxDistance} onChange={(e) => patch({ maxDistance: Number(e.target.value) })} className="fl-range" />
          <span className="fl-range-num">{prefs.maxDistance}</span>
        </div>
      </div>

      <div className="fl-hint"><Sparkles size={14} color="var(--text-secondary)" /> فیلترهای دقیق‌تر با اشتراک پرمیوم در دسترس‌اند.</div>

      <button className="lp-btn lp-btn-primary fl-save" disabled={busy} onClick={save}>
        <Check size={17} /> {busy ? 'در حال ذخیره…' : 'ذخیره فیلترها'}
      </button>
    </div>
  );
};

export default Filters;
