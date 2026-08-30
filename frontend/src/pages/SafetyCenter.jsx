import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PageHeader, Loading } from '../components/UI';
import { Shield, MapPin, Lock, Eye, Flag, Ban, Phone, AlertTriangle, Heart } from 'lucide-react';

const TIPS = [
  { icon: <MapPin size={18} color="#34C759" />, bg: 'rgba(52,199,89,0.15)', title: 'در مکان عمومی قرار بگذار', sub: 'برای اولین ملاقات‌ها همیشه جای شلوغ و عمومی را انتخاب کن.' },
  { icon: <Lock size={18} color="#FFB300" />, bg: 'rgba(255,179,0,0.15)', title: 'اطلاعات شخصی‌ات را حفظ کن', sub: 'آدرس خانه، محل کار یا اطلاعات بانکی را با غریبه‌ها به اشتراک نگذار.' },
  { icon: <Eye size={18} color="var(--super-like)" />, bg: 'rgba(0,198,255,0.15)', title: 'به حسّت اعتماد کن', sub: 'اگر چیزی درست به نظر نمی‌رسد، گفتگو را متوقف کن و گزارش بده.' },
  { icon: <Heart size={18} color="var(--primary-color)" />, bg: 'rgba(255,42,122,0.15)', title: 'با سرعت خودت پیش برو', sub: 'هیچ اجباری برای اشتراک‌گذاری یا ملاقات وجود ندارد. مرزهایت را حفظ کن.' },
];

const SafetyCenter = ({ user }) => {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.reportReasons()
      .then((d) => setReasons(d.reasons || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <><PageHeader title="مرکز ایمنی" /><Loading /></>;

  return (
    <div className="lp-page">
      <PageHeader title="مرکز ایمنی" subtitle="امنیت تو اولویت ماست" />

      {/* Hero */}
      <div className="sc-hero">
        <div className="sc-hero-badge"><Shield size={40} color="#fff" /></div>
        <h1>با خیال راحت آشنا شو</h1>
        <p>Lovely متعهد است فضایی امن بسازد. این نکات به تو کمک می‌کنند تجربه‌ای بی‌دغدغه داشته باشی.</p>
      </div>

      {/* Safety tips */}
      <div className="lp-section-label">نکات ایمنی</div>
      <div className="sc-tips">
        {TIPS.map((t, i) => (
          <div key={i} className="sc-tip">
            <div className="sc-tip-icon" style={{ background: t.bg }}>{t.icon}</div>
            <div className="sc-tip-text">
              <span>{t.title}</span>
              <span className="sc-tip-sub">{t.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Report & block explainer */}
      <div className="lp-section-label">گزارش و مسدودسازی</div>
      <div className="lp-card sc-tools">
        <div className="sc-tool">
          <div className="sc-tool-icon" style={{ background: 'rgba(255,179,0,0.15)' }}><Flag size={18} color="#FFB300" /></div>
          <div className="sc-tip-text">
            <span>گزارش تخلف</span>
            <span className="sc-tip-sub">از منوی هر پروفایل یا گفتگو می‌توانی رفتار نامناسب را گزارش کنی.</span>
          </div>
        </div>
        <div className="sc-tool">
          <div className="sc-tool-icon" style={{ background: 'rgba(255,59,48,0.15)' }}><Ban size={18} color="var(--danger)" /></div>
          <div className="sc-tip-text">
            <span>مسدودسازی کاربر</span>
            <span className="sc-tip-sub">با مسدود کردن، مچ و پیام‌های شما حذف و کاربر دیگر به تو نمایش داده نمی‌شود.</span>
          </div>
        </div>
      </div>

      {/* Reportable reasons */}
      <div className="lp-card sc-reasons">
        <div className="sc-reasons-title"><AlertTriangle size={15} color="var(--text-secondary)" /> چه مواردی قابل گزارش هستند؟</div>
        <div className="sc-reason-chips">
          {reasons.map((r) => (
            <span key={r.id} className="sc-reason-chip">{r.label}</span>
          ))}
        </div>
      </div>

      {/* Emergency */}
      <div className="sc-emergency">
        <Phone size={18} color="#fff" />
        <div>
          <b>در شرایط اضطراری</b>
          <span>اگر در خطر فوری هستی، بی‌درنگ با اورژانس ۱۱۰ تماس بگیر.</span>
        </div>
      </div>
    </div>
  );
};

export default SafetyCenter;
