import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { initTelegramApp, getUser, getTelegramId } from './telegram'
import { Heart, MessageCircle, User } from 'lucide-react'
import axios from 'axios'

import Discover from './pages/Discover'
import Matches from './pages/Matches'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'

const API_URL = import.meta.env.VITE_API_URL || window.location.origin + '/api'

function App() {
  const [userState, setUserState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      initTelegramApp()
    } catch (e) {
      console.warn('Telegram init failed:', e)
    }
    
    // Login or create user
    const tgUser = getUser()
    console.log('Telegram user:', tgUser)
    
    axios.post(`${API_URL}/user`, {
      telegramId: tgUser.id,
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name
    }).then(res => {
      console.log('User data:', res.data)
      setUserState(res.data)
      setLoading(false)
    }).catch(err => {
      console.error('API error:', err)
      setError(err.message || 'Failed to connect to server')
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="app-container" style={{justifyContent: 'center', alignItems: 'center'}}>
        <div className="glass-panel" style={{textAlign: 'center', padding: '40px'}}>
          <div style={{fontSize: '48px', marginBottom: '16px'}}>💕</div>
          <p style={{color: 'var(--text-secondary)'}}>Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-container" style={{justifyContent: 'center', alignItems: 'center'}}>
        <div className="glass-panel" style={{textAlign: 'center', padding: '40px'}}>
          <div style={{fontSize: '48px', marginBottom: '16px'}}>⚠️</div>
          <h3 style={{marginBottom: '12px'}}>Connection Error</h3>
          <p style={{color: 'var(--text-secondary)', marginBottom: '20px'}}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // If user hasn't completed onboarding (missing age/gender/lookingFor/photo)
  if (!userState?.age || !userState?.gender || !userState?.photoUrl) {
    return (
      <div className="app-container">
        <Onboarding user={userState} onComplete={(updatedUser) => setUserState(updatedUser)} />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Discover user={userState} />} />
          <Route path="/matches" element={<Matches user={userState} />} />
          <Route path="/profile" element={<Profile user={userState} onUpdate={setUserState} />} />
        </Routes>
        
        <div className="bottom-nav">
          <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} end>
            <Heart size={24} />
            <span>Discover</span>
          </NavLink>
          <NavLink to="/matches" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <MessageCircle size={24} />
            <span>Matches</span>
          </NavLink>
          <NavLink to="/profile" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <User size={24} />
            <span>Profile</span>
          </NavLink>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
