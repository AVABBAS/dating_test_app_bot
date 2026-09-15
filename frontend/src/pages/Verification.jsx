import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { PageHeader, Loading, useToast } from '../components/UI';
import { getTelegramData } from '../telegram';
import { BadgeCheck, ShieldCheck, Camera, Clock, Sparkles } from 'lucide-react';

const tg = getTelegramData();
const Verification = ({ user, onChange }) => {
  const [status, setStatus] = useState(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const { showToast, ToastEl } = useToast();
  const poll = useRef(null);
  useEffect(() => { let active = true; if (!user?.telegramId) { setLoading(false); return undefined; } api.verificationStatus(user.telegramId).then((s) => active && setStatus(s)).catch(() => {}).finally(() => active && setLoading(false)); return () => { active = false; clearInterval(poll.current); }; }, [user?.telegramId]);
  const request = () => { if (busy || !user?.telegramId) return; setBusy(true); api.requestVerification(user.telegramId).then(() => { setStatus({ isVerified: false, status: 'pending' }); tg.hapticNotification('success'); showToast('درخواست ثبت شد؛ در حال بررسی…'); clearInterval(poll.current); poll.current = setInterval(() => api.verificationStatus(user.telegramId).then((s) => { setStatus(s); if (s.isVerified) { clearInterval(poll.current); onChange?.({ isVerified: true, verificationStatus: 'verified' }); tg.hapticNotification('success'); showToast('پروفایلت تأیید شد ✅'); } }).catch(() => {}), 3000); }).catch(() => showToast('خطا در ارسال درخواست', 'error')).finally(() => setBusy(false)); };
  if (loading) return <><PageHeader title="تأیید هویت" fallback="/profile" /><Loading /></>;
  const st = status?.status || 'none', verified = Boolean(status?.isVerified);
  return <div className="lp-page"><PageHeader title="تأیید هویت" subtitle="نشان آبی اعتماد بگیر" fallback="/profile" />{ToastEl}
    <div className={`vf-hero ${verified ? 'done' : ''}`}><div className="vf-badge-big"><BadgeCheck size={48} color="#fff" fill={verified ? '#00C6FF' : 'rgba(255,255,255,0.2)'} /></div><h1>{verified ? 'پروفایل تأییدشده' : st === 'pending' ? 'در حال بررسی…' : 'پروفایلت را تأیید کن'}</h1><p>{verified ? 'نشان تأیید آبی کنار نامت نمایش داده می‌شود.' : st === 'pending' ? 'درخواست تو ثبت شد و به‌زودی نتیجه‌اش اعلام می‌شود.' : 'با تأیید هویت، پروفایلت معتبرتر دیده می‌شود.'}</p></div>
    {!verified && <div className="vf-steps"><div className="vf-step"><span className="vf-step-num"><Camera size={16} /></span><div><b>عکس سلفی</b><span>یک سلفی مطابق ژست نمونه بگیر</span></div></div><div className="vf-step"><span className="vf-step-num"><ShieldCheck size={16} /></span><div><b>بررسی</b><span>تیم ما تطبیق می‌دهد</span></div></div><div className="vf-step"><span className="vf-step-num"><Sparkles size={16} /></span><div><b>نشان آبی</b><span>نشان تأیید فعال می‌شود</span></div></div></div>}
    {verified ? <div className="vf-success"><BadgeCheck size={20} color="var(--super-like)" /> هویت شما تأیید شده است</div> : st === 'pending' ? <button type="button" className="lp-btn lp-btn-ghost" disabled><Clock size={17} /> در انتظار تأیید…</button> : <button type="button" className="lp-btn lp-btn-primary" disabled={busy} onClick={request}><Camera size={17} /> {busy ? 'در حال ارسال…' : 'شروع تأیید هویت'}</button>}
  </div>;
};
export default Verification;
