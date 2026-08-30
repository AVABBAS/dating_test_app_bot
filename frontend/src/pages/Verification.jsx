import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { PageHeader, Loading, useToast } from '../components/UI';
import { getTelegramData } from '../telegram';
import { BadgeCheck, ShieldCheck, Camera, Clock, Sparkles } from 'lucide-react';

const tg = getTelegramData();

const Verification = ({ user, onChange }) => {
  const [status, setStatus] = useState(null); // { isVerified, status }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { showToast, ToastEl } = useToast();
  const poll = useRef(null);

  const load = () => {
    if (!user?.telegramId) return;
    api.verificationStatus(user.telegramId).then(setStatus).catch(() => {});
  };
  useEffect(() => {
    load();
    setLoading(false);
    return () => clearInterval(poll.current);
  }, [user]);

  const request = () => {
    setBusy(true);
    api.requestVerification(user.telegramId)
      .then(() => {
        setStatus({ isVerified: false, status: 'pending' });
        tg.hapticNotification('success');
        showToast('درخواست ثبت شد؛ در حال بررسی…');
        // Backend demo auto-approves after ~8s — poll to reflect it.
        poll.current = setInterval(() => {
          api.verificationStatus(user.telegramId).then((s) => {
            setStatus(s);
            if (s.isVerified) {
              clearInterval(poll.current);
              onChange?.({ isVerified: true, verificationStatus: 'approved' });
              tg.hapticNotification('success');
              showToast('پروفایلت تأیید شد ✅');
            }
          }).catch(() => {});
        }, 3000);
      })
      .catch(() => showToast('خطا در ارسال درخواست', 'error'))
      .finally(() => setBusy(false));
  };

  if (loading) return <><PageHeader title="تأیید هویت" /><Loading /></>;

  const st = status?.status || 'none';
  const verified = status?.isVerified;

  return (
    <div className="lp-page">
      <PageHeader title="تأیید هویت" subtitle="نشان آبی اعتماد بگیر" />
      {ToastEl}

      <div className={`vf-hero ${verified ? 'done' : ''}`}>
        <div className="vf-badge-big">
          <BadgeCheck size={48} color="#fff" fill={verified ? '#00C6FF' : 'rgba(255,255,255,0.2)'} />
        </div>
        <h1>
          {verified ? 'پروفایل تأییدشده' : st === 'pending' ? 'در حال بررسی…' : 'پروفایلت را تأیید کن'}
        </h1>
        <p>
          {verified
            ? 'نشان تأیید آبی کنار نامت نمایش داده می‌شود و اعتماد دیگران را جلب می‌کند.'
            : st === 'pending'
            ? 'درخواست تو ثبت شد و به‌زودی نتیجه‌اش اعلام می‌شود.'
            : 'با تأیید هویت، پروفایلت معتبرتر دیده می‌شود و شانس مچ شدنت بالا می‌رود.'}
        </p>
      </div>

      {!verified && (
        <div className="vf-steps">
          <div className="vf-step"><span className="vf-step-num"><Camera size={16} /></span><div><b>عکس سلفی</b><span>یک سلفی مطابق ژست نمونه بگیر</span></div></div>
          <div className="vf-step"><span className="vf-step-num"><ShieldCheck size={16} /></span><div><b>بررسی</b><span>تیم ما (به‌صورت خودکار) تطبیق می‌دهد</span></div></div>
          <div className="vf-step"><span className="vf-step-num"><Sparkles size={16} /></span><div><b>نشان آبی</b><span>نشان تأیید روی پروفایلت فعال می‌شود</span></div></div>
        </div>
      )}

      {verified ? (
        <div className="vf-success"><BadgeCheck size={20} color="var(--super-like)" /> هویت شما تأیید شده است</div>
      ) : st === 'pending' ? (
        <button className="lp-btn lp-btn-ghost" disabled>
          <Clock size={17} /> در انتظار تأیید…
        </button>
      ) : (
        <button className="lp-btn lp-btn-primary" disabled={busy} onClick={request}>
          <Camera size={17} /> {busy ? 'در حال ارسال…' : 'شروع تأیید هویت'}
        </button>
      )}
    </div>
  );
};

export default Verification;
