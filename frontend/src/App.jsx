import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { getTelegramData, API_URL } from './telegram';
import axios from 'axios';
import { Flame, Compass, Heart, MessageCircle, User } from 'lucide-react';

// Pages
import Discover from './pages/Discover';
import Explore from './pages/Explore';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hide bottom nav in chat and onboarding
  if (location.pathname.startsWith('/chat') || location.pathname === '/onboarding') {
    return null;
  }

  const navItems = [
    { path: '/', icon: Flame, label: 'Discover' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/matches', icon: Heart, label: 'Matches' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="bottom-nav">
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path;
        return (
          <button 
            key={path} 
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={24} className="nav-icon" />
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

  useEffect(() => {
    const initApp = async () => {
      try {
        const tgData = getTelegramData();
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
        });

        setUser(response.data);

        // Check if onboarding is complete (age must be set)
        const isComplete = response.data.age != null;
        if (!isComplete && location.pathname !== '/onboarding') {
          navigate('/onboarding', { replace: true });
        }
      } catch (err) {
        console.error('App init error:', err);
        const dummyUser = { telegramId: 123, age: null };
        setUser(dummyUser);
        if (location.pathname !== '/onboarding') {
          navigate('/onboarding', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, [navigate, location.pathname]);

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
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/onboarding" element={<Onboarding user={user} onComplete={() => navigate('/')} />} />
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
