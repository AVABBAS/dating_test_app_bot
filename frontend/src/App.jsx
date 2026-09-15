import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Flame, Heart, LayoutGrid, User, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { getTelegramData, API_URL } from './telegram';

import Discover from './pages/Discover';
import Explore from './pages/Explore';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import More from './pages/More';
import Premium from './pages/Premium';
import LikesYou from './pages/LikesYou';
import Store from './pages/Store';
import TopPicks from './pages/TopPicks';
import Prompts from './pages/Prompts';
import Verification from './pages/Verification';
import Gifts from './pages/Gifts';
import Settings from './pages/Settings';
import SafetyCenter from './pages/SafetyCenter';
import Filters from './pages/Filters';
import Events from './pages/Events';
import Leaderboard from './pages/Leaderboard';
import Passport from './pages/Passport';
import Notifications from './pages/Notifications';

const primaryNav = [
  { path: '/', label: 'کشف', icon: Flame },
  { path: '/explore', label: 'کاوش', icon: Compass },
  { path: '/matches', label: 'مچ‌ها', icon: Heart },
  { path: '/profile', label: 'پروفایل', icon: User },
  { path: '/more', label: 'بیشتر', icon: LayoutGrid },
];

const secondary = ['/chat', '/premium', '/likes-you', '/store', '/top-picks', '/prompts', '/verification', '/gifts', '/settings', '/safety', '/filters', '/events', '/leaderboard', '/passport', '/notifications'];

function TelegramChrome({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const root = primaryNav.some((item) => item.path === location.pathname);
  const onboarding = location.pathname === '/onboarding';
  const showBack = !root && !onboarding;

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0b0b0f');
      tg.setBackgroundColor('#0b0b0f');
      if (showBack) {
        tg.BackButton.show();
        const goBack = () => navigate(-1);
        tg.BackButton.onClick(goBack);
        return () => tg.BackButton.offClick(goBack);
      }
      tg.BackButton.hide();
    } catch {}
  }, [location.pathname, navigate, showBack]);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      {showBack && (
        <button className="mobile-back" onClick={() => navigate(-1)} aria-label="بازگشت">
          <ArrowLeft size={20} />
        </button>
      )}
      <main className={`page-container ${root ? 'page-root' : ''}`}>{children}</main>
      {!onboarding && root && <BottomNav />}
    </div>
  );
}

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav" aria-label="ناوبری اصلی">
      <div className="bottom-nav-inner">
        {primaryNav.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button key={path} className={`nav-item ${active ? 'active' : ''}`} onClick={() => navigate(path)}>
              <span className="nav-icon-wrap"><Icon size={21} strokeWidth={active ? 2.6 : 2} /></span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function LoadingScreen() {
  return (
    <div className="boot-screen">
      <div className="brand-mark">♥</div>
      <div className="boot-copy"><strong>Vibe</strong><span>آدم مناسب، نه فقط یک پروفایل</span></div>
      <div className="boot-loader"><i /><i /><i /></div>
    </div>
  );
}

function AppContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function boot() {
      try {
        const tgData = getTelegramData();
        if (!tgData?.user || !tgData?.initData) throw new Error('TELEGRAM_REQUIRED');

        const { data } = await axios.post(`${API_URL}/user`, {
          telegramId: tgData.user.id,
          firstName: tgData.user.first_name || '',
          lastName: tgData.user.last_name || '',
          username: tgData.user.username || '',
          initData: tgData.initData,
        });

        setUser(data);
        if (data.age == null) navigate('/onboarding', { replace: true });
      } catch (err) {
        console.error('Mini App bootstrap failed', err);
        setError(err.message === 'TELEGRAM_REQUIRED'
          ? 'این مینی‌اپ باید از داخل تلگرام باز شود.'
          : 'اتصال به سرویس برقرار نشد. دوباره تلاش کنید.');
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, [navigate]);

  const patchUser = (patch) => setUser((current) => ({ ...current, ...patch }));
  const logout = () => window.Telegram?.WebApp?.close?.();

  if (loading) return <LoadingScreen />;
  if (error) return (
    <div className="boot-screen error-state">
      <div className="brand-mark">!</div>
      <h2>Vibe در دسترس نیست</h2>
      <p>{error}</p>
      <button className="primary-btn" onClick={() => window.location.reload()}>تلاش دوباره</button>
    </div>
  );

  return (
    <TelegramChrome>
      <Routes>
        <Route path="/" element={<Discover user={user} />} />
        <Route path="/explore" element={<Explore user={user} />} />
        <Route path="/matches" element={<Matches user={user} />} />
        <Route path="/chat/:matchId" element={<Chat user={user} />} />
        <Route path="/profile" element={<Profile user={user} onChange={patchUser} onLogout={logout} />} />
        <Route path="/onboarding" element={<Onboarding user={user} onComplete={() => navigate('/')} />} />
        <Route path="/more" element={<More user={user} />} />
        <Route path="/premium" element={<Premium user={user} onChange={patchUser} />} />
        <Route path="/likes-you" element={<LikesYou user={user} />} />
        <Route path="/store" element={<Store user={user} onChange={patchUser} />} />
        <Route path="/top-picks" element={<TopPicks user={user} />} />
        <Route path="/prompts" element={<Prompts user={user} />} />
        <Route path="/verification" element={<Verification user={user} onChange={patchUser} />} />
        <Route path="/gifts" element={<Gifts user={user} />} />
        <Route path="/settings" element={<Settings user={user} />} />
        <Route path="/safety" element={<SafetyCenter user={user} />} />
        <Route path="/filters" element={<Filters user={user} />} />
        <Route path="/events" element={<Events user={user} />} />
        <Route path="/leaderboard" element={<Leaderboard user={user} />} />
        <Route path="/passport" element={<Passport user={user} onChange={patchUser} />} />
        <Route path="/notifications" element={<Notifications user={user} />} />
      </Routes>
    </TelegramChrome>
  );
}

export default function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>;
}
