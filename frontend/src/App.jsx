import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { getTelegramData, API_URL } from './telegram';
import axios from 'axios';
import { Flame, Compass, Heart, User, LayoutGrid } from 'lucide-react';

// Core pages
import Discover from './pages/Discover';
import Explore from './pages/Explore';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';

// New sections
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

const BottomNav = () => {
  const navigate = useNavigate();
  const _location = useLocation(); // eslint-disable-line no-unused-vars
  const path = _location.pathname;

  // Hide bottom nav on chat, onboarding and secondary/detail pages
  const hideOn = ['/chat', '/onboarding', '/premium', '/likes-you', '/store', '/top-picks',
    '/prompts', '/verification', '/gifts', '/settings', '/safety', '/filters',
    '/events', '/leaderboard', '/passport', '/notifications'];
  if (hideOn.some((p) => path.startsWith(p))) return null;

  const navItems = [
    { path: '/', icon: Flame, label: 'کشف' },
    { path: '/explore', icon: Compass, label: 'گردش' },
    { path: '/matches', icon: Heart, label: 'پیام‌ها' },
    { path: '/profile', icon: User, label: 'پروفایل' },
    { path: '/more', icon: LayoutGrid, label: 'بیشتر' },
  ];

  return (
    <div className="bottom-nav">
      {navItems.map(({ path: p, icon: Icon, label }) => {
        const isActive = path === p;
        return (
          <button
            key={p}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(p)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={24} className="nav-icon" aria-hidden="true" />
            <span className="nav-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const tgRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initApp = async () => {
      try {
        const tgData = getTelegramData();
        tgRef.current = tgData;
        
        if (!tgData.user) {
          setError('Please open this app inside Telegram.');
          setLoading(false);
          return;
        }

        // Register / fetch user — server will auto-fetch Telegram profile photo
        const response = await axios.post(`${API_URL}/user`, {
          telegramId: tgData.user.id,
          firstName: tgData.user.first_name,
          lastName: tgData.user.last_name || '',
          username: tgData.user.username || '',
          initData: tgData.initData, // Send raw initData for server-side validation
        });

        setUser(response.data);

        // Check if onboarding is complete (age must be set)
        const isComplete = response.data.age != null;
        if (!isComplete) {
          navigate('/onboarding', { replace: true });
        }
      } catch (err) {
        console.error('App init error:', err);
        const dummyUser = { telegramId: 123, age: null };
        setUser(dummyUser);
        navigate('/onboarding', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    initApp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Telegram BackButton integration
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const handleBack = () => {
      const currentPath = location.pathname;
      
      // Define navigation hierarchy
      const detailPages = ['/chat', '/premium', '/likes-you', '/store', '/top-picks',
        '/prompts', '/verification', '/gifts', '/settings', '/safety', '/filters',
        '/events', '/leaderboard', '/passport', '/notifications'];
      
      if (detailPages.some(p => currentPath.startsWith(p))) {
        navigate(-1);
      } else if (currentPath !== '/') {
        navigate('/');
      }
    };

    tg.BackButton.onClick(handleBack);
    
    return () => {
      tg.BackButton.offClick(handleBack);
    };
  }, [location, navigate]);

  // Update BackButton visibility based on current route
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const currentPath = location.pathname;
    const rootPaths = ['/', '/explore', '/matches', '/profile', '/more'];
    
    if (rootPaths.includes(currentPath)) {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }
  }, [location]);

  // Allow child pages to update the shared user object (e.g. after subscribing or editing profile)
  const patchUser = (patch) => setUser((u) => ({ ...u, ...patch }));

  // Logout = close the Telegram WebApp (there is no session to clear in a Mini App)
  const handleLogout = () => {
    try { window.Telegram?.WebApp?.close(); } catch { /* fallback */ }
    setUser(null);
    navigate('/onboarding', { replace: true });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Heart className="loading-heart" size={64} color="#FF4B4B" fill="#FF4B4B" />
        <p>Finding matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>Oops!</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Discover user={user} />} />
          <Route path="/explore" element={<Explore user={user} />} />
          <Route path="/matches" element={<Matches user={user} />} />
          <Route path="/chat/:matchId" element={<Chat user={user} />} />
          <Route path="/profile" element={<Profile user={user} onChange={patchUser} onLogout={handleLogout} />} />
          <Route path="/onboarding" element={<Onboarding user={user} onComplete={() => navigate('/')} />} />

          {/* New sections */}
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
      </div>
      <BottomNav />
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
