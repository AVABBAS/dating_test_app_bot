import React, { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Flame, Heart, LayoutGrid, User, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { getTelegramData, API_URL } from './telegram';

const Discover = lazy(() => import('./pages/Discover'));
const Explore = lazy(() => import('./pages/Explore'));
const Matches = lazy(() => import('./pages/Matches'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const More = lazy(() => import('./pages/More'));
const Premium = lazy(() => import('./pages/Premium'));
const LikesYou = lazy(() => import('./pages/LikesYou'));
const Store = lazy(() => import('./pages/Store'));
const TopPicks = lazy(() => import('./pages/TopPicks'));
const Prompts = lazy(() => import('./pages/Prompts'));
const Verification = lazy(() => import('./pages/Verification'));
const Gifts = lazy(() => import('./pages/Gifts'));
const Settings = lazy(() => import('./pages/Settings'));
const SafetyCenter = lazy(() => import('./pages/SafetyCenter'));
const Filters = lazy(() => import('./pages/Filters'));
const Events = lazy(() => import('./pages/Events'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Passport = lazy(() => import('./pages/Passport'));
const Notifications = lazy(() => import('./pages/Notifications'));

const primaryNav = [
  { path: '/', label: 'کشف', icon: Flame },
  { path: '/explore', label: 'کاوش', icon: Compass },
  { path: '/matches', label: 'مچ‌ها', icon: Heart },
  { path: '/profile', label: 'پروفایل', icon: User },
  { path: '/more', label: 'بیشتر', icon: LayoutGrid },
];

const rootPaths = new Set(primaryNav.map((item) => item.path));
const FALLBACKS = {
  '/chat': '/matches', '/prompts': '/profile', '/verification': '/profile',
  '/premium': '/more', '/likes-you': '/more', '/store': '/more', '/top-picks': '/more',
  '/gifts': '/more', '/settings': '/more', '/safety': '/more', '/filters': '/more',
  '/events': '/more', '/leaderboard': '/more', '/passport': '/more', '/notifications': '/more',
};
function fallbackFor(pathname) { return pathname.startsWith('/chat/') ? '/matches' : FALLBACKS[pathname] || '/'; }
function safeBack(navigate, pathname) {
  const idx = window.history.state?.idx;
  if (typeof idx === 'number' && idx > 0) navigate(-1);
  else navigate(fallbackFor(pathname), { replace: true });
}

class RouteErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error('Vibe route rendering failed', error); }
  handleRetry = () => { this.setState({ hasError: false }); window.location.reload(); };
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="boot-screen error-state" role="alert"><div className="brand-mark" aria-hidden="true">!</div><h2>این بخش موقتاً در دسترس نیست</h2><p>یک خطای غیرمنتظره رخ داد. دوباره تلاش کنید.</p><button type="button" className="primary-btn" onClick={this.handleRetry}>تلاش دوباره</button></div>;
  }
}

function TelegramChrome({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = rootPaths.has(location.pathname);
  const isOnboarding = location.pathname === '/onboarding';
  const showBack = !isRoot && !isOnboarding;
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return undefined;
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#09090d');
      tg.setBackgroundColor('#09090d');
      if (!showBack || !tg.BackButton) { tg.BackButton?.hide(); return undefined; }
      tg.BackButton.show();
      const goBack = () => safeBack(navigate, location.pathname);
      tg.BackButton.onClick(goBack);
      return () => tg.BackButton.offClick(goBack);
    } catch { return undefined; }
  }, [location.pathname, navigate, showBack]);
  const showBrowserBack = showBack && !window.Telegram?.WebApp?.BackButton;
  return <div className="app-shell"><div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" /><main className={`page-container ${isRoot ? 'page-root' : ''}`}>{children}</main>{showBrowserBack && <button type="button" className="mobile-back" onClick={() => safeBack(navigate, location.pathname)} aria-label="بازگشت"><ArrowRight size={20} /></button>}{!isOnboarding && isRoot && <BottomNav />}</div>;
}
function BottomNav() {
  const location = useLocation(); const navigate = useNavigate();
  return <nav className="bottom-nav" aria-label="ناوبری اصلی"><div className="bottom-nav-inner">{primaryNav.map(({ path, label, icon: Icon }) => { const active = location.pathname === path; return <button type="button" key={path} className={`nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => navigate(path)}><span className="nav-icon-wrap"><Icon size={21} strokeWidth={active ? 2.6 : 2} /></span><span>{label}</span></button>; })}</div></nav>;
}
function LoadingScreen() { return <div className="boot-screen" role="status" aria-live="polite"><div className="brand-mark" aria-hidden="true">♥</div><div className="boot-copy"><strong>Vibe</strong><span>آدم مناسب، نه فقط یک پروفایل</span></div><div className="boot-loader" aria-hidden="true"><i /><i /><i /></div></div>; }
function RouteLoading() { return <div className="route-loading" role="status" aria-live="polite"><span>در حال بارگذاری…</span></div>; }
function ErrorScreen({ message, onRetry }) { return <div className="boot-screen error-state" role="alert"><div className="brand-mark" aria-hidden="true">!</div><h2>Vibe در دسترس نیست</h2><p>{message}</p><button type="button" className="primary-btn" onClick={onRetry}>تلاش دوباره</button></div>; }
function ProfileGate({ user, children }) { const location = useLocation(); if (!user) return null; if (location.pathname === '/onboarding') return children; if (user.age == null) return <Navigate to="/onboarding" replace />; return children; }

function AppContent() {
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [user, setUser] = useState(null); const navigate = useNavigate(); const initialized = useRef(false);
  const boot = async () => {
    try {
      setError(''); setLoading(true); const tgData = getTelegramData();
      if (!tgData?.user || !tgData?.initData) throw new Error('TELEGRAM_REQUIRED');
      const { data } = await axios.post(`${API_URL}/user`, { telegramId: tgData.user.id, firstName: tgData.user.first_name || '', lastName: tgData.user.last_name || '', username: tgData.user.username || '', initData: tgData.initData });
      if (!data || typeof data !== 'object' || !data.telegramId) throw new Error('INVALID_USER_RESPONSE');
      setUser(data); if (data.age == null) navigate('/onboarding', { replace: true });
    } catch (err) { console.error('Mini App bootstrap failed', err); setError(err.message === 'TELEGRAM_REQUIRED' ? 'این مینی‌اپ باید از داخل تلگرام باز شود.' : 'اتصال به سرویس برقرار نشد. دوباره تلاش کنید.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (initialized.current) return; initialized.current = true; boot(); }, []);
  const patchUser = (patch) => setUser((current) => ({ ...(current || {}), ...patch }));
  const completeOnboarding = (updatedUser) => { patchUser(updatedUser); navigate('/', { replace: true }); };
  const logout = () => window.Telegram?.WebApp?.close?.();
  if (loading) return <LoadingScreen />; if (error) return <ErrorScreen message={error} onRetry={boot} />; if (!user) return <ErrorScreen message="اطلاعات کاربر دریافت نشد." onRetry={boot} />;
  return <TelegramChrome><ProfileGate user={user}><RouteErrorBoundary><Suspense fallback={<RouteLoading />}><Routes>
    <Route path="/" element={<Discover user={user} />} /><Route path="/explore" element={<Explore user={user} />} /><Route path="/matches" element={<Matches user={user} />} /><Route path="/chat/:matchId" element={<Chat user={user} />} /><Route path="/profile" element={<Profile user={user} onChange={patchUser} onLogout={logout} />} />
    <Route path="/onboarding" element={<Onboarding user={user} onComplete={completeOnboarding} />} /><Route path="/more" element={<More user={user} />} /><Route path="/premium" element={<Premium user={user} onChange={patchUser} />} /><Route path="/likes-you" element={<LikesYou user={user} />} /><Route path="/store" element={<Store user={user} onChange={patchUser} />} /><Route path="/top-picks" element={<TopPicks user={user} />} />
    <Route path="/prompts" element={<Prompts user={user} />} /><Route path="/verification" element={<Verification user={user} onChange={patchUser} />} /><Route path="/gifts" element={<Gifts user={user} />} /><Route path="/settings" element={<Settings user={user} />} /><Route path="/safety" element={<SafetyCenter user={user} />} /><Route path="/filters" element={<Filters user={user} />} /><Route path="/events" element={<Events user={user} />} /><Route path="/leaderboard" element={<Leaderboard user={user} />} /><Route path="/passport" element={<Passport user={user} onChange={patchUser} />} /><Route path="/notifications" element={<Notifications user={user} />} /><Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></RouteErrorBoundary></ProfileGate></TelegramChrome>;
}
export default function App() { return <BrowserRouter><AppContent /></BrowserRouter>; }
