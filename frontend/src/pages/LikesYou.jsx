import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { api, API_URL } from '../api';
import { PageHeader, Loading, EmptyState, useToast, FALLBACK } from '../components/UI';
import { getTelegramData } from '../telegram';
import { Heart, Lock, Crown, Star, Sparkles } from 'lucide-react';

const tg = getTelegramData();

const LikesYou = ({ user }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const { showToast, ToastEl } = useToast();

  const load = () => {
    if (!user?.telegramId) return;
    api.likesYou(user.telegramId)
      .then(setData)
      .catch(() => setData({ count: 0, premium: false, users: [] }))
      .finally(() => setLoading(false));
  };
  useEffect(load, [user]);

  const likeBack = (u) => {
    setActing(u.id);
    axios.post(`${API_URL}/action`, {
      fromTelegramId: user.telegramId,
      toUserId: u.id,
      action: 'like',
    })
      .then((r) => {
        tg.hapticNotification('success');
        if (r.data?.match) showToast(`با ${u.firstName} مچ شدید! 💞`);
        else showToast('پسند ثبت شد');
        setData((d) => ({ ...d, users: d.users.filter((x) => x.id !== u.id), count: Math.max(0, d.count - 1) }));
      })
      .catch(() => showToast('خطا، دوباره تلاش کنید', 'error'))
      .finally(() => setActing(null));
  };

  if (loading) return <><PageHeader title="پسندیدنت" /><Loading /></>;

  const premium = data?.premium;
  const users = data?.users || [];

  return (
    <div className="lp-page">
      <PageHeader title="پسندیدنت" subtitle={`${data?.count || 0} نفر تو را پسندیده‌اند`} />
      {ToastEl}

      {!premium && users.length > 0 && (
        <button className="ly-upsell" onClick={() => navigate('/premium')}>
          <Crown size={22} color="#fff" fill="#FFD700" />
          <div className="ly-upsell-text">
            <b>ببین چه کسانی تو را پسندیده‌اند</b>
            <span>با Lovely Premium قفل همه‌ی پروفایل‌ها باز می‌شود</span>
          </div>
        </button>
      )}

      {users.length === 0 ? (
        <EmptyState
          icon={<Heart size={30} />}
          title="هنوز کسی نمانده"
          sub="به سوایپ ادامه بده تا افراد جدید تو را پیدا کنند."
          action={<button className="lp-btn lp-btn-ghost" style={{ maxWidth: 220 }} onClick={() => navigate('/')}>رفتن به کشف</button>}
        />
      ) : (
        <div className="ly-grid">
          {users.map((u) => (
            <div key={u.id} className={`ly-card ${u.locked ? 'locked' : ''}`}>
              <img src={u.photoUrl || FALLBACK} alt="" className="ly-img" onError={(e) => { e.target.src = FALLBACK; }} />
              {u.action === 'superlike' && (
                <span className="ly-super"><Star size={12} fill="#fff" /> سوپرلایک</span>
              )}
              {u.locked ? (
                <div className="ly-lock" onClick={() => navigate('/premium')}>
                  <Lock size={24} color="#fff" />
                </div>
              ) : (
                <>
                  <div className="ly-info">
                    <span className="ly-name">
                      {u.firstName}{u.age ? `، ${u.age}` : ''}
                      {u.isVerified && <Sparkles size={12} color="var(--super-like)" />}
                    </span>
                    {u.city && <span className="ly-city">{u.city}</span>}
                  </div>
                  <button
                    className="ly-like-btn"
                    disabled={acting === u.id}
                    onClick={() => likeBack(u)}
                  >
                    <Heart size={18} fill="#fff" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LikesYou;
