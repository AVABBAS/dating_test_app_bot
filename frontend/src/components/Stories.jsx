import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { getTelegramData } from '../telegram';
import { FALLBACK } from './UI';
import { Plus, X, Eye, Send, Image as ImageIcon } from 'lucide-react';

const tg = getTelegramData();
const STORY_MS = 5000;

// Horizontal stories bar shown on top of Discover.
export default function Stories({ user }) {
  const [groups, setGroups] = useState([]);
  const [viewer, setViewer] = useState(null); // { gi, ii }
  const [composer, setComposer] = useState(false);

  const load = useCallback(() => {
    if (!user?.telegramId) return;
    api.stories(user.telegramId).then((d) => setGroups(d.stories || [])).catch(() => {});
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const mine = groups.find((g) => g.isMine);
  const others = groups.filter((g) => !g.isMine);

  const openAt = (group) => {
    const gi = groups.indexOf(group);
    setViewer({ gi, ii: 0 });
  };

  return (
    <div className="st-bar">
      {/* Add / my story */}
      <button className="st-item" onClick={() => (mine ? openAt(mine) : setComposer(true))}>
        <div className={`st-ring ${mine?.hasUnseen ? '' : 'mine'}`}>
          <div className="st-avatar">
            <img src={user?.photoUrl || FALLBACK} alt="" onError={(e) => { e.target.src = FALLBACK; }} />
          </div>
          <span className="st-add" onClick={(e) => { e.stopPropagation(); setComposer(true); }}><Plus size={13} /></span>
        </div>
        <span className="st-label">استوری تو</span>
      </button>

      {others.map((g) => (
        <button key={g.user.id} className="st-item" onClick={() => openAt(g)}>
          <div className={`st-ring ${g.hasUnseen ? 'unseen' : 'seen'}`}>
            <div className="st-avatar">
              <img src={g.user.photoUrl || FALLBACK} alt="" onError={(e) => { e.target.src = FALLBACK; }} />
            </div>
          </div>
          <span className="st-label">{g.user.firstName}</span>
        </button>
      ))}

      {viewer && (
        <StoryViewer
          groups={groups}
          start={viewer}
          me={user}
          onClose={() => { setViewer(null); load(); }}
          onViewed={(id) => api.viewStory(id, user.telegramId).catch(() => {})}
        />
      )}

      {composer && (
        <StoryComposer
          user={user}
          onClose={() => setComposer(false)}
          onPosted={() => { setComposer(false); load(); }}
        />
      )}
    </div>
  );
}

// ── Full-screen story viewer ──
function StoryViewer({ groups, start, me, onClose, onViewed }) {
  const [gi, setGi] = useState(start.gi);
  const [ii, setIi] = useState(start.ii);
  const [progress, setProgress] = useState(0);
  const timer = useRef(null);
  const group = groups[gi];
  const item = group?.items[ii];

  const advance = useCallback(() => {
    if (ii < group.items.length - 1) { setIi(ii + 1); setProgress(0); }
    else if (gi < groups.length - 1) { setGi(gi + 1); setIi(0); setProgress(0); }
    else onClose();
  }, [ii, gi, group, groups, onClose]);

  const back = () => {
    if (ii > 0) { setIi(ii - 1); setProgress(0); }
    else if (gi > 0) { const pg = groups[gi - 1]; setGi(gi - 1); setIi(pg.items.length - 1); setProgress(0); }
  };

  // Mark viewed + run progress timer
  useEffect(() => {
    if (!item) return;
    if (!item.seen && !group.isMine) onViewed(item.id);
    setProgress(0);
    const startT = Date.now();
    timer.current = setInterval(() => {
      const p = Math.min(100, ((Date.now() - startT) / STORY_MS) * 100);
      setProgress(p);
      if (p >= 100) { clearInterval(timer.current); advance(); }
    }, 50);
    return () => clearInterval(timer.current);
  }, [gi, ii]); // eslint-disable-line

  if (!item) return null;

  return (
    <div className="sv-overlay">
      <div className="sv-progress">
        {group.items.map((_, idx) => (
          <div key={idx} className="sv-progress-track">
            <div className="sv-progress-fill" style={{ width: idx < ii ? '100%' : idx === ii ? `${progress}%` : '0%' }} />
          </div>
        ))}
      </div>

      <div className="sv-header">
        <div className="sv-user">
          <img src={group.user.photoUrl || FALLBACK} alt="" onError={(e) => { e.target.src = FALLBACK; }} />
          <span>{group.isMine ? 'استوری تو' : group.user.firstName}</span>
          <span className="sv-time">{timeAgo(item.createdAt)}</span>
        </div>
        <button className="sv-close" onClick={onClose}><X size={24} /></button>
      </div>

      <img className="sv-image" src={item.imageUrl || FALLBACK} alt="" onError={(e) => { e.target.src = FALLBACK; }} />
      {item.caption && <div className="sv-caption">{item.caption}</div>}

      {group.isMine && (
        <div className="sv-views"><Eye size={15} /> {item.views || 0} بازدید</div>
      )}

      <div className="sv-tap sv-tap-left" onClick={back} />
      <div className="sv-tap sv-tap-right" onClick={advance} />
    </div>
  );
}

// ── Story composer ──
function StoryComposer({ user, onClose, onPosted }) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);

  const preset = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600',
    'https://images.unsplash.com/photo-1495954380655-01609180eda3?w=600',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600',
  ];

  const post = () => {
    const img = url.trim() || user?.photoUrl;
    if (!img) return;
    setBusy(true);
    api.addStory(user.telegramId, img, caption.trim())
      .then(() => { tg.hapticNotification('success'); onPosted(); })
      .catch(() => setBusy(false));
  };

  return (
    <div className="sv-overlay composer" onClick={onClose}>
      <div className="st-composer glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="st-composer-head">
          <h3>استوری جدید</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="st-preview">
          <img src={url.trim() || user?.photoUrl || FALLBACK} alt="" onError={(e) => { e.target.src = FALLBACK; }} />
          {caption && <div className="st-preview-caption">{caption}</div>}
        </div>
        <div className="st-presets">
          {preset.map((p) => (
            <button key={p} className={`st-preset ${url === p ? 'active' : ''}`} onClick={() => setUrl(p)}>
              <img src={p} alt="" />
            </button>
          ))}
        </div>
        <div className="st-composer-field">
          <ImageIcon size={16} color="var(--text-secondary)" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="یا لینک عکس دلخواه…" />
        </div>
        <div className="st-composer-field">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="یک کپشن بنویس (اختیاری)" maxLength={120} />
        </div>
        <button className="lp-btn lp-btn-primary" disabled={busy} onClick={post}>
          <Send size={16} /> {busy ? 'در حال انتشار…' : 'انتشار استوری'}
        </button>
      </div>
    </div>
  );
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'همین حالا';
  return `${h} ساعت پیش`;
}
