import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X, BadgeCheck } from 'lucide-react';

// ── Sticky page header with a back button ──
export function PageHeader({ title, subtitle, right, onBack }) {
  const navigate = useNavigate();
  return (
    <div className="lp-header glass-panel">
      <button className="lp-back" onClick={onBack || (() => navigate(-1))} aria-label="بازگشت">
        <ChevronLeft size={22} />
      </button>
      <div className="lp-header-titles">
        <h2>{title}</h2>
        {subtitle && <span>{subtitle}</span>}
      </div>
      <div className="lp-header-right">{right}</div>
    </div>
  );
}

// ── Full-page centered spinner ──
export function Loading({ label = 'در حال بارگذاری…' }) {
  return (
    <div className="lp-loading">
      <div className="lp-spinner" />
      <p>{label}</p>
    </div>
  );
}

// ── Empty state ──
export function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="lp-empty">
      <div className="lp-empty-icon">{icon}</div>
      <h3>{title}</h3>
      {sub && <p>{sub}</p>}
      {action}
    </div>
  );
}

// ── Toast hook ──
export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  }, []);
  const ToastEl = toast ? (
    <div className={`lp-toast ${toast.type}`}>
      {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
      {toast.msg}
    </div>
  ) : null;
  return { showToast, ToastEl };
}

const FALLBACK = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop';

// ── Avatar with online dot, verified & premium badges ──
export function Avatar({ user, size = 56, showBadges = true, ring }) {
  const photo = user?.photoUrl || FALLBACK;
  return (
    <div className="lp-avatar" style={{ width: size, height: size }}>
      <div className={`lp-avatar-img-wrap ${ring ? 'lp-ring' : ''} ${user?.isPremium ? 'lp-ring-premium' : ''}`}>
        <img src={photo} alt={user?.firstName || ''} onError={(e) => { e.target.src = FALLBACK; }} />
      </div>
      {showBadges && user?.isOnline && <span className="lp-online-dot" />}
      {showBadges && user?.isVerified && (
        <span className="lp-verified-badge" style={{ width: size * 0.32, height: size * 0.32 }}>
          <BadgeCheck size={size * 0.32} color="#fff" fill="#00C6FF" />
        </span>
      )}
    </div>
  );
}

// ── Simple pill/segmented control ──
export function Segmented({ options, value, onChange }) {
  return (
    <div className="lp-segmented">
      {options.map((o) => (
        <button
          key={o.value}
          className={`lp-seg ${value === o.value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <span className="lp-seg-icon">{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── iOS-style toggle ──
export function Toggle({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      className={`lp-toggle ${on ? 'on' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onChange(!on)}
      aria-pressed={on}
    >
      <span className="lp-toggle-thumb" />
    </button>
  );
}

export { FALLBACK };
