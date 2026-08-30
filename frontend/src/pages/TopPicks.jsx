import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { api, API_URL } from '../api';
import { PageHeader, Loading, EmptyState, useToast, FALLBACK } from '../components/UI';
import { getTelegramData } from '../telegram';
import { Sparkles, Heart, X, Star, BadgeCheck, Flame } from 'lucide-react';

const tg = getTelegramData();

const TopPicks = ({ user }) => {
  const navigate = useNavigate();
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // detail modal
  const [acting, setActing] = useState(false);
  const { showToast, ToastEl } = useToast();

  useEffect(() => {
    if (!user?.telegramId) return;
    api.topPicks(user.telegramId)
      .then((d) => setPicks(d.picks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const act = (u, action) => {
    setActing(true);
    axios.post(`${API_URL}/action`, { fromTelegramId: user.telegramId, toUserId: u.id, action })
      .then((r) => {
        tg.hapticNotification('success');
        if (r.data?.match) showToast(`با ${u.firstName} مچ شدید! 💞`);
        else if (action !== 'pass') showToast('ثبت شد');
        setPicks((p) => p.filter((x) => x.id !== u.id));
        setActive(null);
      })
      .catch(() => showToast('خطا، دوباره تلاش کنید', 'error'))
      .finally(() => setActing(false));
  };

  if (loading) return <><PageHeader title="منتخب‌های امروز" /><Loading /></>;

  return (
    <div className="lp-page">
      <PageHeader title="منتخب‌های امروز" subtitle="گلچینی از بهترین پروفایل‌ها برای تو" />
      {ToastEl}

      {picks.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={30} />}
          title="فعلاً منتخبی نیست"
          sub="فردا دوباره سر بزن تا گلچین تازه‌ای برایت آماده کنیم."
          action={<button className="lp-btn lp-btn-ghost" style={{ maxWidth: 220 }} onClick={() => navigate('/')}>رفتن به کشف</button>}
        />
      ) : (
        <div className="tp-grid">
          {picks.map((u) => (
            <button key={u.id} className="tp-card" onClick={() => setActive(u)}>
              <img src={u.photoUrl || FALLBACK} alt="" className="tp-img" onError={(e) => { e.target.src = FALLBACK; }} />
              <span className="tp-badge"><Sparkles size={11} /> منتخب</span>
              <div className="tp-info">
                <span className="tp-name">
                  {u.firstName}{u.age ? `، ${u.age}` : ''}
                  {u.isVerified && <BadgeCheck size={13} color="var(--super-like)" />}
                </span>
                {u.likeCount > 0 && <span className="tp-likes"><Flame size={11} color="#FFB300" /> {u.likeCount} پسند</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="explore-modal-overlay" onClick={() => setActive(null)}>
          <div className="explore-modal" onClick={(e) => e.stopPropagation()}>
            <button className="explore-modal-close" onClick={() => setActive(null)}><X size={18} /></button>
            <div className="explore-modal-photo-wrapper">
              <img src={active.photoUrl || FALLBACK} alt="" className="explore-modal-photo" onError={(e) => { e.target.src = FALLBACK; }} />
              <div className="card-gradient-overlay" />
              <div className="explore-modal-info">
                <div className="card-name-age">
                  <span className="card-name">{active.firstName}</span>
                  {active.age && <span className="card-age">{active.age}</span>}
                  {active.isVerified && <BadgeCheck size={20} color="var(--super-like)" />}
                </div>
                {active.city && <div className="card-distance">{active.city}</div>}
              </div>
            </div>
            <div className="explore-modal-body">
              {active.bio && <div className="explore-modal-bio"><p>{active.bio}</p></div>}
              {active.interests?.length > 0 && (
                <div className="card-tags" style={{ marginTop: 12 }}>
                  {active.interests.slice(0, 6).map((t, i) => <span key={i} className="card-tag">{t}</span>)}
                </div>
              )}
            </div>
            <div className="explore-modal-actions">
              <button className="action-btn btn-pass" disabled={acting} onClick={() => act(active, 'pass')}><X size={26} /></button>
              <button className="action-btn btn-super" disabled={acting} onClick={() => act(active, 'superlike')}><Star size={22} /></button>
              <button className="action-btn btn-like" disabled={acting} onClick={() => act(active, 'like')}><Heart size={26} fill="#fff" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopPicks;
