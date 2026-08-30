import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PageHeader, Loading, useToast } from '../components/UI';
import { getTelegramData } from '../telegram';
import { MapPin, Plane, Check, RotateCcw } from 'lucide-react';

const tg = getTelegramData();

const Passport = ({ user, onChange }) => {
  const [cities, setCities] = useState([]);
  const [active, setActive] = useState(user?.passportCity || null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { showToast, ToastEl } = useToast();

  useEffect(() => {
    api.passportCities()
      .then((d) => setCities(d.cities || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pick = (city) => {
    if (busy) return;
    setBusy(true);
    api.setPassport(user.telegramId, { city })
      .then((r) => {
        const c = r.passport?.passportCity || null;
        setActive(c);
        onChange?.({ passportCity: c });
        tg.hapticNotification('success');
        showToast(c ? `حالا در ${c} می‌گردی ✈️` : 'به موقعیت واقعی برگشتی');
      })
      .catch(() => showToast('خطا در تغییر موقعیت', 'error'))
      .finally(() => setBusy(false));
  };

  if (loading) return <><PageHeader title="پاسپورت" /><Loading /></>;

  return (
    <div className="lp-page">
      <PageHeader title="پاسپورت" subtitle="در هر شهری که خواستی بگرد" />
      {ToastEl}

      <div className="ps-hero">
        <div className="ps-hero-badge"><Plane size={34} color="#fff" /></div>
        <h1>{active ? `در حال گردش در ${active}` : 'موقعیت خود را تغییر بده'}</h1>
        <p>با پاسپورت می‌توانی افراد شهرهای دیگر را ببینی و با آن‌ها آشنا شوی؛ حتی قبل از سفر.</p>
      </div>

      <div className="ps-current">
        <div className="ps-current-row">
          <MapPin size={16} color="var(--super-like)" />
          <span>موقعیت واقعی: <b>{user?.city || 'نامشخص'}</b></span>
        </div>
        {active && (
          <button className="ps-reset" onClick={() => pick('')} disabled={busy}>
            <RotateCcw size={14} /> بازگشت به موقعیت واقعی
          </button>
        )}
      </div>

      <div className="lp-section-label">یک شهر انتخاب کن</div>
      <div className="ps-grid">
        {cities.map((c) => (
          <button
            key={c}
            className={`ps-city ${active === c ? 'active' : ''}`}
            onClick={() => pick(c)}
            disabled={busy}
          >
            <MapPin size={15} />
            {c}
            {active === c && <Check size={15} className="ps-city-check" />}
          </button>
        ))}
      </div>

      <div className="ps-note">
        <Plane size={14} color="#FFB300" /> پاسپورت یکی از امکانات ویژه Lovely Premium است.
      </div>
    </div>
  );
};

export default Passport;
