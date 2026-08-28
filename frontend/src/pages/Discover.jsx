import { useState, useEffect } from 'react'
import axios from 'axios'
import { Heart, X } from 'lucide-react'

const API_URL = 'https://datingtestappbot-production.up.railway.app/api'

export default function Discover({ user }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(`${API_URL}/discover/${user.telegramId}`)
      setProfiles(res.data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const handleAction = async (targetUserId, action) => {
    // Optimistically remove card
    setProfiles(prev => prev.filter(p => p.id !== targetUserId))
    
    try {
      const res = await axios.post(`${API_URL}/action`, {
        fromTelegramId: user.telegramId,
        toUserId: targetUserId,
        action: action
      })
      
      if (res.data.match) {
        // We could show a match modal here
        alert("It's a match! Check your matches tab.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}>Finding people near you...</div>
  if (profiles.length === 0) return <div style={{textAlign: 'center', marginTop: '50px'}}>No more profiles to show right now. Check back later!</div>

  const currentProfile = profiles[0]

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <div className="card-container">
        <div 
          className="swipe-card" 
          style={{ backgroundImage: `url(${currentProfile.photoUrl})` }}
        >
          <div className="card-info">
            <h2 className="card-title">
              {currentProfile.firstName || currentProfile.username} 
              <span className="card-age">{currentProfile.age}</span>
            </h2>
            <p className="card-bio">{currentProfile.bio}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
        <button 
          className="btn btn-icon btn-pass" 
          onClick={() => handleAction(currentProfile.id, 'pass')}
        >
          <X size={32} />
        </button>
        <button 
          className="btn btn-icon btn-like" 
          onClick={() => handleAction(currentProfile.id, 'like')}
        >
          <Heart size={32} />
        </button>
      </div>
    </div>
  )
}
