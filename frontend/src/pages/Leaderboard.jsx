import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PageHeader, Loading, EmptyState, Avatar } from '../components/UI';
import { Trophy, Heart, Crown } from 'lucide-react';

const MEDAL = ['🥇', '🥈', '🥉'];

const Leaderboard = ({ user }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard()
      .then((d) => setLeaders(d.leaders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <><PageHeader title="جدول برترین‌ها" /><Loading /></>;

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  // Reorder podium as 2 - 1 - 3 for the classic look
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="lp-page">
      <PageHeader title="جدول برترین‌ها" subtitle="محبوب‌ترین‌های این هفته" />

      {leaders.length === 0 ? (
        <EmptyState
          icon={<Trophy size={40} color="#FFB300" />}
          title="جدول هنوز خالی است"
          sub="این هفته هنوز لایکی ثبت نشده. اولین نفر باش!"
        />
      ) : (
        <>
          {/* Podium */}
          <div className="lb-podium">
            {podium.map((l) => {
              const place = l.rank; // actual rank
              return (
                <div key={l.user.id} className={`lb-pod lb-pod-${place}`}>
                  <div className="lb-pod-crown">{place === 1 && <Crown size={20} color="#FFB300" fill="#FFB300" />}</div>
                  <div className="lb-pod-avatar"><Avatar user={l.user} size={place === 1 ? 76 : 60} /></div>
                  <span className="lb-pod-name">{l.user.firstName || 'کاربر'}</span>
                  <span className="lb-pod-likes"><Heart size={12} fill="var(--primary-color)" color="var(--primary-color)" /> {l.likes}</span>
                  <div className="lb-pod-base">{MEDAL[place - 1]}</div>
                </div>
              );
            })}
          </div>

          {/* Rest of the list */}
          {rest.length > 0 && (
            <div className="lb-list">
              {rest.map((l) => (
                <div key={l.user.id} className="lb-row glass-panel">
                  <span className="lb-rank">{l.rank}</span>
                  <Avatar user={l.user} size={44} />
                  <span className="lb-name">{l.user.firstName || 'کاربر'}{l.user.age ? `، ${l.user.age}` : ''}</span>
                  <span className="lb-likes"><Heart size={13} fill="var(--primary-color)" color="var(--primary-color)" /> {l.likes}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
