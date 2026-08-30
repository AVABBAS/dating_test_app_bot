import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PageHeader, Loading, EmptyState, Avatar, Segmented } from '../components/UI';
import { getTelegramData } from '../telegram';
import { CalendarDays, MapPin, Users, X, Check, Plus } from 'lucide-react';

const tg = getTelegramData();

const fmtDate = (d) =>
  new Intl.DateTimeFormat('fa-IR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

const Events = ({ user }) => {
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null); // full event
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = (category) => {
    setLoading(true);
    api.events({ telegramId: user?.telegramId, category })
      .then((d) => {
        setCategories(d.categories || []);
        setEvents(d.events || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user?.telegramId) load(cat); /* eslint-disable-next-line */ }, [user, cat]);

  const catOptions = [{ value: 'all', label: 'همه' }, ...categories.map((c) => ({ value: c.id, label: `${c.emoji} ${c.label}` }))];
  const emojiFor = (id) => categories.find((c) => c.id === id)?.emoji || '📌';

  const toggleJoin = (ev, e) => {
    e?.stopPropagation();
    if (busyId) return;
    setBusyId(ev.id);
    const fn = ev.joined ? api.leaveEvent : api.joinEvent;
    fn(ev.id, user.telegramId)
      .then((r) => {
        const upd = { joined: r.joined, attendeeCount: r.attendeeCount };
        setEvents((list) => list.map((x) => (x.id === ev.id ? { ...x, ...upd } : x)));
        setDetail((d) => (d && d.id === ev.id ? { ...d, ...upd } : d));
        tg.hapticImpact('light');
      })
      .catch(() => {})
      .finally(() => setBusyId(null));
  };

  const openDetail = (ev) => {
    setDetailLoading(true);
    setDetail(ev); // show immediately with summary
    api.event(ev.id, user.telegramId)
      .then((d) => setDetail(d.event))
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  };

  return (
    <div className="lp-page">
      <PageHeader title="رویدادها" subtitle="آدم‌های جدید را از نزدیک ببین" />

      <div className="ev-cats">
        <Segmented options={catOptions} value={cat} onChange={setCat} />
      </div>

      {loading ? (
        <Loading />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={40} color="var(--secondary-color)" />}
          title="رویدادی در این دسته نیست"
          sub="دسته دیگری را امتحان کن یا بعداً سر بزن."
        />
      ) : (
        <div className="ev-list">
          {events.map((ev) => (
            <div key={ev.id} className="ev-card" onClick={() => openDetail(ev)}>
              <div className="ev-cover">
                {ev.coverUrl
                  ? <img src={ev.coverUrl} alt={ev.title} />
                  : <div className="ev-cover-fallback">{emojiFor(ev.category)}</div>}
                <span className="ev-cat-badge">{emojiFor(ev.category)} {categories.find((c) => c.id === ev.category)?.label || 'رویداد'}</span>
              </div>
              <div className="ev-body">
                <h3 className="ev-title">{ev.title}</h3>
                <div className="ev-meta">
                  <span><CalendarDays size={13} /> {fmtDate(ev.startsAt)}</span>
                  {ev.city && <span><MapPin size={13} /> {ev.city}</span>}
                </div>
                <div className="ev-foot">
                  <span className="ev-attendees"><Users size={14} /> {ev.attendeeCount} نفر</span>
                  <button
                    className={`ev-join ${ev.joined ? 'joined' : ''}`}
                    onClick={(e) => toggleJoin(ev, e)}
                    disabled={busyId === ev.id}
                  >
                    {ev.joined ? <><Check size={15} /> شرکت‌کننده</> : <><Plus size={15} /> شرکت می‌کنم</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="ev-modal-overlay" onClick={() => setDetail(null)}>
          <div className="ev-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="ev-modal-close" onClick={() => setDetail(null)}><X size={20} /></button>
            <div className="ev-modal-cover">
              {detail.coverUrl
                ? <img src={detail.coverUrl} alt={detail.title} />
                : <div className="ev-cover-fallback">{emojiFor(detail.category)}</div>}
            </div>
            <div className="ev-modal-body">
              <h2>{detail.title}</h2>
              <div className="ev-meta">
                <span><CalendarDays size={14} /> {fmtDate(detail.startsAt)}</span>
                {detail.city && <span><MapPin size={14} /> {detail.location || detail.city}</span>}
              </div>
              {detail.description && <p className="ev-desc">{detail.description}</p>}

              {detail.host && (
                <div className="ev-host">
                  <Avatar user={detail.host} size={40} />
                  <div><span className="ev-host-cap">میزبان</span><span className="ev-host-name">{detail.host.firstName || 'کاربر'}</span></div>
                </div>
              )}

              {Array.isArray(detail.attendees) && detail.attendees.length > 0 && (
                <>
                  <div className="lp-section-label">شرکت‌کننده‌ها ({detail.attendeeCount})</div>
                  <div className="ev-attendee-strip">
                    {detail.attendees.slice(0, 12).map((a) => (
                      <div key={a.id} className="ev-att"><Avatar user={a} size={44} showBadges={false} /></div>
                    ))}
                  </div>
                </>
              )}

              <button
                className={`lp-btn ${detail.joined ? 'lp-btn-ghost' : 'lp-btn-primary'} ev-modal-join`}
                onClick={(e) => toggleJoin(detail, e)}
                disabled={busyId === detail.id || detailLoading}
              >
                {detail.joined ? <><Check size={17} /> در این رویداد شرکت داری</> : <><Plus size={17} /> شرکت می‌کنم</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
