import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PageHeader, Loading, useToast } from '../components/UI';
import { getTelegramData } from '../telegram';
import { Crown, Check, Sparkles, Star, Zap, Eye, MessageCircle, RotateCcw, Heart } from 'lucide-react';

const tg = getTelegramData();

const PERK_ICONS = [Eye, Heart, Star, Zap, RotateCcw, MessageCircle, Sparkles];

const Premium = ({ user, onChange }) => {
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('platinum');
  const [busy, setBusy] = useState(false);
  const { showToast, ToastEl } = useToast();

  useEffect(() => {
    if (!user?.telegramId) return;
    Promise.all([api.premiumPlans(), api.premiumStatus(user.telegramId)])
      .then(([p, s]) => { setPlans(p.plans || []); setStatus(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const subscribe = () => {
    const plan = plans.find((p) => p.tier === selected);
    if (!plan) return;
    tg.showConfirm(`اشتراک ${plan.name} با قیمت ${plan.priceMonthly}$ در ماه فعال شود؟`, (ok) => {
      if (!ok) return;
      setBusy(true);
      api.subscribe(user.telegramId, selected)
        .then((r) => {
          setStatus({ isPremium: true, tier: r.tier, premiumUntil: r.premiumUntil });
          onChange?.({ isPremium: true, premiumTier: r.tier, premiumUntil: r.premiumUntil });
          tg.hapticNotification('success');
          showToast('اشتراک با موفقیت فعال شد 🎉');
        })
        .catch(() => showToast('خطا در فعال‌سازی اشتراک', 'error'))
        .finally(() => setBusy(false));
    });
  };

  if (loading) return <><PageHeader title="Lovely Premium" /><Loading /></>;

  const isPremium = status?.isPremium;
  const until = status?.premiumUntil ? new Date(status.premiumUntil).toLocaleDateString('fa-IR') : null;

  return (
    <div className="lp-page">
      <PageHeader title="Lovely Premium" subtitle="بیشتر ببین، بیشتر مچ شو" />
      {ToastEl}

      <div className="prem-hero">
        <div className="prem-hero-glow" />
        <Crown size={44} color="#fff" fill="#FFD700" />
        <h1>{isPremium ? 'اشتراک شما فعال است' : 'قفل تجربه‌ی کامل را باز کن'}</h1>
        {isPremium ? (
          <p>پلن فعلی: <b>{status.tier === 'platinum' ? 'Platinum 👑' : 'Gold ✨'}</b>{until && ` — تا ${until}`}</p>
        ) : (
          <p>با Premium، لایک‌های دریافتی‌ات را ببین و شانس مچ شدنت را چند برابر کن.</p>
        )}
      </div>

      <div className="prem-plans">
        {plans.map((plan) => {
          const active = selected === plan.tier;
          const owned = isPremium && status.tier === plan.tier;
          return (
            <button
              key={plan.tier}
              className={`prem-plan ${active ? 'active' : ''} ${plan.tier}`}
              onClick={() => setSelected(plan.tier)}
            >
              <div className="prem-plan-head">
                <div className="prem-plan-name">
                  <span className="prem-plan-emoji">{plan.emoji}</span>
                  {plan.name}
                </div>
                {owned && <span className="prem-owned">فعال</span>}
                <div className={`prem-radio ${active ? 'on' : ''}`}>{active && <Check size={14} />}</div>
              </div>
              <div className="prem-price">
                <span className="prem-price-num">${plan.priceMonthly}</span>
                <span className="prem-price-unit">/ ماه</span>
              </div>
              <div className="prem-perks">
                {plan.perks.map((perk, i) => {
                  const Icon = PERK_ICONS[i % PERK_ICONS.length];
                  return (
                    <div key={i} className="prem-perk">
                      <span className="prem-perk-icon"><Icon size={14} /></span>
                      {perk}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      <div className="prem-cta">
        <button className="lp-btn lp-btn-primary" onClick={subscribe} disabled={busy}>
          {busy ? 'در حال پردازش…' : isPremium ? 'تغییر / تمدید اشتراک' : `فعال‌سازی ${plans.find((p) => p.tier === selected)?.name || ''}`}
        </button>
        <p className="prem-note">پرداخت نمادین است و صرفاً برای نمایش عملکرد پیاده‌سازی شده.</p>
      </div>
    </div>
  );
};

export default Premium;
